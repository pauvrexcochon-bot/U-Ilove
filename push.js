/* U&I : notifications push (client).
   À configurer : VAPID_PUBLIC et FN_URL ci-dessous (voir LISEZMOI-PUSH.md). */
(function () {
  var VAPID_PUBLIC = 'BKN_ouxQ0NgRLHCT3PkK2xAnaWPBArcnxMskx8Zlj2K1UYkn_1NA3p6EeQCIWwaffuHmyECzz1JrPxQV828ddgE';
  /* Si le site est sur Netlify : laisse tel quel.
     Si le site est sur GitHub Pages : mets l'adresse complète, ex. 'https://ma-fonction.netlify.app/.netlify/functions/push' */
  var FN_URL = 'https://dazzling-horse-f6d13a.netlify.app/.netlify/functions/push';

  if (VAPID_PUBLIC.indexOf('COLLE') === 0) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.firebase || !firebase.apps.length) return;

  var auth = firebase.auth(), fs = firebase.firestore();
  var SYS = '\u2063', regP = null, unsub = null, known = {}, first = true;

  function u8(b64) {
    var p = '='.repeat((4 - b64.length % 4) % 4), s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(s, function (c) { return c.charCodeAt(0); });
  }
  function sha(t) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function reg() {
    if (!regP) regP = navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; });
    return regP;
  }
  function subscribe(user) {
    if (Notification.permission !== 'granted') return Promise.resolve();
    return reg().then(function (r) {
      return r.pushManager.getSubscription().then(function (s) {
        return s || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(VAPID_PUBLIC) });
      });
    }).then(function (sub) {
      return sha(sub.endpoint).then(function (h) {
        var o = {}; o[h] = JSON.stringify(sub.toJSON());
        return fs.collection('pushSubs').doc(user.uid).set({ subs: o }, { merge: true });
      });
    }).catch(function () {});
  }

  /* demande l'autorisation au premier appui, puis abonne cet appareil */
  document.addEventListener('click', function ask() {
    if (!auth.currentUser || Notification.permission !== 'default') return;
    document.removeEventListener('click', ask);
    Notification.requestPermission().then(function () { subscribe(auth.currentUser); });
  });

  /* quand JE envoie un message, je préviens la fonction qui notifie les autres */
  function ping(chatId) {
    var u = auth.currentUser; if (!u) return;
    u.getIdToken().then(function (token) {
      return fetch(FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token, chatId: chatId }) });
    }).catch(function () {});
  }
  function watch(user) {
    known = {}; first = true;
    unsub = fs.collection('chats').where('members', 'array-contains', user.uid).onSnapshot(function (sn) {
      sn.docChanges().forEach(function (ch) {
        if (ch.type === 'removed') return;
        var v = ch.doc.data(), id = ch.doc.id, prev = known[id] || 0;
        known[id] = v.lastTs || 0;
        if (first || v.lastUid !== user.uid || !(v.lastTs > prev)) return;
        if (String(v.lastText || '').charAt(0) === SYS) return;
        ping(id);
      });
      first = false;
    }, function () {});
  }

  auth.onAuthStateChanged(function (user) {
    if (unsub) { unsub(); unsub = null; }
    if (!user) return;
    subscribe(user);
    watch(user);
  });
})();

/* U&I — js/app/18-compte.js
   Likes de profil, mot de passe, suppression du compte
   (fait partie de l’appli : assemblée par js/boot/loader.js dans une seule fermeture) */
  /* ---------- likes de profil ---------- */
  var likeUnsub = null, likeState = { uid: null, n: 0, mine: false };
  function paintLike() {
    var b = $('#nvLike');
    b.classList.toggle('on', likeState.mine);
    b.setAttribute('aria-pressed', likeState.mine ? 'true' : 'false');
    b.firstChild.textContent = likeState.mine ? '♥' : '♡';
    $('#nvLikeN').textContent = likeState.n;
    b.disabled = likeState.uid === state.me;
  }
  function stopLikes() { if (likeUnsub) { likeUnsub(); likeUnsub = null; } }
  function watchLikes(uid) {
    stopLikes();
    likeState = { uid: uid, n: 0, mine: false };
    $('#nvLikeErr').hidden = true;
    paintLike();
    likeUnsub = fs.collection('profileLikes').where('to', '==', uid).onSnapshot(function (s) {
      likeState.n = s.size;
      likeState.mine = s.docs.some(function (d) { return d.data().from === state.me; });
      paintLike();
    }, function () {
      var e = $('#nvLikeErr');
      e.textContent = 'Likes indisponibles : ajoute la règle « profileLikes » dans les règles Firestore.';
      e.hidden = false;
    });
  }
  $('#nvLike').addEventListener('click', function () {
    var uid = likeState.uid;
    if (!uid || uid === state.me) return;
    var ref = fs.collection('profileLikes').doc(uid + '_' + state.me);
    var err = $('#nvLikeErr'); err.hidden = true;
    var p = likeState.mine ? ref.delete() : ref.set({ to: uid, from: state.me, ts: Date.now() });
    p.catch(function () {
      err.textContent = 'Le like n’a pas pu être enregistré (connexion ou règles Firestore).';
      err.hidden = false;
    });
  });
  nvDlg.addEventListener('close', stopLikes);
  [neDlg, nvDlg].forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });

  /* ---------- mot de passe : changer, code de récupération, mot de passe oublié ---------- */
  var TE = new TextEncoder(), TD = new TextDecoder();
  function b64(u) { return btoa(String.fromCharCode.apply(null, u)); }
  function unb64(t) { return Uint8Array.from(atob(t), function (c) { return c.charCodeAt(0); }); }
  function rcKey(code, salt) {
    var raw = TE.encode(code.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    return crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 200000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function rcSave(uname, code, pass) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return rcKey(code, salt).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, TE.encode(pass)); }).then(function (ct) {
      return fs.collection('recovery').doc(uname).set({ salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)), uid: auth.currentUser.uid });
    });
  }
  function rcOpen(uname, code) {
    return fs.collection('recovery').doc(uname).get().then(function (d) {
      if (!d.exists) throw new Error('none');
      var v = d.data();
      return rcKey(code, unb64(v.salt)).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, k, unb64(v.ct)); });
    }).then(function (b) { return TD.decode(b); });
  }
  function newCode() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(20)), s = '', i;
    for (i = 0; i < 20; i++) { s += A[r[i] % 32]; if (i % 5 === 4 && i < 19) s += '-'; }
    return s;
  }
  function pwErr(t) { var e = $('#pwErr'); e.textContent = t || ''; e.hidden = !t; }
  function pwReauth() {
    var u = auth.currentUser, p = $('#pwCur').value;
    if (!u || !p) { pwErr('Entre ton mot de passe actuel.'); return Promise.reject(null); }
    return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, p)).catch(function (e) {
      pwErr(e && e.code === 'auth/too-many-requests' ? 'Trop d’essais. Réessaie dans quelques minutes.' : 'Mot de passe actuel incorrect.'); throw null;
    });
  }
  $('#pwChange').addEventListener('click', function () {
    var np = $('#pwNew').value; pwErr(''); $('#pwCode').hidden = true;
    if (np.length < 6) { pwErr('Le nouveau mot de passe doit faire au moins 6 caractères.'); return; }
    pwReauth().then(function () { return auth.currentUser.updatePassword(np); })
      .then(function () { return fs.collection('recovery').doc(state.username).delete().catch(function () {}); })
      .then(function () { $('#pwCur').value = ''; $('#pwNew').value = ''; pwErr('Mot de passe changé. Crée un nouveau code de récupération.'); })
      .catch(function (e) { if (e) pwErr('Changement impossible.'); });
  });
  $('#pwRec').addEventListener('click', function () {
    var p = $('#pwCur').value, c = newCode(); pwErr('');
    if (!(window.crypto && crypto.subtle)) { pwErr('Ouvre le site en https.'); return; }
    pwReauth().then(function () { return rcSave(state.username, c, p); })
      .then(function () { var h = $('#pwCode'); h.textContent = 'Ton code (note-le, il ne sera plus affiché) : ' + c; h.hidden = false; $('#pwCur').value = ''; })
      .catch(function (e) { if (e) pwErr('Code impossible : vérifie les règles Firestore (recovery).'); });
  });
  function forgotErr(t) { var e = $('#forgotErr'); e.textContent = t || ''; e.hidden = !t; }
  function forgotShow(mode) {   /* mode : 'mail', 'code' ou null (retour à la connexion) */
    authForm.hidden = !!mode;
    $('#forgotMail').hidden = mode !== 'mail';
    $('#forgotForm').hidden = mode !== 'code';
    $('#forgotLink').textContent = mode ? '← Retour' : 'Mot de passe oublié ?';
    forgotErr(''); fmErr('');
  }
  $('#forgotLink').addEventListener('click', function () {
    forgotShow(authForm.hidden ? null : (emUrl() ? 'mail' : 'code'));
  });
  $('#fmSwap').addEventListener('click', function () { forgotShow('code'); });
  $('#fcSwap').addEventListener('click', function () { if (emUrl()) forgotShow('mail'); else forgotErr('Les codes par e-mail ne sont pas encore activés.'); });
  $('#forgotForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var n = $('#fu').value.trim().toLowerCase().replace(/\s+/g, ''), c = $('#fc').value.trim(), np = $('#fp').value, b = $('#forgotBtn');
    forgotErr('');
    if (!n || !c) { forgotErr('Entre ton nom d’utilisateur et ton code.'); return; }
    if (np && np.length < 6) { forgotErr('Le nouveau mot de passe doit faire au moins 6 caractères.'); return; }
    if (!(window.crypto && crypto.subtle)) { forgotErr('Ouvre le site en https.'); return; }
    b.disabled = true;
    rcOpen(n, c).then(function (pass) {
      return auth.signInWithEmailAndPassword(n + '@' + CFG.emailDomain, pass).then(function (cred) {
        if (!np) return;
        return cred.user.updatePassword(np).then(function () { return rcSave(n, c, np); });
      });
    }).catch(function () { forgotErr('Code ou nom d’utilisateur incorrect.'); }).then(function () { b.disabled = false; });
  });

  /* ---------- supprimer mon compte ---------- */
  function accErr(t) { var e = $('#accErr'); e.textContent = t || ''; e.hidden = !t; }
  function resetAcc() {
    $('#accConfirm').hidden = true; $('#accDel').hidden = false;
    $('#accPass').value = ''; $('#accGo').disabled = false; accErr('');
  }
  async function purgeBatch(q) {
    for (var g = 0; g < 50; g++) {
      var sn = await q.limit(400).get();
      if (sn.empty) return;
      var bt = fs.batch();
      sn.docs.forEach(function (d) { bt.delete(d.ref); });
      await bt.commit();
    }
  }
  async function delIfExists(ref) {
    var d = await ref.get();
    if (d.exists) await ref.delete();
  }
  async function deleteAccount() {
    var user = auth.currentUser, pass = $('#accPass').value;
    if (!user || !state.me) return;
    if (!pass) { accErr('Entre ton mot de passe pour confirmer.'); return; }
    var go = $('#accGo'); go.disabled = true; accErr('');
    var uid = state.me, uname = state.username;
    try {
      await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, pass));
    } catch (e) {
      go.disabled = false;
      var c = e && e.code;
      accErr(c === 'auth/too-many-requests' ? 'Trop d’essais. Réessaie dans quelques minutes.' :
        c === 'auth/network-request-failed' ? 'Pas de connexion internet.' : 'Mot de passe incorrect.');
      return;
    }
    state.deleting = true;
    var FV = firebase.firestore.FieldValue, i;
    try {
      // discussions : les messages privés sont effacés ; un groupe survit sans toi
      var cs = await fs.collection('chats').where('members', 'array-contains', uid).get();
      for (i = 0; i < cs.docs.length; i++) {
        var ref = cs.docs[i].ref, cd = cs.docs[i].data() || {};
        var others = (cd.members || []).filter(function (m) { return m !== uid; });
        if (cd.group && others.length) {
          var upd = { members: FV.arrayRemove(uid) };
          upd['names.' + uid] = FV.delete(); upd['nicks.' + uid] = FV.delete();
          if (cd.owner === uid) upd.owner = others[0];
          await ref.update(upd);
        } else {
          await purgeBatch(ref.collection('messages'));
          await ref.delete();
        }
      }
      // discussions anonymes
      var ats = await fs.collection('anonThreads').where('members', 'array-contains', uid).get();
      for (i = 0; i < ats.docs.length; i++) {
        await purgeBatch(ats.docs[i].ref.collection('messages'));
        await ats.docs[i].ref.delete();
      }
      // lettres et commentaires anonymes écrits par ce compte
      var lo = await fs.collection('letterOwners').where('uid', '==', uid).get();
      for (i = 0; i < lo.docs.length; i++) {
        var ov = lo.docs[i].data() || {};
        if (ov.letter) { try { await fs.collection('letters').doc(ov.letter).collection('comments').doc(lo.docs[i].id).delete(); } catch (e) {} }
        else await fs.collection('letters').doc(lo.docs[i].id).delete();
        await lo.docs[i].ref.delete();
      }
      // amis, likes de profil, abonnement push, profil anonyme, présence, récupération, nom
      await purgeBatch(fs.collection('friendships').where('members', 'array-contains', uid));
      await purgeBatch(fs.collection('profileLikes').where('from', '==', uid));
      await purgeBatch(fs.collection('profileLikes').where('to', '==', uid));
      await delIfExists(fs.collection('pushSubs').doc(uid));
      await delIfExists(fs.collection('anonProfiles').doc(uid));
      await delIfExists(fs.collection('presence').doc(uid));
      if (uname) {
        await delIfExists(fs.collection('recovery').doc(uname));
        await delIfExists(fs.collection('usernames').doc(uname));
      }
      try { await delIfExists(fs.collection('approvals').doc(uid)); } catch (e) {}
    } catch (e) {
      state.deleting = false; go.disabled = false;
      accErr('Suppression interrompue : certaines données n’ont pas pu être effacées (vérifie la connexion et que les règles Firestore à jour sont publiées). Ton compte n’a pas été supprimé : réessaie.');
      return;
    }
    try {
      await user.delete();
    } catch (e) {
      state.deleting = false; go.disabled = false;
      accErr('Le compte n’a pas pu être supprimé. Reconnecte-toi puis réessaie.');
      return;
    }
    store('uandi-nseen-' + uid, null); store('uandi-hidden-' + uid, null);
    setDlg.close();
    setMode('signup');
    setAuthErr('Ton compte a été supprimé. Tu peux en créer un nouveau.');
  }
  $('#accDel').addEventListener('click', function () {
    $('#accConfirm').hidden = false; $('#accDel').hidden = true; accErr('');
    $('#accPass').focus();
  });
  $('#accCancel').addEventListener('click', resetAcc);
  $('#accGo').addEventListener('click', deleteAccount);
  setDlg.addEventListener('close', resetAcc);


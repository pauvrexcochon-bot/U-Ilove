/* U&I — js/boot/loader.js
   Chargeur : Firebase (4 miroirs), puis l’appli et ses modules dans l’ordre */
/* Démarrage robuste : charge Firebase depuis plusieurs miroirs, réessaie, et ne bloque jamais l'écran */
(function () {
  /* ---- fichiers chargés après Firebase (l'ordre compte) ---- */
  var VER = (window.APP_CONFIG && window.APP_CONFIG.version) || '1';
  var APP_PARTS = [
    'js/app/01-base.js',
    'js/app/02-connexion-presence.js',
    'js/app/03-liste-discussions.js',
    'js/app/04-amis.js',
    'js/app/05-outils-createur.js',
    'js/app/06-epingles-anniversaires-code.js',
    'js/app/07-groupes.js',
    'js/app/08-discussion.js',
    'js/app/09-notifications.js',
    'js/app/10-actions-messages.js',
    'js/app/11-apparence-profil.js',
    'js/app/12-reactions-photos.js',
    'js/app/13-fichiers-vocaux.js',
    'js/app/14-nettoyage.js',
    'js/app/15-jeu-mots.js',
    'js/app/16-alerte-notes-badges.js',
    'js/app/17-comptes-createur.js',
    'js/app/18-compte.js',
    'js/app/19-musique.js',
    'js/app/20-ecoute-ensemble.js',
    'js/app/21-appel-vocal.js',
    'js/app/22-action-verite.js',
    'js/app/23-actualites-lettres.js',
    'js/app/24-actualites-commentaires.js',
    'js/app/25-discussions-anonymes.js',
    'js/app/26-session-approbation.js',
    'js/app/27-push.js',
    'js/app/28-recuperation-email.js'
  ];
  var APP_MODULES = [
    'js/ui/onglets.js',
    'js/ui/menu-discussion.js',
    'js/games/sons.js',
    'js/games/beat-rush.js',
    'js/games/match3.js',
    'js/ui/animations.js',
    'js/ui/animations-actualites.js',
    'js/ui/retours-tactiles.js',
    'js/ui/bouton-plus.js',
    'js/ui/bande-notes.js'
  ];
  function bust(u) { return u + '?v=' + VER; }
  /* L'appli est une seule fermeture (variables partagées) coupée en parties pour être lisible :
     on charge les parties en parallèle, puis on les assemble dans l'ordre et on les exécute d'un bloc. */
  async function loadApp() {
    var texts = await Promise.all(APP_PARTS.map(function (p) {
      return fetch(bust(p)).then(function (r) { if (!r.ok) throw new Error(p + ' : HTTP ' + r.status); return r.text(); });
    }));
    var n = document.createElement('script');
    n.text = '// @ts-nocheck\n(function () {\n' + texts.join('\n') + '\n})();\n//# sourceURL=uandi-app.js';
    document.head.appendChild(n); n.remove();
  }
  /* Modules indépendants : téléchargés en parallèle, exécutés dans l'ordre (async = false) */
  function loadModules() {
    APP_MODULES.forEach(function (p) {
      var s = document.createElement('script'); s.src = bust(p); s.async = false;
      s.onerror = function () { try { console.error('Module introuvable : ' + p); } catch (e) {} };
      document.head.appendChild(s);
    });
  }
  /* ---- Firebase ---- */
  var V = '10.12.2', F = ['firebase-app-compat', 'firebase-auth-compat', 'firebase-firestore-compat'];
  var BASES = [
    function (n) { return 'https://www.gstatic.com/firebasejs/' + V + '/' + n + '.js'; },
    function (n) { return 'https://cdn.jsdelivr.net/npm/firebase@' + V + '/' + n + '.js'; },
    function (n) { return 'https://cdnjs.cloudflare.com/ajax/libs/firebase/' + V + '/' + n + '.js'; },
    function (n) { return 'https://unpkg.com/firebase@' + V + '/' + n + '.js'; }
  ];
  function say(t, retry) {
    var m = document.getElementById('splashMsg'); if (m) m.textContent = t;
    var sp = document.getElementById('splash'); if (!sp) return;
    var b = document.getElementById('splashRetry');
    if (retry && !b) {
      b = document.createElement('button'); b.id = 'splashRetry'; b.type = 'button'; b.textContent = 'Réessayer';
      b.style.cssText = 'padding:10px 24px;border:0;border-radius:999px;background:#E0457B;color:#fff;font:600 15px system-ui,sans-serif';
      b.onclick = function () { b.remove(); say('Nouvelle tentative…'); start(); };
      sp.appendChild(b);
    } else if (!retry && b) b.remove();
  }
  function one(src, ms) {
    return new Promise(function (ok, ko) {
      var s = document.createElement('script'), fin = false;
      function end(good) { if (fin) return; fin = true; clearTimeout(t); if (good) ok(); else { s.onload = s.onerror = null; try { s.remove(); } catch (e) {} ko(); } }
      var t = setTimeout(function () { end(false); }, ms);
      s.src = src; s.async = false; s.onload = function () { end(true); }; s.onerror = function () { end(false); };
      document.head.appendChild(s);
    });
  }
  async function lib(n, tryMs) {
    for (var round = 0; round < 2; round++) {
      for (var i = 0; i < BASES.length; i++) {
        try { await one(BASES[i](n), tryMs * (round + 1)); return true; } catch (e) {}
        if (n === F[0] && window.firebase) return true;
      }
    }
    return false;
  }
  async function loadFirebase() {
    if (window.firebase && firebase.auth && firebase.firestore) return true;
    say('Chargement…');
    if (!(await lib(F[0], 9000))) return false;
    say('Connexion au serveur…');
    var r = await Promise.all([lib(F[1], 9000), lib(F[2], 9000)]);
    return r[0] && r[1];
  }
  function ready() { return document.readyState !== 'loading' ? Promise.resolve() : new Promise(function (ok) { document.addEventListener('DOMContentLoaded', ok); }); }
  var started = false;
  async function start() {
    var good = await loadFirebase();
    if (!good) { say('Impossible de joindre le serveur. Vérifie ta connexion.', true); window.addEventListener('online', function () { if (!started) start(); }, { once: true }); return; }
    await ready();
    started = true;
    try { await loadApp(); }
    catch (e) {
      started = false;
      try { console.error(e); } catch (x) {}
      say('Impossible de charger l’appli. Vérifie ta connexion.', true);
      window.addEventListener('online', function () { if (!started) start(); }, { once: true });
      return;
    }
    loadModules();
  }
  start();
})();

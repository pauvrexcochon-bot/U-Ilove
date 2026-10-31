/* U&I — js/app/28-recuperation-email.js
   E-mail de récupération (demande + confirmation par code) et « mot de passe oublié » par code envoyé par e-mail
   (fait partie de l’appli : assemblée par js/boot/loader.js dans une seule fermeture) */
  /* ---------- adresse du Worker « ui-recovery » ---------- */
  function emUrl() {
    var u = String(((CFG.recovery || {}).workerUrl) || '').replace(/\/+$/, '');
    return (!u || u.indexOf('COLLE') !== -1) ? '' : u;
  }
  function emCall(path, body, authed) {
    var url = emUrl();
    if (!url) return Promise.reject({ off: true });
    function go(tok) {
      var h = { 'Content-Type': 'application/json' };
      if (tok) h.Authorization = 'Bearer ' + tok;
      return fetch(url + path, { method: body === undefined ? 'GET' : 'POST', headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._ok = r.ok; return j; }); });
    }
    return authed ? auth.currentUser.getIdToken().then(go) : go(null);
  }
  function emMsg(j) {
    var e = j && j.error;
    return e === 'wait' ? 'Attends une minute avant de demander un nouveau code.' :
      e === 'bad-email' ? 'Cette adresse e-mail n’est pas valide.' :
      e === 'mail' ? 'Le message n’a pas pu être envoyé. Réessaie dans un instant.' :
      e === 'bad-code' ? 'Code incorrect ou expiré.' :
      e === 'weak' ? 'Le mot de passe doit faire au moins 6 caractères.' :
      e === 'auth' ? 'Session expirée : reconnecte-toi puis réessaie.' :
      'Une erreur est survenue. Vérifie ta connexion et réessaie.';
  }
  function emFail(e) { return (e && e.off) ? 'Cette fonction n’est pas encore activée.' : 'Pas de connexion au serveur. Réessaie.'; }

  /* ---------- mot de passe oublié : code par e-mail ---------- */
  function fmErr(t) { var e = $('#fmErr'); e.textContent = t || ''; e.hidden = !t; }
  function fmName() { return $('#fmU').value.trim().toLowerCase().replace(/\s+/g, ''); }
  function fmSendCode(resend) {
    var n = fmName(), b = resend ? $('#fmResend') : $('#fmSend');
    fmErr('');
    if (!NAME_RE.test(n)) { fmErr('Entre ton nom d’utilisateur.'); return; }
    b.disabled = true;
    emCall('/forgot/start', { username: n }, false).then(function (j) {
      if (!j._ok) { fmErr(emMsg(j)); return; }
      $('#fmInfo').textContent = 'Si ce compte a un e-mail de récupération, un code à 6 chiffres vient d’y être envoyé. Il est valable 10 minutes.';
      $('#fmStep2').hidden = false; $('#fmSend').hidden = true; $('#fmU').readOnly = true;
      $('#fmNone').hidden = false;
      setTimeout(function () { $('#fmC').focus(); }, 50);
    }).catch(function (e) { fmErr(emFail(e)); }).then(function () { b.disabled = false; });
  }
  $('#fmSend').addEventListener('click', function () { fmSendCode(false); });
  $('#fmResend').addEventListener('click', function () { fmSendCode(true); });
  $('#forgotMail').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var n = fmName(), code = $('#fmC').value.replace(/\D/g, ''), p1 = $('#fmP').value, p2 = $('#fmP2').value, b = $('#fmGo');
    fmErr('');
    if ($('#fmStep2').hidden) { fmSendCode(false); return; }
    if (code.length !== 6) { fmErr('Entre le code à 6 chiffres reçu par e-mail.'); return; }
    if (p1.length < 6) { fmErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    if (p1 !== p2) { fmErr('Les deux mots de passe ne sont pas identiques.'); return; }
    b.disabled = true;
    emCall('/forgot/reset', { username: n, code: code, password: p1 }, false).then(function (j) {
      if (!j._ok) { fmErr(emMsg(j)); return; }
      /* mot de passe changé : on connecte directement la personne avec le nouveau */
      return auth.signInWithEmailAndPassword(n + '@' + CFG.emailDomain, p1).then(function () {
        /* l’ancien code de récupération (qui contenait l’ancien mot de passe) n’est plus valable */
        fs.collection('recovery').doc(n).delete().catch(function () {});
        fmReset();
      }).catch(function () {
        fmReset(); forgotShow(null); setAuthErr('Mot de passe changé. Connecte-toi avec le nouveau.');
      });
    }).catch(function (e) { fmErr(emFail(e)); }).then(function () { b.disabled = false; });
  });
  function fmReset() {
    ['#fmU', '#fmC', '#fmP', '#fmP2'].forEach(function (s) { $(s).value = ''; });
    $('#fmU').readOnly = false; $('#fmStep2').hidden = true; $('#fmSend').hidden = false; $('#fmNone').hidden = true; fmErr('');
  }

  /* ---------- e-mail de récupération : ajout + confirmation par code ---------- */
  var emDlg = $('#emDlg'), emStep = 1, emPending = '';
  function emErr(t) { var e = $('#emErr'); e.textContent = t || ''; e.hidden = !t; }
  function emOpen() {
    emStep = 1; emPending = '';
    $('#emStep1').hidden = false; $('#emStep2').hidden = true;
    $('#emInput').value = ''; $('#emCode').value = ''; $('#emGo').textContent = 'Envoyer le code'; $('#emGo').disabled = false;
    emErr('');
    if (!emDlg.open) emDlg.showModal();
    setTimeout(function () { $('#emInput').focus(); }, 60);
  }
  function emSkipSet() { try { store('uandi-emskip-' + state.me, String(Date.now())); } catch (e) {} }
  $('#emOpen').addEventListener('click', emOpen);
  $('#emLater').addEventListener('click', function () { emSkipSet(); emDlg.close(); });
  emDlg.addEventListener('click', function (e) { if (e.target === emDlg) { emSkipSet(); emDlg.close(); } });
  $('#emGo').addEventListener('click', function () {
    var b = $('#emGo'); emErr('');
    if (emStep === 1) {
      var mail = $('#emInput').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { emErr('Entre une adresse e-mail valide.'); return; }
      b.disabled = true;
      emCall('/email/start', { email: mail }, true).then(function (j) {
        if (!j._ok) { emErr(emMsg(j)); return; }
        emStep = 2; emPending = mail;
        $('#emStep1').hidden = true; $('#emStep2').hidden = false;
        $('#emSent').textContent = 'Un code à 6 chiffres vient d’être envoyé à ' + mail + '. Regarde aussi dans les courriers indésirables.';
        b.textContent = 'Confirmer';
        setTimeout(function () { $('#emCode').focus(); }, 60);
      }).catch(function (e) { emErr(emFail(e)); }).then(function () { b.disabled = false; });
    } else {
      var code = $('#emCode').value.replace(/\D/g, '');
      if (code.length !== 6) { emErr('Entre le code à 6 chiffres.'); return; }
      b.disabled = true;
      emCall('/email/confirm', { code: code }, true).then(function (j) {
        if (!j._ok) { emErr(emMsg(j)); return; }
        emDlg.close(); emRefresh();
        try { showToast(null, 'U&I', 'E-mail de récupération enregistré ✅'); } catch (e) {}
      }).catch(function (e) { emErr(emFail(e)); }).then(function () { b.disabled = false; });
    }
  });
  $('#emDel').addEventListener('click', function () {
    if (!window.confirm('Retirer ton e-mail de récupération ? Tu ne pourras plus recevoir de code par e-mail.')) return;
    emCall('/email/remove', {}, true).then(function () { emRefresh(); }).catch(function () {});
  });

  /* section des réglages */
  function emRefresh() {
    var sec = $('#emSec');
    if (!emUrl()) { sec.hidden = true; return Promise.resolve(null); }
    sec.hidden = false;
    if (!auth.currentUser) return Promise.resolve(null);
    return emCall('/email/status', undefined, true).then(function (j) {
      if (!j._ok) { $('#emStat').textContent = 'Indisponible pour le moment.'; return null; }
      $('#emStat').textContent = j.has ? 'E-mail enregistré : ' + j.masked : 'Aucun e-mail de récupération.';
      $('#emOpen').textContent = j.has ? 'Changer l’e-mail' : 'Ajouter un e-mail';
      $('#emDel').hidden = !j.has;
      return j;
    }).catch(function () { $('#emStat').textContent = 'Indisponible pour le moment.'; return null; });
  }

  /* demande automatique après la connexion (pas plus d’une fois tous les 3 jours si « Plus tard ») */
  auth.onAuthStateChanged(function (user) {
    if (!user) return;
    setTimeout(function () {
      if (!emUrl() || appEl.hidden || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
      emRefresh().then(function (j) {
        if (!j || j.has || document.querySelector('dialog[open]')) return;
        var last = +(store('uandi-emskip-' + user.uid) || 0);
        if (Date.now() - last < 3 * 24 * 3600 * 1000) return;
        emOpen();
      });
    }, 4500);
  });


/* U&I — js/halloween.js
   Mise à jour Halloween : disparaît toute seule le 10 novembre 2026 à minuit. */
(function () {
  // Date de fin (heure locale de l'appareil) : 10 novembre 2026, 00:00
  var END = new Date(2026, 10, 10, 0, 0, 0).getTime();
  if (Date.now() >= END) return; // terminé : rien n'est ajouté

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Styles ---------- */
  var css = [
    '#hwBar{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);',
    'z-index:50;display:flex;align-items:center;gap:10px;max-width:92vw;padding:8px 10px 8px 14px;',
    'border-radius:999px;background:linear-gradient(90deg,#2a0f3d,#6b2a00);color:#ffd9a0;',
    'border:1px solid #ff8a1f;box-shadow:0 0 18px rgba(255,138,31,.45);font:600 13px/1.2 inherit;}',
    '#hwBar button{all:unset;cursor:pointer;padding:2px 8px;border-radius:999px;color:#ffd9a0;font-size:15px}',
    '#hwFx,#hwBats{position:fixed;inset:0;pointer-events:none;overflow:hidden}',
    '#hwFx{z-index:40}',
    '#hwBats{z-index:41}',
    '#hwFx span{position:absolute;top:-8vh;user-select:none;opacity:.85;',
    'animation:hwFall linear infinite;will-change:transform}',
    '@keyframes hwFall{to{transform:translate3d(var(--dx,0),112vh,0) rotate(var(--rot,360deg))}}',
    /* chauves-souris qui traversent l'écran */
    '.hwBat{position:absolute;left:0;width:var(--w,40px);height:calc(var(--w,40px)*.55);',
    'opacity:.8;will-change:transform;animation:hwFly var(--dur,14s) linear infinite;animation-delay:var(--del,0s)}',
    '.hwBat.rtl{animation-name:hwFlyRtl}',
    '.hwBat .bob{width:100%;height:100%;animation:hwBob var(--bob,2.4s) ease-in-out infinite}',
    '.hwBat svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 0 6px rgba(160,80,255,.55))}',
    '.hwBat .wing{transform-origin:50% 55%;animation:hwFlap var(--flap,.28s) ease-in-out infinite alternate}',
    '.hwBat.rtl svg{transform:scaleX(-1)}',
    '@keyframes hwFly{from{transform:translateX(-16vw)}to{transform:translateX(116vw)}}',
    '@keyframes hwFlyRtl{from{transform:translateX(116vw)}to{transform:translateX(-16vw)}}',
    '@keyframes hwBob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(var(--amp,34px)) rotate(5deg)}}',
    '@keyframes hwFlap{from{transform:scaleY(1)}to{transform:scaleY(.25)}}',
    '#hwGlow{position:fixed;inset:0;pointer-events:none;z-index:39;',
    'box-shadow:inset 0 0 90px rgba(255,120,0,.22),inset 0 0 220px rgba(120,0,200,.18)}',
    '@media (prefers-reduced-motion:reduce){#hwFx span{animation:none;top:auto}}'
  ].join('');
  var st = document.createElement('style');
  st.id = 'hwStyle';
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Halo ---------- */
  var glow = document.createElement('div');
  glow.id = 'hwGlow';
  document.body.appendChild(glow);

  /* ---------- Objets qui tombent ---------- */
  if (!reduce) {
    var fx = document.createElement('div');
    fx.id = 'hwFx';
    var icons = ['🎃', '👻', '🕸️', '🍬', '🎃', '👻'];
    for (var i = 0; i < 12; i++) {
      var s = document.createElement('span');
      s.textContent = icons[i % icons.length];
      s.style.left = Math.round(Math.random() * 96) + 'vw';
      s.style.fontSize = (16 + Math.random() * 18).toFixed(0) + 'px';
      s.style.animationDuration = (10 + Math.random() * 12).toFixed(1) + 's';
      s.style.animationDelay = '-' + (Math.random() * 20).toFixed(1) + 's';
      s.style.setProperty('--dx', (Math.random() * 14 - 7).toFixed(1) + 'vw');
      s.style.setProperty('--rot', (Math.random() * 360 - 180).toFixed(0) + 'deg');
      fx.appendChild(s);
    }
    document.body.appendChild(fx);

    /* ---------- Chauves-souris qui volent sur le fond ---------- */
    var BAT = '<svg viewBox="0 0 100 55" aria-hidden="true">' +
      '<g class="wing" fill="#150a22">' +
      '<path d="M50 28 C40 8 20 4 2 14 C12 16 14 24 22 30 C26 24 32 26 36 33 C40 30 45 31 50 36Z"/>' +
      '<path d="M50 28 C60 8 80 4 98 14 C88 16 86 24 78 30 C74 24 68 26 64 33 C60 30 55 31 50 36Z"/>' +
      '</g>' +
      '<ellipse cx="50" cy="31" rx="7" ry="11" fill="#1d0f2e"/>' +
      '<path d="M44 22 L46 12 L50 20 L54 12 L56 22Z" fill="#1d0f2e"/>' +
      '<circle cx="47.5" cy="26" r="1.4" fill="#ff8a1f"/><circle cx="52.5" cy="26" r="1.4" fill="#ff8a1f"/>' +
      '</svg>';

    var bats = document.createElement('div');
    bats.id = 'hwBats';
    for (var b = 0; b < 7; b++) {
      var bat = document.createElement('div');
      bat.className = 'hwBat' + (b % 2 ? ' rtl' : '');
      bat.style.top = (6 + Math.random() * 78).toFixed(0) + 'vh';
      bat.style.setProperty('--w', (30 + Math.random() * 40).toFixed(0) + 'px');
      bat.style.setProperty('--dur', (9 + Math.random() * 10).toFixed(1) + 's');
      bat.style.setProperty('--del', '-' + (Math.random() * 18).toFixed(1) + 's');
      bat.style.setProperty('--bob', (1.8 + Math.random() * 2).toFixed(1) + 's');
      bat.style.setProperty('--amp', (18 + Math.random() * 40).toFixed(0) + 'px');
      bat.style.setProperty('--flap', (0.2 + Math.random() * 0.15).toFixed(2) + 's');
      bat.innerHTML = '<div class="bob">' + BAT + '</div>';
      bats.appendChild(bat);
    }
    document.body.appendChild(bats);
  }

  /* ---------- Bandeau (fermable, le choix est retenu) ---------- */
  var closed = false;
  try { closed = localStorage.getItem('uandi-hw-closed') === '1'; } catch (e) {}
  if (!closed) {
    var bar = document.createElement('div');
    bar.id = 'hwBar';
    var t = document.createElement('span');
    t.textContent = '🎃 Joyeux Halloween sur U&I !';
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Fermer');
    x.textContent = '✕';
    x.addEventListener('click', function () {
      bar.remove();
      try { localStorage.setItem('uandi-hw-closed', '1'); } catch (e) {}
    });
    bar.appendChild(t);
    bar.appendChild(x);
    document.body.appendChild(bar);
  }

  /* ---------- Frayeurs aléatoires à chaque ouverture ---------- */
  // Pour couper les frayeurs sur un appareil : localStorage.setItem('uandi-hw-calm','1')
  var calm = false;
  try { calm = localStorage.getItem('uandi-hw-calm') === '1'; } catch (e) {}
  if (!reduce && !calm) {
    var st2 = document.createElement('style');
    st2.id = 'hwStyle2';
    st2.textContent = [
      '.hwScare{position:fixed;pointer-events:none;z-index:60}',
      /* 1. Fantôme qui surgit */
      '.hwGhost{inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);',
      'font-size:42vmin;opacity:0;animation:hwGhost 1.7s ease-out forwards}',
      '@keyframes hwGhost{0%{opacity:0;transform:scale(.3)}18%{opacity:1;transform:scale(1.1)}',
      '80%{opacity:1;transform:scale(1.28)}100%{opacity:0;transform:scale(1.45)}}',
      /* 2. Araignée qui descend */
      '.hwSpider{top:-100vh;left:var(--x,50%);display:flex;flex-direction:column;align-items:center;',
      'animation:hwSpider 6s ease-in-out forwards}',
      '.hwSpider i{display:block;width:1px;height:100vh;background:rgba(220,220,220,.7)}',
      '.hwSpider b{font-size:38px;font-weight:400;line-height:1}',
      '@keyframes hwSpider{0%{transform:translateY(0)}14%{transform:translateY(calc(100vh + var(--y,45vh)))}',
      '72%{transform:translateY(calc(100vh + var(--y,45vh) + 8px))}100%{transform:translateY(0)}}',
      /* 3. Lumières qui vacillent (lent : pas de clignotement rapide) */
      '.hwDark{inset:0;background:#000;opacity:0;animation:hwFlick 3s linear forwards}',
      '@keyframes hwFlick{0%{opacity:0}12%{opacity:.88}26%{opacity:.08}44%{opacity:.92}',
      '60%{opacity:.15}78%{opacity:.85}100%{opacity:0}}',
      /* 4. Message qui glace le sang */
      '.hwText{left:0;right:0;top:38%;text-align:center;padding:0 6vw;font:italic 800 9vw/1.1 Georgia,serif;',
      'color:#c00;text-shadow:0 0 14px #f00,0 3px 0 #300;opacity:0;animation:hwTxt 4.2s ease forwards}',
      '@keyframes hwTxt{0%{opacity:0;transform:scale(.9)}15%{opacity:1;transform:scale(1)}',
      '80%{opacity:1;transform:scale(1.04)}100%{opacity:0;transform:scale(1.08)}}',
      /* 5. Yeux dans le noir */
      '.hwEye{font-size:30px;opacity:0;animation:hwEye 3.4s ease-in-out forwards}',
      '@keyframes hwEye{0%,100%{opacity:0}25%,70%{opacity:.95}}',
      /* 6. Écran qui saigne */
      '.hwBlood{inset:0;box-shadow:inset 0 0 120px 45px rgba(190,0,0,.85);opacity:0;',
      'animation:hwBlood 2.8s ease-in-out forwards}',
      '@keyframes hwBlood{0%,100%{opacity:0}30%{opacity:1}50%{opacity:.45}70%{opacity:1}}'
    ].join('');
    document.head.appendChild(st2);

    var touched = !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
    window.addEventListener('pointerdown', function () { touched = true; }, { once: true, passive: true });

    function sting() { // petit bruit grave, uniquement si la personne a déjà touché l'écran
      if (!touched) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        var ac = new AC(), o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(38, t + .9);
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.18, t + .05);
        g.gain.exponentialRampToValueAtTime(.0001, t + .95);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + 1);
        setTimeout(function () { try { ac.close(); } catch (e) {} }, 1400);
      } catch (e) {}
    }
    function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
    function put(cls, html, ms, style) {
      var d = document.createElement('div');
      d.className = 'hwScare ' + cls;
      if (html) d.innerHTML = html;
      if (style) d.setAttribute('style', style);
      document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, ms);
      return d;
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    var scares = [
      function () { put('hwGhost', '👻', 1800); sting(); buzz([120, 60, 220]); },
      function () { put('hwSpider', '<i></i><b>🕷️</b>', 6200, '--x:' + rnd(10, 85).toFixed(0) + '%;--y:' + rnd(25, 60).toFixed(0) + 'vh'); },
      function () { put('hwDark', '', 3100); sting(); },
      function () {
        var m = ['Il est derrière toi…', 'Ne te retourne pas…', 'Tu n’es pas seul(e)…', 'Je te vois…', 'Ils arrivent…'];
        put('hwText', m[Math.floor(Math.random() * m.length)], 4300);
        buzz([80, 80, 80]);
      },
      function () {
        for (var k = 0; k < 4; k++) {
          put('hwEye', '👀', 3600 + k * 400,
            'left:' + rnd(4, 86).toFixed(0) + '%;top:' + rnd(8, 88).toFixed(0) + '%;animation-delay:' + (k * .4).toFixed(1) + 's');
        }
      },
      function () { put('hwBlood', '', 2900); buzz([200, 80, 200, 80, 300]); sting(); }
    ];

    // Mélange : 2 frayeurs différentes à chaque ouverture
    var order = scares.slice().sort(function () { return Math.random() - .5; });
    var delay = rnd(4000, 9000);
    [order[0], order[1]].forEach(function (fn) {
      setTimeout(function () {
        if (Date.now() >= END || document.hidden || document.querySelector('.callui')) return;
        fn();
      }, delay);
      delay += rnd(9000, 22000);
    });
  }

  /* ---------- Voix qui font peur, au hasard toutes les ~3 minutes ---------- */
  var vTimer = null, vSubTimer = null;
  var vCalm = false;
  try { vCalm = localStorage.getItem('uandi-hw-calm') === '1'; } catch (e) {}
  if (!vCalm && window.speechSynthesis && window.SpeechSynthesisUtterance) {
    var vTouched = !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
    window.addEventListener('pointerdown', function () { vTouched = true; }, { once: true, passive: true });

    var vLines = [
      'Je suis derrière toi…',
      'Tu ne peux pas t’échapper…',
      'Je te regarde…',
      'Viens avec moi…',
      'Pourquoi tu ne dors pas ?',
      'Ils sont tous là…',
      'Ne te retourne pas…',
      'Tu m’entends ?',
      'Je sais où tu es…',
      'Joyeux Halloween… pour toujours…'
    ];
    var vLast = -1;

    function vFrench() {
      try {
        var all = speechSynthesis.getVoices() || [];
        return all.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
      } catch (e) { return null; }
    }

    function vSubtitle(txt) { // le texte s'affiche aussi à l'écran
      var d = document.createElement('div');
      d.className = 'hwVoiceSub';
      d.textContent = txt;
      d.setAttribute('style',
        'position:fixed;left:0;right:0;bottom:14vh;z-index:61;text-align:center;pointer-events:none;' +
        'padding:0 6vw;font:italic 700 6vw/1.2 Georgia,serif;color:#d11;' +
        'text-shadow:0 0 12px #f00,0 2px 0 #300;opacity:.95;transition:opacity 1.2s');
      document.body.appendChild(d);
      clearTimeout(vSubTimer);
      vSubTimer = setTimeout(function () { d.style.opacity = '0'; }, 2600);
      setTimeout(function () { d.remove(); }, 4000);
    }

    function vSpeak() {
      if (Date.now() >= END) return;
      // on attend un moment plus calme : appli visible, pas d'appel, pas de lecture en cours
      if (!vTouched || document.hidden || document.querySelector('.callui') || speechSynthesis.speaking) return;
      var i;
      do { i = Math.floor(Math.random() * vLines.length); } while (i === vLast && vLines.length > 1);
      vLast = i;
      try {
        var u = new SpeechSynthesisUtterance(vLines[i]);
        u.lang = 'fr-FR';
        var v = vFrench();
        if (v) u.voice = v;
        u.pitch = +(0.05 + Math.random() * 0.35).toFixed(2);  // voix très grave
        u.rate = +(0.55 + Math.random() * 0.25).toFixed(2);   // lente
        u.volume = +(0.7 + Math.random() * 0.3).toFixed(2);
        speechSynthesis.speak(u);
        vSubtitle(vLines[i]);
        try { navigator.vibrate && navigator.vibrate([60, 90, 60]); } catch (e) {}
      } catch (e) {}
    }

    function vNext() {
      // environ 3 minutes, avec un peu de hasard (2 min 30 à 3 min 30)
      var wait = 150000 + Math.random() * 60000;
      vTimer = setTimeout(function () {
        vSpeak();
        vNext();
      }, wait);
    }
    vNext();
  }

  /* ---------- Fin automatique (si la page reste ouverte) ---------- */
  var left = END - Date.now();
  if (left > 0 && left < 2147483647) {
    setTimeout(function () {
      ['hwBar', 'hwFx', 'hwBats', 'hwGlow', 'hwStyle', 'hwStyle2'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll('.hwScare').forEach(function (el) { el.remove(); });
      document.querySelectorAll('.hwVoiceSub').forEach(function (el) { el.remove(); });
      clearTimeout(vTimer);
      try { speechSynthesis.cancel(); } catch (e) {}
    }, left);
  }
})();

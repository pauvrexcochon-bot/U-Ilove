// Service worker des notifications push U&I — à placer à la racine du site, à côté de l'appli.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Clic sur la notification : on ouvre (ou ramène) l'appli.
// Déclaré avant firebase.messaging() pour passer avant le gestionnaire interne.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) if ('focus' in list[i]) return list[i].focus();
    return clients.openWindow('./');
  }));
});

firebase.initializeApp({
  apiKey: 'AIzaSyCoHtDPfDbogSjRZmBp4uxZg-7LunSSpuw',
  authDomain: 'u-i-love.firebaseapp.com',
  projectId: 'u-i-love',
  storageBucket: 'u-i-love.firebasestorage.app',
  messagingSenderId: '631777729747',
  appId: '1:631777729747:web:597bdd14d49433cfb90826'
});
firebase.messaging(); // les messages « notification » sont affichés automatiquement

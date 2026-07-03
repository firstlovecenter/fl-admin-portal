/* eslint-disable */
// Firebase Cloud Messaging service worker (web/PWA).
//
// This is a SEPARATE service worker from the vite-plugin-pwa (Workbox) one that
// caches the app shell. FCM registers this file at its own scope to obtain a
// token and to show notifications while the tab is backgrounded; the two
// coexist. Uses the compat build (service workers can't use ES modules here),
// pinned to the same major as the app's `firebase` dependency.
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js'
)

// Public client config for the flc-platform-dev "Synago" web app (not secrets).
// Keep in sync with src/services/firebaseMessaging.ts. Prod (flc-platform-prod)
// needs its own values.
firebase.initializeApp({
  apiKey: 'AIzaSyBABDnaD6pmyAjffxADrqrPUfyNim6c3ss',
  authDomain: 'flc-platform-dev.firebaseapp.com',
  projectId: 'flc-platform-dev',
  storageBucket: 'flc-platform-dev.firebasestorage.app',
  messagingSenderId: '48942564042',
  appId: '1:48942564042:web:dde1cbc74786eb6e502a33',
})

const messaging = firebase.messaging()

// Show a notification when a message arrives while the tab is backgrounded.
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  if (notification.title) {
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/android-chrome-192x192.png',
    })
  }
})

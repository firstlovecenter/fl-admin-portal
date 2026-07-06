/* eslint-disable */
// Firebase Cloud Messaging service worker (web/PWA).
//
// This is a SEPARATE service worker from the vite-plugin-pwa (Workbox) one that
// caches the app shell. It is registered at the default scope ('/') to obtain
// an FCM token and to show notifications while the tab is backgrounded; FCM
// keys background delivery off this registration's push subscription, so it
// coexists with the Workbox SW. Uses the compat build (service workers can't
// use ES modules here), pinned to the same major as the app's `firebase` dep.
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js'
)

// Per-environment Firebase config (dev → flc-platform-dev, prod →
// flc-platform-prod). A service worker can't read Vite's import.meta.env, so the
// app forwards the resolved config as this file's registration query string
// (see acquireToken in src/services/firebaseMessaging.ts). We read it back from
// our own URL and fall back to the flc-platform-dev public config if a param is
// missing (e.g. the SW was somehow registered without a query string).
const params = new URL(self.location).searchParams
const cfg = (key, fallback) => params.get(key) || fallback

firebase.initializeApp({
  apiKey: cfg('apiKey', 'AIzaSyBABDnaD6pmyAjffxADrqrPUfyNim6c3ss'),
  authDomain: cfg('authDomain', 'flc-platform-dev.firebaseapp.com'),
  projectId: cfg('projectId', 'flc-platform-dev'),
  storageBucket: cfg('storageBucket', 'flc-platform-dev.firebasestorage.app'),
  messagingSenderId: cfg('messagingSenderId', '48942564042'),
  appId: cfg('appId', '1:48942564042:web:dde1cbc74786eb6e502a33'),
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

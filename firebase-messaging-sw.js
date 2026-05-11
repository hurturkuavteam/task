// Firebase Cloud Messaging Service Worker
// Bu dosya push bildirimleri için gereklidir.
// Firebase Hosting'e deploy ederken bu dosyayı kök dizine koyun.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD53ERkLf2LZKG8AdaVXUYFZpPPzrUbfUk",
  authDomain: "task-55fe4.firebaseapp.com",
  databaseURL: "https://task-55fe4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "task-55fe4",
  storageBucket: "task-55fe4.firebasestorage.app",
  messagingSenderId: "493726498040",
  appId: "1:493726498040:web:ae55dfcf7f39458be24f0d",
  measurementId: "G-CXHL45NGYP"
};

const messaging = firebase.messaging();

// Arka planda gelen bildirimleri yakala
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'HurTürk UAV', {
    body: body || 'Yeni bir görev eklendi.',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'hurturk-task',
    data: payload.data
  });
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.0/firebase-messaging-compat.js");

// Your specific Firebase credentials from mess-script.js
firebase.initializeApp({
  apiKey: "AIzaSyBWA-zRkPFH4svRjkMUO80TUdI9zIm5ICc",
  projectId: "phantom-messaging-a5bf0",
  messagingSenderId: "475147330421",
  appId: "1:475147330421:web:6fe73f781a9dbf443ca93c"
});

const messaging = firebase.messaging();

// Handles background notifications when the tab is CLOSED or in another tab
messaging.onBackgroundMessage((payload) => {
  console.log("Service Worker: Received background message", payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.jpg", // Ensure this exists in your root
    badge: "/icon.png",
    tag: "phantom-chat", // Prevents stacking multiple notifications
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click behavior: Focuses the app when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

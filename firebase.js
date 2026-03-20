// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC1HbuxatlVcEBjafFU5NWcXTOYoF0KA9U",
  authDomain: "sehataiguide.firebaseapp.com",
  projectId: "sehataiguide",
  storageBucket: "sehataiguide.firebasestorage.app",
  messagingSenderId: "56986654799",
  appId: "1:56986654799:web:eba164f34d30b31635323a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log("Service Worker registered");
    });
}

// Request Permission + Get Token
async function initNotifications() {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    console.log("Notification permission granted");

    const token = await getToken(messaging, {
      vapidKey: "BDImJDnwe83EmzpvprB910_UbKKBnkV1EPV5i2vlJpcPUNBBOy5Ij8OTJ-ymr9qqYXomXIOpNEfDfniaHAGuUZc"
    });

    console.log("FCM Token:", token);

  } else {
    console.log("Permission denied");
  }
}

initNotifications();

// Foreground messages
onMessage(messaging, (payload) => {
  console.log("Message received:", payload);

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/images/icon.png"
  });
});

// 👇 ADD THIS AT THE END
window.testNotification = async function () {

  const permission = await Notification.requestPermission();

  console.log("Permission:", permission);

  if (permission === "granted") {

    new Notification("SehatGuide AI", {
      body: "Notifications are working! 💊",
      icon: "/images/icon.png"
    });

  } else {
    alert("Permission denied");
  }

};

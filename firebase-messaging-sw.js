importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC1HbuxatlVcEBjafFU5NWcXTOYoF0KA9U",
  authDomain: "sehataiguide.firebaseapp.com",
  projectId: "sehataiguide",
  messagingSenderId: "56986654799",
  appId: "1:56986654799:web:eba164f34d30b31635323a"
});

const messaging = firebase.messaging();
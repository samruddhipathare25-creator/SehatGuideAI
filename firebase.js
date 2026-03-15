// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Ask notification permission
Notification.requestPermission().then(permission => {
  if (permission === "granted") {

    getToken(messaging, {
      vapidKey: "..."
    }).then((token) => {

      console.log("User Notification Token:", token);

    });

  }
});

// Receive message when site is open
onMessage(messaging, (payload) => {

  alert(payload.notification.title + "\n" + payload.notification.body);

});

Notification.requestPermission().then(permission => {

if(permission === "granted"){
console.log("Notification allowed");
}else{
console.log("Notification denied");
}

});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(function(registration) {
    console.log('Service Worker registered');
  });
}




window.testNotification = async function () {

  const permission = await Notification.requestPermission();

  console.log("Permission status:", permission);

  if (permission === "granted") {

    new Notification("SehatGuide AI", {
      body: "Notifications are working! 💊",
      icon: "/images/icon.png"
    });

  } else {

    alert("Notification permission denied or blocked");

  }

};

function enableNotifications(){

Notification.requestPermission().then(permission => {

if(permission === "granted"){

new Notification("SehatGuide AI",{
body:"Notifications enabled successfully"
});

}

});

}

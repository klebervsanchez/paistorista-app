// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCT9QQ9-AUvngXp0c_7l9yQXpDk1seAgmw",
  authDomain: "paistorista-57706.firebaseapp.com",
  projectId: "paistorista-57706",
  storageBucket: "paistorista-57706.appspot.com",
  messagingSenderId: "934152031761",
  appId: "1:934152031761:web:f0182855df02966e462bb0",
  measurementId: "G-X4KZM1NZ83"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


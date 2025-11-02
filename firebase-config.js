// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCT9QQ9-AUvngXp0c_7l9yQXpDk1seAgmw",
  authDomain: "paistorista-57706.firebaseapp.com",
  projectId: "paistorista-57706",
  storageBucket: "paistorista-57706.appspot.com",  // <- corrigido ".app" para ".app**spot.com**"
  messagingSenderId: "934152031761",
  appId: "1:934152031761:web:f0182855df02966e462bb0",
  measurementId: "G-X4KZM1NZ83"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Exporta os módulos necessários
export { auth, provider, db };

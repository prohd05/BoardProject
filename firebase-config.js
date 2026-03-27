// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDxEYTF9WEzZXqTki_embajxm49l00BKsI",
    authDomain: "board-project-3a242.firebaseapp.com",
    projectId: "board-project-3a242",
    storageBucket: "board-project-3a242.firebasestorage.app",
    messagingSenderId: "1051644738675",
    appId: "1:1051644738675:web:166fe5f5e8012fcb7fbe06",
    measurementId: "G-7DD3DCX358"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
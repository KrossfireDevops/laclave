//src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCv-dFubOdKUNwUvXcnLtI4y4AV6j1X9eo",
  authDomain: "laclave-app-299c3.firebaseapp.com",
  projectId: "laclave-app-299c3",
  storageBucket: "laclave-app-299c3.firebasestorage.app",
  messagingSenderId: "1059753358935",
  appId: "1:1059753358935:web:cca82a6439eeb1f69c1512",
  measurementId: "G-WMZE4EHF3Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
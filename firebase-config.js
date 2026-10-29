
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9hRuTfACNxisI2vdp9FQCNQ5arwVGJcs",
  authDomain: "digital-scam-awareness.firebaseapp.com",
  databaseURL: "https://digital-scam-awareness-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "digital-scam-awareness",
  storageBucket: "digital-scam-awareness.firebasestorage.app",
  messagingSenderId: "238075967859",
  appId: "1:238075967859:web:e3fb0d15d0250bab65ad06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Connect the database and authentication
export const db = getDatabase(app);
export const auth = getAuth(app);

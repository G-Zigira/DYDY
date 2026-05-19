// ============================================================
// DYDY AI — Firebase Configuration
// Replace ALL placeholder values before going live.
// ============================================================

// ── Step 1: Your Firebase project config ──────────────────
// console.firebase.google.com → Project Settings → Web App → SDK setup
const firebaseConfig = {
  apiKey:            "AIzaSyC-7SEOkQGcUh_bE0Yc-7M_PZn7BQlEYY0",
  authDomain:        "dydy-cd8fa.firebaseapp.com",
  projectId:         "dydy-cd8fa",
  storageBucket:     "dydy-cd8fa.firebasestorage.app",
  messagingSenderId: "1055039117357",
  appId:             "1:1055039117357:web:397d06b1c36fdcc49700a4"
};

// ── Step 2: Advisor UID ───────────────────────────────────
// Have Handy sign in once, then copy his UID from:
// Firebase Console → Authentication → Users → copy UID column
export const ADVISOR_UID   = "ADVISOR_FIREBASE_UID_HERE";
export const ADVISOR_NAME  = "Handy Verna";
export const ADVISOR_TITLE = "Conseiller Financier Certifié";

// ── Firebase SDK (module-based, no install needed) ────────
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();

export {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc
};

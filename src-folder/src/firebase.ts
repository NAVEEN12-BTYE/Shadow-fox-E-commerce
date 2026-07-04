import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase client config. Values are read from Vite env vars (see .env.example),
// falling back to the config generated for this AI Studio project.
// Firebase client API keys are not secret — access is controlled by
// firestore.rules and Firebase Auth, not by hiding this key.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDafibGF8UNnq9C30Hqd8u3s0Lkkp_VlCs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0057447951.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0057447951",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0057447951.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "389858196101",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:389858196101:web:8469d5236f9cad2b8f87ec",
};

// Named Firestore database (non-default) as configured in firebase-applet-config.json
const FIRESTORE_DATABASE_ID = "ai-studio-remixaicommerce-bc18dc66-c194-4e50-83d4-1a3119abba58";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

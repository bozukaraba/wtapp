import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCNzrILdGIlH3LcNfGrc0OaccppZaXayNw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wtapp-9cc5a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://wtapp-9cc5a-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wtapp-9cc5a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wtapp-9cc5a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "337478815088",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:337478815088:web:aa76c6a347802b03e2d3b5",
};

// Firebase uygulamasını başlat
export const app = initializeApp(firebaseConfig);

// Firebase servislerini export et
export const auth = getAuth(app);
export const db = getFirestore(app);

// Storage için custom bucket kullan
export const storage = getStorage(app, "gs://wtapp-9cc5a.firebasestorage.app");

// FCM - sadece destekleniyorsa
let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(() => {
  messaging = null;
});

export { messaging };

// VAPID key
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

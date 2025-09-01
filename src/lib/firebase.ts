import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase uygulamasını başlat
export const app = initializeApp(firebaseConfig);

// Firebase servislerini export et
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// FCM - sadece destekleniyorsa
export const messaging = await isSupported() ? getMessaging(app) : null;

// VAPID key
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

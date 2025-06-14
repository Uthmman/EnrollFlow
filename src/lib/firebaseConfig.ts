
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// These values should be stored in your .env.local file
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      'Firebase API Key or Project ID is missing. ' +
      'Please check your environment variables (e.g., .env.local) and ensure ' +
      'NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'
    );
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let db;
let auth;

try {
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Error initializing Firebase services (Firestore/Auth):", error);
  console.error(
    "This might be due to missing or incorrect Firebase configuration in your environment variables."
  );
}

export { db, auth, app };

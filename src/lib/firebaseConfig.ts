
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
  // Ensure all required config values are present before initializing
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      'Firebase API Key or Project ID is missing. ' +
      'Please check your environment variables (e.g., .env.local) and ensure ' +
      'NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'
    );
    // Depending on how you want to handle this, you could throw an error
    // or return a dummy/non-functional app object.
    // For now, we'll proceed, but Firestore operations will likely fail.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let db;
try {
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firestore:", error);
  console.error(
    "This might be due to missing or incorrect Firebase configuration in your environment variables."
  );
  // Handle the error appropriately, e.g., by setting db to a state that
  // indicates an error, or by not exporting db if it's critical.
  // For now, db will be undefined if getFirestore fails.
}


export { db, app };

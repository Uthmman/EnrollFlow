
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, limit, query as firestoreQuery } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import programsData from '@/data/firestore-seed/programs.json';
import paymentMethodsData from '@/data/firestore-seed/paymentMethods.json';
import type { HafsaProgram, HafsaPaymentMethod } from '@/types';


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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

async function seedCollection(
  collectionName: string,
  dataToSeed: any[],
  idField: string
) {
  if (!db) {
    console.error(`[Seed] Firestore DB is not initialized. Cannot seed collection '${collectionName}'.`);
    return;
  }
  try {
    const collectionRef = collection(db, collectionName);
    console.log(`[Seed] Attempting to seed/update collection '${collectionName}' with ${dataToSeed.length} items...`);
    if (dataToSeed.length === 0) {
      console.warn(`[Seed] No data provided for seeding collection '${collectionName}'. Skipping.`);
      return;
    }

    let count = 0;
    for (const item of dataToSeed) {
      const docId = item[idField as keyof typeof item];
      if (!docId) {
        console.warn(`[Seed] Skipping item in '${collectionName}' due to missing ID field ('${idField}'). Item:`, JSON.stringify(item));
        continue;
      }
      const docIdStr = docId.toString();
      if (!docIdStr.trim()) {
          console.warn(`[Seed] Skipping item in '${collectionName}' due to empty ID field ('${idField}'). Item:`, JSON.stringify(item));
          continue;
      }
      // console.log(`[Seed] Processing item for '${collectionName}': ID = ${docIdStr}, Data = ${JSON.stringify(item)}`);

      // Ensure the data is a plain object for Firestore
      const plainItemData = JSON.parse(JSON.stringify(item));
      await setDoc(doc(collectionRef, docIdStr), plainItemData);
      // console.log(`[Seed] Successfully seeded/updated document '${docIdStr}' in '${collectionName}'.`);
      count++;
    }
    console.log(`[Seed] Finished seeding/updating '${collectionName}'. ${count} of ${dataToSeed.length} documents processed successfully.`);
  } catch (error: any) {
    console.error(`[Seed] Error during seeding/updating collection '${collectionName}':`, error.message, error.stack, error);
    if ((error.message as string).includes("Missing or insufficient permissions")) {
        console.error(`[Seed] Permission Denied: Please ensure your Firestore security rules allow 'write' access to the '${collectionName}' collection for the current context (e.g., unauthenticated or authenticated user, depending on when seeding runs). For development, a rule like 'allow write: if true;' for this collection can be used.`);
    }
  }
}

export async function ensureInitialDataInFirestore() {
  console.log("[Bootstrap] ensureInitialDataInFirestore: Starting initial data check/seed.");
  const typedProgramsData = programsData as HafsaProgram[];
  const typedPaymentMethodsData = paymentMethodsData as HafsaPaymentMethod[];

  console.log(`[Bootstrap] ensureInitialDataInFirestore: Found ${typedProgramsData.length} programs to seed from JSON.`);
  await seedCollection('programs', typedProgramsData, 'id');

  console.log(`[Bootstrap] ensureInitialDataInFirestore: Found ${typedPaymentMethodsData.length} payment methods to seed from JSON.`);
  await seedCollection('paymentMethods', typedPaymentMethodsData, 'value');
  console.log("[Bootstrap] ensureInitialDataInFirestore: Finished initial data check/seed.");
}


export { db, auth, app };

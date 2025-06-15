
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
    console.error("Firestore DB is not initialized. Cannot seed collection:", collectionName);
    return;
  }
  try {
    const collectionRef = collection(db, collectionName);
    const q = firestoreQuery(collectionRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`Collection '${collectionName}' appears empty. Seeding initial data...`);
      for (const item of dataToSeed) {
        const docId = item[idField as keyof typeof item];
        if (!docId) {
          console.warn(`Skipping item in ${collectionName} due to missing ID field ('${idField}'):`, item);
          continue;
        }
        // Firestore expects plain objects, ensure type compatibility if complex types were imported
        const plainItemData = JSON.parse(JSON.stringify(item)); 
        await setDoc(doc(collectionRef, docId), plainItemData);
      }
      console.log(`Successfully seeded ${dataToSeed.length} documents into '${collectionName}'.`);
    } else {
      console.log(`Collection '${collectionName}' is not empty. Skipping seed.`);
    }
  } catch (error) {
    console.error(`Error seeding collection '${collectionName}':`, error);
  }
}

export async function ensureInitialDataInFirestore() {
  // Type assertion to help TypeScript understand the structure
  const typedProgramsData = programsData as HafsaProgram[];
  const typedPaymentMethodsData = paymentMethodsData as HafsaPaymentMethod[];

  await seedCollection('programs', typedProgramsData, 'id');
  await seedCollection('paymentMethods', typedPaymentMethodsData, 'value');
}


export { db, auth, app };

// scripts/seed-firestore.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- IMPORTANT ---
// 1. Download your Firebase Admin SDK service account key JSON file
//    from Firebase Console: Project settings > Service accounts > Generate new private key.
// 2. Save it in your project (e.g., at the root or in a secure location).
//    DO NOT commit this file to your Git repository if it's public.
// 3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of this file.
//    Example (in your terminal, before running the script):
//    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
//    Or, you can specify the path directly in the initializeApp call for local testing,
//    but using the environment variable is generally preferred.

// Initialize Firebase Admin SDK
try {
  // Attempt to initialize with environment variable (recommended)
  admin.initializeApp({
    // If GOOGLE_APPLICATION_CREDENTIALS is set, it uses that.
    // Otherwise, if your Firebase project ID is in .env (NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    // you might need to explicitly pass it or ensure your environment is set for ADC.
    // For simplicity here, assuming GOOGLE_APPLICATION_CREDENTIALS is set.
  });
  console.log("Firebase Admin SDK initialized using Application Default Credentials.");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly or provide service account credentials directly.", error);
  process.exit(1);
}


const db = admin.firestore();

const programsFilePath = path.join(__dirname, '..', 'src', 'data', 'firestore-seed', 'programs.json');
const paymentMethodsFilePath = path.join(__dirname, '..', 'src', 'data', 'firestore-seed', 'paymentMethods.json');

async function seedCollection(collectionName, filePath, idField) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    if (!Array.isArray(data)) {
      console.error(`Error: ${filePath} does not contain a JSON array.`);
      return;
    }

    const collectionRef = db.collection(collectionName);
    let count = 0;

    for (const item of data) {
      const docId = item[idField];
      if (!docId) {
        console.warn(`Skipping item in ${collectionName} due to missing ID field ('${idField}'):`, item);
        continue;
      }
      // Remove the ID field from the data to be written if it's the same as the docId
      // Firestore document ID is separate from its content.
      const itemData = { ...item };
      // delete itemData[idField]; // Firestore doc ID is set via .doc(docId)

      try {
        await collectionRef.doc(docId).set(itemData);
        console.log(`Successfully seeded document ${docId} in ${collectionName}`);
        count++;
      } catch (error) {
        console.error(`Error seeding document ${docId} in ${collectionName}:`, error.message);
      }
    }
    console.log(`Finished seeding ${collectionName}. ${count} documents processed.`);
  } catch (error) {
    console.error(`Failed to read or parse ${filePath}:`, error);
  }
}

async function main() {
  console.log("Starting Firestore seeding process...");

  // Seed programs
  await seedCollection('programs', programsFilePath, 'id');

  // Seed paymentMethods
  await seedCollection('paymentMethods', paymentMethodsFilePath, 'value');

  console.log("Firestore seeding process completed.");
  // It's good practice to explicitly exit when a script is done.
  process.exit(0);
}

main().catch(error => {
  console.error("Unhandled error in seeding script:", error);
  process.exit(1);
});

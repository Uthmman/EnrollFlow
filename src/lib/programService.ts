
import { collection, getDocs, query } from 'firebase/firestore'; // Removed orderBy as it's not used by default
import { db } from '@/lib/firebaseConfig';
import type { HafsaProgram } from '@/types';

export async function fetchProgramsFromFirestore(): Promise<HafsaProgram[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch programs.");
    return []; // Return empty or throw an error, depending on desired behavior
  }
  try {
    const programsCollectionRef = collection(db, 'programs');
    // Optional: Add ordering if you have a field like 'order' or 'createdAt' in your Firestore documents
    // const q = query(programsCollectionRef, orderBy("label")); 
    const q = query(programsCollectionRef); // Simple query without ordering for now
    
    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    querySnapshot.forEach((doc) => {
      // Important: Ensure the data from Firestore matches the HafsaProgram type.
      // You might need to transform data here, e.g., for Timestamp fields if you use them.
      programs.push({ id: doc.id, ...doc.data() } as HafsaProgram);
    });
    return programs;
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    // Depending on your error handling strategy, you might want to:
    // - Return an empty array
    // - Throw the error to be caught by the caller
    // - Return a default set of programs
    return []; // Returning empty array for now
  }
}

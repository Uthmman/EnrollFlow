
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaProgram } from '@/lib/constants';

export async function fetchProgramsFromFirestore(): Promise<HafsaProgram[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch programs.");
    return [];
  }
  try {
    const programsCollectionRef = collection(db, 'programs');
    // You might want to order them, e.g., by a 'displayOrder' field or 'label'
    const q = query(programsCollectionRef, orderBy('label', 'asc')); 
    
    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure the document data conforms to HafsaProgram, including the 'id' from the document
      programs.push({ id: doc.id, ...doc.data() } as HafsaProgram);
    });
    return programs;
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    return []; // Return empty array on error
  }
}

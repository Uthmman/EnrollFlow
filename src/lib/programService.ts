
// This file is no longer needed as programs are loaded statically from constants.ts
// You can delete this file if it's not used elsewhere.

// Example of how it might have looked, for reference:
/*
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaProgram } from '@/lib/constants'; // Or from '@/types' if moved

export async function fetchProgramsFromFirestore(): Promise<HafsaProgram[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch programs.");
    return [];
  }
  try {
    const programsCollectionRef = collection(db, 'programs');
    const q = query(programsCollectionRef);
    
    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    querySnapshot.forEach((doc) => {
      programs.push({ id: doc.id, ...doc.data() } as HafsaProgram);
    });
    return programs;
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    return [];
  }
}
*/

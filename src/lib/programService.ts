
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaProgram, ProgramTranslations } from '@/lib/constants'; // Adjusted import

export async function fetchProgramsFromFirestore(): Promise<HafsaProgram[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch programs.");
    return [];
  }
  try {
    const programsCollectionRef = collection(db, 'programs');
    const q = query(programsCollectionRef, orderBy('category'), orderBy('price')); // Example ordering
    
    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure the document data conforms to HafsaProgram, including the 'id' from the document
      // And ensure translations object has at least 'en'
      const programData = {
        id: doc.id,
        ...data,
        translations: {
          en: data.translations?.en || { label: data.label || doc.id, description: data.description || '', termsAndConditions: data.termsAndConditions || '' }, // Fallback for older structure
          am: data.translations?.am,
          ar: data.translations?.ar,
        }
      } as HafsaProgram;
      
      // Basic validation for required translation fields in 'en'
      if (!programData.translations.en.label || !programData.translations.en.description || !programData.translations.en.termsAndConditions) {
        console.warn(`Program ${doc.id} is missing required 'en' translation fields (label, description, termsAndConditions). Using fallbacks.`);
        // Fallback logic already applied above, this is just a warning
      }

      programs.push(programData);
    });
    return programs;
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    return []; // Return empty array on error
  }
}

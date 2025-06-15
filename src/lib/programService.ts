
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaProgram, ProgramTranslations } from '@/lib/constants'; // Adjusted import

export async function fetchProgramsFromFirestore(): Promise<HafsaProgram[]> {
  if (!db) {
    console.error("[Service] Firestore is not initialized. Cannot fetch programs.");
    return [];
  }
  try {
    console.log("[Service] Fetching programs from Firestore...");
    const programsCollectionRef = collection(db, 'programs');
    const q = query(programsCollectionRef, orderBy('category'), orderBy('price')); // Example ordering

    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    if (querySnapshot.empty) {
        console.log("[Service] No program documents found in Firestore for 'programs' collection.");
    }
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // console.log(`[Service] Fetched program document: ${doc.id}`, data);
      const programData = {
        id: doc.id,
        ...data,
        translations: {
          en: data.translations?.en || { label: data.label || doc.id, description: data.description || '', termsAndConditions: data.termsAndConditions || '' },
          am: data.translations?.am,
          ar: data.translations?.ar,
        }
      } as HafsaProgram;

      if (!programData.translations.en.label || !programData.translations.en.description || !programData.translations.en.termsAndConditions) {
        console.warn(`[Service] Program ${doc.id} is missing required 'en' translation fields (label, description, termsAndConditions). Using fallbacks.`);
      }

      programs.push(programData);
    });
    console.log(`[Service] Fetched ${programs.length} programs successfully.`);
    return programs;
  } catch (error: any) {
    console.error("[Service] Error fetching programs from Firestore:", error.message, error.stack, error);
    return [];
  }
}

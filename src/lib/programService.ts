
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
    // Temporarily simplified query. Recommended: orderBy('category'), orderBy('price') - requires composite index.
    const q = query(programsCollectionRef, orderBy('category')); 

    const querySnapshot = await getDocs(q);
    const programs: HafsaProgram[] = [];
    if (querySnapshot.empty) {
        console.log("[Service] No program documents found in Firestore for 'programs' collection.");
    }
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // console.log(`[Service] Fetched program document: ${doc.id}`, data);
      
      // Basic validation for essential fields
      if (!data.price || !data.category || !data.isChildProgram || !data.translations || !data.translations.en) {
        console.warn(`[Service] Program ${doc.id} is missing one or more essential fields (price, category, isChildProgram, translations.en) and will be skipped.`);
        return;
      }

      const programData = {
        id: doc.id,
        price: data.price,
        category: data.category,
        ageRange: data.ageRange,
        duration: data.duration,
        schedule: data.schedule,
        isChildProgram: data.isChildProgram,
        specificFields: data.specificFields || [],
        translations: {
          en: data.translations.en,
          am: data.translations.am,
          ar: data.translations.ar,
        }
      } as HafsaProgram;

      if (!programData.translations.en.label || !programData.translations.en.description || !programData.translations.en.termsAndConditions) {
        console.warn(`[Service] Program ${doc.id} is missing required 'en' translation fields (label, description, termsAndConditions). Using fallbacks or ID.`);
        programData.translations.en.label = programData.translations.en.label || doc.id;
        programData.translations.en.description = programData.translations.en.description || 'No description available.';
        programData.translations.en.termsAndConditions = programData.translations.en.termsAndConditions || 'No terms available.';
      }

      programs.push(programData);
    });
    console.log(`[Service] Fetched ${programs.length} programs successfully.`);
    // If you simplified the query, you might want to do client-side sorting here if needed
    // For example, to sort by price after fetching by category:
    // programs.sort((a, b) => a.price - b.price); 
    return programs;
  } catch (error: any) {
    console.error("[Service] Error fetching programs from Firestore:", error.message, error.stack ? error.stack : '', error);
    return [];
  }
}



import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaPaymentMethod, PaymentMethodTranslations } from '@/lib/constants'; // Adjusted import

export async function fetchPaymentMethodsFromFirestore(): Promise<HafsaPaymentMethod[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch payment methods.");
    return [];
  }
  try {
    const paymentMethodsCollectionRef = collection(db, 'paymentMethods');
    // Order by a field if it exists, e.g., 'order' or 'value' (doc.id)
    const q = query(paymentMethodsCollectionRef); // Simple query, can add orderBy('value') or another field
    
    const querySnapshot = await getDocs(q);
    const paymentMethods: HafsaPaymentMethod[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const paymentMethodData = {
        value: doc.id,
        logoPlaceholder: data.logoPlaceholder,
        dataAiHint: data.dataAiHint,
        accountNumber: data.accountNumber, // Stays top-level
        translations: {
          en: data.translations?.en || { label: data.label || doc.id, accountName: data.accountName, additionalInstructions: data.additionalInstructions }, // Fallback
          am: data.translations?.am,
          ar: data.translations?.ar,
        }
      } as HafsaPaymentMethod;

      if (!paymentMethodData.translations.en.label) {
         console.warn(`PaymentMethod ${doc.id} is missing required 'en' translation field 'label'. Using ID as fallback.`);
      }
      paymentMethods.push(paymentMethodData);
    });
    // Sort by the English label if no other order field is present
    paymentMethods.sort((a, b) => (a.translations.en.label || a.value).localeCompare(b.translations.en.label || b.value));
    return paymentMethods;
  } catch (error) {
    console.error("Error fetching payment methods from Firestore:", error);
    return []; // Return empty array on error
  }
}

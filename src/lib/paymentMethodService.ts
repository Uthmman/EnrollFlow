
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaPaymentMethod, PaymentMethodTranslations } from '@/lib/constants';

export async function fetchPaymentMethodsFromFirestore(): Promise<HafsaPaymentMethod[]> {
  if (!db) {
    console.error("[Service] Firestore is not initialized. Cannot fetch payment methods.");
    return [];
  }
  try {
    console.log("[Service] Fetching payment methods from Firestore...");
    const paymentMethodsCollectionRef = collection(db, 'paymentMethods');
    const q = query(paymentMethodsCollectionRef);

    const querySnapshot = await getDocs(q);
    const paymentMethods: HafsaPaymentMethod[] = [];
     if (querySnapshot.empty) {
        console.log("[Service] No payment method documents found in Firestore for 'paymentMethods' collection.");
    }
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // console.log(`[Service] Fetched payment method document: ${doc.id}`, data);
      const paymentMethodData = {
        value: doc.id,
        logoPlaceholder: data.logoPlaceholder,
        dataAiHint: data.dataAiHint,
        accountNumber: data.accountNumber,
        translations: {
          en: data.translations?.en || { label: data.label || doc.id, accountName: data.accountName, additionalInstructions: data.additionalInstructions },
          am: data.translations?.am,
          ar: data.translations?.ar,
        }
      } as HafsaPaymentMethod;

      if (!paymentMethodData.translations.en.label) {
         console.warn(`[Service] PaymentMethod ${doc.id} is missing required 'en' translation field 'label'. Using ID as fallback.`);
      }
      paymentMethods.push(paymentMethodData);
    });
    paymentMethods.sort((a, b) => (a.translations.en.label || a.value).localeCompare(b.translations.en.label || b.value));
    console.log(`[Service] Fetched ${paymentMethods.length} payment methods successfully.`);
    return paymentMethods;
  } catch (error: any) {
    console.error("[Service] Error fetching payment methods from Firestore:", error.message, error.stack, error);
    return [];
  }
}

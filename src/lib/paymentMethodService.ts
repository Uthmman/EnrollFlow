
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { HafsaPaymentMethod } from '@/lib/constants';

export async function fetchPaymentMethodsFromFirestore(): Promise<HafsaPaymentMethod[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch payment methods.");
    return [];
  }
  try {
    const paymentMethodsCollectionRef = collection(db, 'paymentMethods');
    // Order by label or a custom 'displayOrder' field if you add one
    const q = query(paymentMethodsCollectionRef, orderBy('label', 'asc')); 
    
    const querySnapshot = await getDocs(q);
    const paymentMethods: HafsaPaymentMethod[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure the document data conforms to HafsaPaymentMethod, including the 'value' from the document id
      paymentMethods.push({ value: doc.id, ...doc.data() } as HafsaPaymentMethod);
    });
    return paymentMethods;
  } catch (error) {
    console.error("Error fetching payment methods from Firestore:", error);
    return []; // Return empty array on error
  }
}

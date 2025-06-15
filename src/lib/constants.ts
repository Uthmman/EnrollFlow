
// Program related types
export type ProgramField =
  | { type: 'text'; name: 'specialAttention'; label: 'Special Attention (e.g., allergies, specific needs)' }
  | { type: 'select'; name: 'schoolGrade'; label: 'School Grade'; options: string[] }
  | { type: 'select'; name: 'quranLevel'; label: 'Quran Level'; options: string[] };

export type HafsaProgramCategory = 'daycare' | 'quran_kids' | 'arabic_women' | 'general_islamic_studies';

export type HafsaProgram = {
  id: string; // This ID should match the document ID in Firestore
  label: string;
  description: string;
  price: number;
  category: HafsaProgramCategory;
  ageRange?: string;
  duration?: string;
  schedule?: string;
  isChildProgram: boolean;
  specificFields?: ProgramField[];
  termsAndConditions: string;
};

export const SCHOOL_GRADES = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Not Applicable"];
export const QURAN_LEVELS = ["Beginner (Qaida)", "Junior (Nazr)", "Intermediate (Nazr)", "Advanced (Hifz)", "Not Applicable"];

// HAFSA_PROGRAMS array removed, will be fetched from Firestore.
// Example Firestore document structure for 'programs' collection:
// Document ID: 'daycare_morning'
// {
//   id: 'daycare_morning', // Optional to repeat if doc ID is the same
//   label: 'Daycare (Morning Session)',
//   description: 'Safe and nurturing environment for young children with Islamic integration. Focus on early learning and play.',
//   price: 2500,
//   category: 'daycare',
//   ageRange: '1.5 - 3 years',
//   duration: 'Half-day (8 AM - 12 PM)',
//   schedule: 'Monday - Friday',
//   isChildProgram: true,
//   specificFields: [
//     { type: 'text', name: 'specialAttention', label: 'Special Attention (e.g., allergies, specific needs)' },
//   ],
//   termsAndConditions: "Full payment required upfront. No refunds for missed days. Parents must provide diapers and formula if needed. Standard daycare policies apply."
// }


export type HafsaPaymentMethod = {
  value: string; // This value should match the document ID in Firestore
  label: string;
  logoPlaceholder?: string;
  dataAiHint?: string;
  accountName?: string;
  accountNumber?: string;
  additionalInstructions?: string;
};

// HAFSA_PAYMENT_METHODS array removed, will be fetched from Firestore.
// Example Firestore document structure for 'paymentMethods' collection:
// Document ID: 'cbe'
// {
//   value: 'cbe', // Optional to repeat if doc ID is the same
//   label: 'CBE (Commercial Bank of Ethiopia)',
//   logoPlaceholder: 'https://placehold.co/48x48.png',
//   dataAiHint: 'cbe logo',
//   accountName: 'Hafsa Madrassa',
//   accountNumber: '1000123456789',
//   additionalInstructions: 'Ensure the name "Hafsa Madrassa" appears as the recipient.'
// }


export const LEGACY_PAYMENT_TYPES = [
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "PDF Link" },
  { value: "transaction_id", label: "Transaction ID" },
];


// These seem like legacy or different app's constants, might not be needed for Hafsa Madrassa
export type Course = {
  value: string;
  label: string;
  price: number;
};

export type Program = {
  value: string;
  label: string;
  basePrice: number;
  courses?: Course[];
};

export const SCHOOL_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "university", label: "University" },
  { value: "vocational", label: "Vocational School" },
];

export const PROGRAMS_BY_LEVEL: { [level: string]: Program[] } = {
  high_school: [
    {
      value: "grade_9",
      label: "Grade 9",
      basePrice: 1000,
      courses: [
        { value: "math_9", label: "Mathematics 9", price: 100 },
        { value: "science_9", label: "Science 9", price: 120 },
        { value: "english_9", label: "English 9", price: 90 },
      ]
    },
  ],
  university: [
    {
      value: "computer_science",
      label: "B.Sc. Computer Science",
      basePrice: 5000,
    },
  ],
  vocational: [
    {
      value: "culinary_arts",
      label: "Culinary Arts Certificate",
      basePrice: 3000,
    },
  ],
};

// Re-exporting HafsaProgramCategory for use in types/index.ts if needed there,
// but primary definition remains here with HAFSA_PROGRAMS.
export type { HafsaProgramCategory as ProgramCategoryType } from './constants';

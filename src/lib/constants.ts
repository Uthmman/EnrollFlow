
// Program related types
export type ProgramField = {
  type: 'text' | 'select';
  name: 'specialAttention' | 'schoolGrade' | 'quranLevel'; // Keep this specific for now
  labelKey: string; // This key will be used to look up translations in locale files
  options?: string[]; // Only for 'select' type
};

export type HafsaProgramCategory = 'daycare' | 'quran_kids' | 'arabic_women' | 'general_islamic_studies';

export type ProgramTranslations = {
  label: string;
  description: string;
  termsAndConditions: string;
};

export type HafsaProgram = {
  id: string; // This ID should match the document ID in Firestore
  price: number;
  category: HafsaProgramCategory;
  ageRange?: string;
  duration?: string;
  schedule?: string;
  isChildProgram: boolean;
  specificFields?: ProgramField[];
  translations: {
    en: ProgramTranslations;
    am?: ProgramTranslations;
    ar?: ProgramTranslations;
    [key: string]: ProgramTranslations | undefined; // To allow dynamic access like translations[currentLang]
  };
};

export const SCHOOL_GRADES = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Not Applicable"];
export const QURAN_LEVELS = ["Beginner (Qaida)", "Junior (Nazr)", "Intermediate (Nazr)", "Advanced (Hifz)", "Not Applicable"];


export type PaymentMethodTranslations = {
  label: string;
  accountName?: string;
  additionalInstructions?: string;
};

export type HafsaPaymentMethod = {
  value: string; // This value should match the document ID in Firestore
  logoPlaceholder?: string;
  dataAiHint?: string;
  accountNumber?: string; // This is not typically translated, so it remains at the top level
  translations: {
    en: PaymentMethodTranslations;
    am?: PaymentMethodTranslations;
    ar?: PaymentMethodTranslations;
    [key: string]: PaymentMethodTranslations | undefined;
  };
};


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

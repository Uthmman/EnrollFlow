
// Program related types - kept here with static data for simplicity
export type ProgramField =
  | { type: 'text'; name: 'specialAttention'; label: 'Special Attention (e.g., allergies, specific needs)' }
  | { type: 'select'; name: 'schoolGrade'; label: 'School Grade'; options: string[] }
  | { type: 'select'; name: 'quranLevel'; label: 'Quran Level'; options: string[] };

export type HafsaProgram = {
  id: string;
  label: string;
  description: string;
  price: number;
  category: 'daycare' | 'quran_kids' | 'arabic_women' | 'general_islamic_studies';
  ageRange?: string;
  duration?: string;
  schedule?: string;
  isChildProgram: boolean;
  specificFields?: ProgramField[];
  termsAndConditions: string;
};

export const SCHOOL_GRADES = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Not Applicable"];
export const QURAN_LEVELS = ["Beginner (Qaida)", "Junior (Nazr)", "Intermediate (Nazr)", "Advanced (Hifz)", "Not Applicable"];


export const HAFSA_PROGRAMS: HafsaProgram[] = [
  {
    id: 'daycare_morning',
    label: 'Daycare (Morning Session)',
    description: 'Safe and nurturing environment for young children with Islamic integration. Focus on early learning and play.',
    price: 2500,
    category: 'daycare',
    ageRange: '1.5 - 3 years',
    duration: 'Half-day (8 AM - 12 PM)',
    schedule: 'Monday - Friday',
    isChildProgram: true,
    specificFields: [
      { type: 'text', name: 'specialAttention', label: 'Special Attention (e.g., allergies, specific needs)' },
    ],
    termsAndConditions: "Full payment required upfront. No refunds for missed days. Parents must provide diapers and formula if needed. Standard daycare policies apply."
  },
  {
    id: 'quran_kids_beginner',
    label: 'Kids Quran (Beginner - Qaida)',
    description: 'Introduction to Arabic alphabet, basic Tajweed, and memorization of short Surahs. Engaging and fun learning methods.',
    price: 1200,
    category: 'quran_kids',
    ageRange: '5 - 8 years',
    duration: '3 months (renewable)',
    schedule: '3 days/week, 1.5 hours/session',
    isChildProgram: true,
    specificFields: [
      { type: 'text', name: 'specialAttention', label: 'Special Attention (e.g., allergies, specific needs)' },
      { type: 'select', name: 'schoolGrade', label: 'School Grade', options: SCHOOL_GRADES },
      { type: 'select', name: 'quranLevel', label: 'Previous Quran Level (if any)', options: QURAN_LEVELS },
    ],
    termsAndConditions: "Consistent attendance is crucial. Materials fee of Br 200 applicable. Parents are encouraged to support home practice."
  },
  {
    id: 'arabic_women_level1',
    label: 'Arabic Language for Women (Level 1)',
    description: 'Foundational Arabic for sisters, focusing on reading, writing, and basic conversation for understanding Quran and Sunnah.',
    price: 1800,
    category: 'arabic_women',
    ageRange: '16+ years',
    duration: '4 months',
    schedule: '2 days/week, 2 hours/session',
    isChildProgram: false,
    specificFields: [
       { type: 'text', name: 'specialAttention', label: 'Learning Preferences or Special Needs' },
    ],
    termsAndConditions: "This program is for women only. Commitment to all sessions is expected. Textbook purchase may be required."
  },
  {
    id: 'islamic_studies_adults',
    label: 'General Islamic Studies (Adults)',
    description: 'Comprehensive course covering Aqeedah, Fiqh, Seerah, and Hadith for adults seeking deeper Islamic knowledge.',
    price: 2000,
    category: 'general_islamic_studies',
    ageRange: '18+ years',
    duration: '6 months',
    schedule: 'Saturday & Sunday, 2 hours/session',
    isChildProgram: false,
    specificFields: [
        { type: 'text', name: 'specialAttention', label: 'Specific areas of interest or learning needs' },
    ],
    termsAndConditions: "Active participation and respect for diverse scholarly opinions are expected. Some reading materials will be provided, others may need to be purchased."
  }
];


export type HafsaPaymentMethod = {
  value: string;
  label: string;
  logoPlaceholder?: string;
  dataAiHint?: string;
  accountName?: string;
  accountNumber?: string;
  additionalInstructions?: string;
};

export const HAFSA_PAYMENT_METHODS: HafsaPaymentMethod[] = [
    {
        value: 'cbe',
        label: 'CBE (Commercial Bank of Ethiopia)',
        logoPlaceholder: 'https://placehold.co/48x48.png',
        dataAiHint: 'cbe logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '1000123456789',
        additionalInstructions: 'Ensure the name "Hafsa Madrassa" appears as the recipient.'
    },
    {
        value: 'telebirr',
        label: 'Telebirr',
        logoPlaceholder: 'https://placehold.co/48x48.png',
        dataAiHint: 'telebirr logo',
        accountName: 'Hafsa Madrassa Telebirr',
        accountNumber: '0911123456',
        additionalInstructions: 'Use the pay bill option if available, or send to this number.'
    },
    {
        value: 'zamzam',
        label: 'ZamZam Bank',
        logoPlaceholder: 'https://placehold.co/48x48.png',
        dataAiHint: 'zamzam bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '9876543210000',
        additionalInstructions: 'Please include the participant\'s name in the payment reference.'
    },
    {
        value: 'hijra',
        label: 'Hijra Bank',
        logoPlaceholder: 'https://placehold.co/48x48.png',
        dataAiHint: 'hijra bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '1122334455667',
        additionalInstructions: 'Verify recipient name before confirming payment.'
    },
    {
        value: 'abyssinia',
        label: 'Abyssinia Bank',
        logoPlaceholder: 'https://placehold.co/48x48.png',
        dataAiHint: 'abyssinia bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '5550001112223',
        additionalInstructions: 'You can use their mobile app or visit a branch.'
    }
];

export const LEGACY_PAYMENT_TYPES = [
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "PDF Link" },
  { value: "transaction_id", label: "Transaction ID" },
];


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

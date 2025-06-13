
export type ProgramField = 
  | { type: 'text'; name: 'specialAttention'; label: 'Special Attention (e.g., allergies, specific needs)' }
  | { type: 'select'; name: 'schoolGrade'; label: 'School Grade'; options: string[] }
  | { type: 'select'; name: 'quranLevel'; label: 'Quran Level'; options: string[] };

export type HafsaProgram = {
  id: string;
  label: string;
  description: string;
  price: number;
  category: 'daycare' | 'quran_kids' | 'arabic_women';
  ageRange?: string;
  duration?: string;
  schedule?: string;
  requiresParentInfo: boolean; // True for daycare/quran_kids
  isChildProgram: boolean; // True if this program is for children (requires child info)
  specificFields?: ProgramField[]; // Specific fields for this program
  termsLink?: string; // Optional: link to specific T&C
};

export const SCHOOL_GRADES = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
export const QURAN_LEVELS = ["Beginner (Qaida)", "Junior (Nazr)", "Intermediate (Nazr)", "Advanced (Hifz)"];

export const HAFSA_PROGRAMS: HafsaProgram[] = [
  { 
    id: 'daycare', 
    label: 'Daycare Service', 
    description: 'For babies starting from 6 months.',
    price: 100, // Example price, adjust as needed
    category: 'daycare',
    ageRange: '6 months+',
    requiresParentInfo: true,
    isChildProgram: true,
    specificFields: [
      { type: 'text', name: 'specialAttention', label: 'Special Attention (e.g., allergies, headaches, specific needs)' }
    ]
  },
  { 
    id: 'quran_bootcamp', 
    label: 'Full-Day Summer Quran Bootcamps', 
    description: 'For kids aged 4-15, 5 days/week (2-month duration).',
    price: 200, 
    category: 'quran_kids',
    ageRange: '4-15 years',
    duration: '2 months',
    schedule: '5 days/week',
    requiresParentInfo: true,
    isChildProgram: true,
    specificFields: [
      { type: 'select', name: 'schoolGrade', label: 'School Grade', options: SCHOOL_GRADES },
      { type: 'select', name: 'quranLevel', label: 'Quran Level', options: QURAN_LEVELS }
    ]
  },
  { 
    id: 'after_asr_quran', 
    label: 'After Asr Quran Programs', 
    description: 'For kids aged 5-18, daily (After Asr to Maghrib).',
    price: 150, 
    category: 'quran_kids',
    ageRange: '5-18 years',
    schedule: 'Daily, After Asr to Maghrib',
    requiresParentInfo: true,
    isChildProgram: true,
    specificFields: [
      { type: 'select', name: 'schoolGrade', label: 'School Grade', options: SCHOOL_GRADES }, // Assuming grade is relevant here too
      { type: 'select', name: 'quranLevel', label: 'Quran Level', options: QURAN_LEVELS }
    ]
  },
  { 
    id: 'arabic_mothers_women', 
    label: 'Summer Arabic Training (Mothers & Women)', 
    description: '5 days/week (After Asr to Maghrib, 2-month duration).',
    price: 250, 
    category: 'arabic_women',
    schedule: '5 days/week, After Asr to Maghrib',
    duration: '2 months',
    requiresParentInfo: false, // Direct trainee info
    isChildProgram: false,
  },
  { 
    id: 'arabic_adult_women', 
    label: 'Summer Arabic Training (Adult Women)', 
    description: 'Age 15+, 5 days/week (Dhuhr to Asr, 2-month duration).',
    price: 220, 
    category: 'arabic_women',
    ageRange: '15+',
    schedule: '5 days/week, Dhuhr to Asr',
    duration: '2 months',
    requiresParentInfo: false, // Direct trainee info
    isChildProgram: false,
  },
];


export const LEGACY_PAYMENT_TYPES = [ // Kept for reference or if needed later by AI flow
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "PDF Link" },
  { value: "transaction_id", label: "Transaction ID" },
];

export const HAFSA_PAYMENT_METHODS = [
    { value: 'cbe', label: 'CBE (Commercial Bank of Ethiopia)'},
    { value: 'telebirr', label: 'Telebirr'},
    { value: 'zamzam', label: 'ZamZam Bank'},
    { value: 'hijra', label: 'Hijra Bank'},
    { value: 'abyssinia', label: 'Abyssinia Bank'},
];

// Old constants, to be removed or refactored.
// These are no longer used by the new Hafsa Madrassa structure.
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

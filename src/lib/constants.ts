
import type { HafsaProgram } from '@/types';

export const SCHOOL_GRADES = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
export const QURAN_LEVELS = ["Beginner (Qaida)", "Junior (Nazr)", "Intermediate (Nazr)", "Advanced (Hifz)"];

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
        logoPlaceholder: 'https://placehold.co/40x40.png',
        dataAiHint: 'cbe logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '1000123456789',
        additionalInstructions: 'Ensure the name "Hafsa Madrassa" appears as the recipient.'
    },
    {
        value: 'telebirr',
        label: 'Telebirr',
        logoPlaceholder: 'https://placehold.co/40x40.png',
        dataAiHint: 'telebirr logo',
        accountName: 'Hafsa Madrassa Telebirr',
        accountNumber: '0911123456',
        additionalInstructions: 'Use the pay bill option if available, or send to this number.'
    },
    {
        value: 'zamzam',
        label: 'ZamZam Bank',
        logoPlaceholder: 'https://placehold.co/40x40.png',
        dataAiHint: 'zamzam bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '9876543210000',
        additionalInstructions: 'Please include the participant\'s name in the payment reference.'
    },
    {
        value: 'hijra',
        label: 'Hijra Bank',
        logoPlaceholder: 'https://placehold.co/40x40.png',
        dataAiHint: 'hijra bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '1122334455667',
        additionalInstructions: 'Verify recipient name before confirming payment.'
    },
    {
        value: 'abyssinia',
        label: 'Abyssinia Bank',
        logoPlaceholder: 'https://placehold.co/40x40.png',
        dataAiHint: 'abyssinia bank logo',
        accountName: 'Hafsa Madrassa',
        accountNumber: '5550001112223',
        additionalInstructions: 'You can use their mobile app or visit a branch.'
    }
];

export const HAFSA_PROGRAMS: HafsaProgram[] = [
  {
    id: 'daycare_morning',
    label: 'Daycare (Morning Session)',
    description: 'Safe and nurturing environment for young children with Islamic values.',
    price: 3500,
    category: 'daycare',
    ageRange: '1.5 - 3 years',
    duration: 'Half-day (8 AM - 12 PM)',
    schedule: 'Monday - Friday',
    isChildProgram: true,
    specificFields: [
      { type: 'text', name: 'specialAttention', label: 'Special Attention (e.g., allergies, specific needs)' },
    ],
    termsAndConditions: 'Standard daycare terms: full month payment required, 1 month notice for withdrawal. Late pickup fees apply. All payments are final.'
  },
  {
    id: 'quran_kids_beginner',
    label: 'Quran for Kids (Beginner)',
    description: 'Introduction to Qaida, Arabic alphabets, and basic surahs.',
    price: 1500,
    category: 'quran_kids',
    ageRange: '4 - 7 years',
    duration: '3 months (renewable)',
    schedule: 'Sat & Sun, 9 AM - 11 AM',
    isChildProgram: true,
    specificFields: [
      { type: 'select', name: 'quranLevel', label: 'Current Quran Level', options: QURAN_LEVELS },
      { type: 'text', name: 'specialAttention', label: 'Special Attention' },
    ],
    termsAndConditions: 'Materials fee included. Regular attendance expected. Progress assessment every month. No refunds for missed classes.'
  },
  {
    id: 'arabic_women_level1',
    label: 'Arabic for Women (Level 1)',
    description: 'Basic Arabic reading, writing, and conversation for sisters.',
    price: 2000,
    category: 'arabic_women',
    ageRange: '18+ years',
    duration: '4 months',
    schedule: 'Mon & Wed, 6 PM - 8 PM',
    isChildProgram: false,
    termsAndConditions: 'For women only. Course materials provided. Minimum 5 students to start class. Fees are non-refundable after course commencement.'
  },
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



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

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
    { 
      value: "grade_10", 
      label: "Grade 10", 
      basePrice: 1100, 
      courses: [
        { value: "math_10", label: "Mathematics 10", price: 110 },
        { value: "history_10", label: "History 10", price: 90 },
        { value: "physics_10", label: "Physics 10", price: 130 },
      ]
    },
  ],
  university: [
    { 
      value: "computer_science", 
      label: "B.Sc. Computer Science", 
      basePrice: 5000, 
      courses: [
        { value: "intro_cs", label: "Introduction to CS", price: 300 },
        { value: "data_structures", label: "Data Structures", price: 400 },
        { value: "algorithms", label: "Algorithms", price: 450 },
      ] 
    },
    { 
      value: "business_admin", 
      label: "BBA Business Administration", 
      basePrice: 4500, 
      courses: [
        { value: "accounting_1", label: "Accounting I", price: 250 },
        { value: "marketing_intro", label: "Intro to Marketing", price: 200 },
        { value: "economics_101", label: "Economics 101", price: 220 },
      ] 
    },
  ],
  vocational: [
    { 
      value: "culinary_arts", 
      label: "Culinary Arts Certificate", 
      basePrice: 3000, 
      courses: [
        { value: "baking_basics", label: "Baking Basics", price: 500 },
        { value: "kitchen_safety", label: "Kitchen Safety", price: 150 },
        { value: "menu_planning", label: "Menu Planning", price: 200 },
      ] 
    },
    {
      value: "web_development",
      label: "Web Development Bootcamp",
      basePrice: 4000,
      courses: [
        { value: "html_css", label: "HTML & CSS", price: 300 },
        { value: "javascript_basics", label: "JavaScript Basics", price: 400 },
        { value: "react_fundamentals", label: "React Fundamentals", price: 500 },
      ]
    }
  ],
};

export const PAYMENT_TYPES = [
  { value: "screenshot", label: "Screenshot Upload" },
  { value: "link", label: "PDF Link" },
  { value: "transaction_id", label: "Transaction ID" },
];

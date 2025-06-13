
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
     { 
      value: "grade_11", 
      label: "Grade 11", 
      basePrice: 1200, 
      courses: [
        { value: "adv_math_11", label: "Advanced Mathematics 11", price: 150 },
        { value: "chemistry_11", label: "Chemistry 11", price: 140 },
        { value: "world_lit_11", label: "World Literature 11", price: 100 },
      ]
    },
    { 
      value: "grade_12", 
      label: "Grade 12", 
      basePrice: 1300, 
      courses: [
        { value: "calculus_12", label: "Calculus 12", price: 180 },
        { value: "biology_12", label: "Biology 12", price: 150 },
        { value: "history_global_12", label: "Global History 12", price: 110 },
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
        { value: "os_concepts", label: "Operating System Concepts", price: 350 },
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
        { value: "finance_basics", label: "Basics of Finance", price: 280 },
      ] 
    },
    {
      value: "psychology",
      label: "B.A. Psychology",
      basePrice: 4000,
      courses: [
        { value: "intro_psych", label: "Introduction to Psychology", price: 200 },
        { value: "social_psych", label: "Social Psychology", price: 250 },
        { value: "cognitive_psych", label: "Cognitive Psychology", price: 280 },
      ]
    }
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
        { value: "international_cuisine", label: "International Cuisine", price: 300 },
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
        { value: "node_express", label: "Node.js & Express", price: 450 },
      ]
    },
    {
      value: "graphic_design",
      label: "Graphic Design Certificate",
      basePrice: 3500,
      courses: [
        { value: "design_principles", label: "Design Principles", price: 250 },
        { value: "typography_basics", label: "Typography", price: 200 },
        { value: "adobe_illustrator", label: "Adobe Illustrator", price: 400 },
      ]
    }
  ],
};

export const PAYMENT_TYPES = [
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "PDF Link" },
  { value: "transaction_id", label: "Transaction ID" },
];

    
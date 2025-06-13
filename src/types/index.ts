
import { z } from 'zod';
import { HAFSA_PROGRAMS, SCHOOL_GRADES, QURAN_LEVELS } from '@/lib/constants';

// Helper for phone number validation (example)
const phoneRegex = /^[0-9]{9,15}$/; // Adjust regex as needed for Ethiopian numbers

export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Parent's full name must be at least 3 characters."),
  parentPhone1: z.string().regex(phoneRegex, "Invalid primary phone number format."),
  parentPhone2: z.string().regex(phoneRegex, "Invalid secondary phone number format.").optional().or(z.literal('')),
  telegramPhoneNumber: z.string().regex(phoneRegex, "Invalid Telegram phone number format."),
  usePhone1ForTelegram: z.boolean().optional(),
  usePhone2ForTelegram: z.boolean().optional(),
});
export type ParentInfoData = z.infer<typeof ParentInfoSchema>;

export const ChildInfoSchema = z.object({
  childFirstName: z.string().min(2, "Child's first name must be at least 2 characters."),
  // childLastName: z.string().min(2, "Child's last name must be at least 2 characters."), // Removed as per "First Name" only
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Child's date of birth is required." }),
  specialAttention: z.string().optional(), // For Daycare
  schoolGrade: z.string().optional(), // For Quran Bootcamps/After Asr
  quranLevel: z.string().optional(), // For Quran Bootcamps/After Asr
});
export type ChildInfoData = z.infer<typeof ChildInfoSchema>;

export const AdultTraineeSchema = z.object({
  traineeFullName: z.string().min(3, "Trainee's full name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Trainee's date of birth is required." }),
  phone1: z.string().regex(phoneRegex, "Invalid primary phone number format."),
  phone2: z.string().regex(phoneRegex, "Invalid secondary phone number format.").optional().or(z.literal('')),
  telegramPhoneNumber: z.string().regex(phoneRegex, "Invalid Telegram phone number format."),
  usePhone1ForTelegram: z.boolean().optional(),
  usePhone2ForTelegram: z.boolean().optional(),
});
export type AdultTraineeData = z.infer<typeof AdultTraineeSchema>;

export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment proof method is required."), // e.g. 'cbe', 'telebirr'
  // Fields for screenshot/link/ID are kept if AI verification is still used for some methods.
  // These might become optional or removed if all new methods have different proof requirements.
  screenshot: z.custom<File>((val) => val instanceof File, "Screenshot file is required.").optional(),
  screenshotDataUri: z.string().optional(), // For AI flow
  pdfLink: z.string().url("Invalid URL for PDF link.").optional(),
  transactionId: z.string().min(5, "Transaction ID must be at least 5 characters.").optional(),
  // Add fields specific to new payment methods if needed, e.g. confirmation codes
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  selectedProgramId: z.string().min(1, "Please select a program."),
  parentInfo: ParentInfoSchema.optional(), // Optional at top level, required based on program
  children: z.array(ChildInfoSchema).optional(), // Optional, used if selectedProgram.isChildProgram
  adultTraineeInfo: AdultTraineeSchema.optional(), // Optional, used if !selectedProgram.isChildProgram
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema,
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

// Data structure for the final receipt
export type RegistrationData = {
  selectedProgramLabel: string;
  parentInfo?: ParentInfoData;
  children?: ChildInfoData[];
  adultTraineeInfo?: AdultTraineeData;
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData;
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; 
  registrationDate: Date;
};


// Legacy types from EnrollFlow - for reference during refactor, then remove
export const LegacyParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Parent's full name must be at least 3 characters."),
  parentEmail: z.string().email("Invalid parent email address."),
  parentPhone: z.string().min(10, "Parent's phone number must be at least 10 digits.").optional(),
});
export type LegacyParentInfoData = z.infer<typeof LegacyParentInfoSchema>;

export const LegacyChildInfoSchema = z.object({
  fullName: z.string().min(3, "Child's full name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Child's date of birth is required." }),
});

export const LegacyChildProgramSelectionSchema = z.object({
  schoolLevel: z.string().min(1, "School level is required."),
  program: z.string().min(1, "Program is required."),
  selectedCourses: z.array(z.string()).optional(),
});

export const LegacyChildEnrollmentSchema = LegacyChildInfoSchema.merge(LegacyChildProgramSelectionSchema);
export type LegacyChildEnrollmentData = z.infer<typeof LegacyChildEnrollmentSchema>;

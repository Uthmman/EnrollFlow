
import { z } from 'zod';
import { HAFSA_PROGRAMS, SCHOOL_GRADES, QURAN_LEVELS } from '@/lib/constants';

const phoneRegex = /^[0-9]{9,15}$/; 

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
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Child's date of birth is required." }),
  specialAttention: z.string().optional(), 
  schoolGrade: z.string().optional(), 
  quranLevel: z.string().optional(), 
});
export type ChildInfoData = z.infer<typeof ChildInfoSchema>;

// Represents a child enrolled in a specific program
export const EnrolledChildSchema = z.object({
  programId: z.string().min(1, "Program selection is required for each child."),
  childInfo: ChildInfoSchema,
});
export type EnrolledChildData = z.infer<typeof EnrolledChildSchema>;


export const AdultTraineeSchema = z.object({
  traineeFullName: z.string().min(3, "Trainee's full name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Trainee's date of birth is required." }),
  phone1: z.string().regex(phoneRegex, "Invalid primary phone number format."),
  phone2: z.string().regex(phoneRegex, "Invalid secondary phone number format.").optional().or(z.literal('')),
  telegramPhoneNumber: z.string().regex(phoneRegex, "Invalid Telegram phone number format."),
  usePhone1ForTelegram: z.boolean().optional(),
  usePhone2ForTelegram: z.boolean().optional(),
  // For adult programs, we also need to capture the program ID directly with the trainee
  programId: z.string().min(1, "Program selection is required for the trainee.").optional(), // Optional because it might be set in a different step
});
export type AdultTraineeData = z.infer<typeof AdultTraineeSchema>;


export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment proof method is required."),
  screenshot: z.custom<File>((val) => val instanceof File, "Screenshot file is required.").optional(),
  screenshotDataUri: z.string().optional(),
  pdfLink: z.string().url("Invalid URL for PDF link.").optional(),
  transactionId: z.string().min(3, "Transaction ID must be at least 3 characters.").optional(),
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  // If the main registration is for an adult, this holds their info.
  // If for children, this is the parent.
  accountHolderType: z.enum(['parent', 'adult_trainee']).optional(), // To distinguish flow
  parentInfo: ParentInfoSchema.optional(),
  adultTraineeInfo: AdultTraineeSchema.optional(), 
  
  // For parent accounts, they can register multiple children.
  // Each child is associated with a specific program.
  children: z.array(EnrolledChildSchema).optional().default([]),
  
  // General fields
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema.optional(), // Optional until payment stage
})
.superRefine((data, ctx) => {
    // Complex validation: if accountHolderType is 'parent', parentInfo is required.
    // If 'adult_trainee', adultTraineeInfo is required.
    // Program-specific validation for children's fields will be handled dynamically or in component logic.
    if (data.accountHolderType === 'parent' && !data.parentInfo) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['parentInfo'],
            message: 'Parent information is required.',
        });
    }
    if (data.accountHolderType === 'adult_trainee' && !data.adultTraineeInfo) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['adultTraineeInfo'],
            message: 'Trainee information is required.',
        });
    }
    if (data.accountHolderType === 'adult_trainee' && data.adultTraineeInfo && !data.adultTraineeInfo.programId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['adultTraineeInfo', 'programId'],
            message: 'Program selection is required for adult trainee.',
        });
    }
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

export type RegistrationData = {
  accountHolderType?: 'parent' | 'adult_trainee';
  parentInfo?: ParentInfoData;
  adultTraineeInfo?: AdultTraineeData; // Program ID will be inside this
  children?: EnrolledChildData[]; // Each child has their programId
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData; // Make non-optional for receipt
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; 
  registrationDate: Date;
};

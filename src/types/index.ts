
import { z } from 'zod';
import type { HafsaProgram, ProgramField, HafsaPaymentMethod, HafsaProgramCategory, CouponData as ConstantCouponData, CouponDiscountType } from '@/lib/constants';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{9,15}$/; // Allows for international numbers, adjust if only local

// Schema for Login (used in handleLoginAttempt)
export const LoginSchema = z.object({
    loginEmail: z.string().regex(emailRegex, "Invalid email address format for login.").trim(),
    loginPassword: z.string().min(6, "Password for login must be at least 6 characters."),
});
export type LoginData = z.infer<typeof LoginSchema>;


// Schema for Parent/Registrant Information (used for new account creation via handleAccountCreation)
export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters.").trim(),
  parentEmail: z.string().regex(emailRegex, "Invalid email address format.").trim(),
  parentPhone1: z.string().regex(phoneRegex, "Primary phone number invalid (e.g., 0911XXXXXX).").trim().optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters.").optional(),
}).superRefine((data, ctx) => {
  // Password confirmation is only relevant if both password and confirmPassword are provided
  // This is primarily for the account creation step.
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    });
  } else if (data.password && !data.confirmPassword) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Please confirm your password.',
    });
  }
});
export type ParentInfoData = z.infer<typeof ParentInfoSchema>;


export const ParticipantInfoSchema = z.object({
  firstName: z.string().min(2, "Participant's/Trainee's first name must be at least 2 characters.").trim(),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  specialAttention: z.string().trim().optional(),
  schoolGrade: z.string().optional(),
  quranLevel: z.string().optional(),
  guardianFullName: z.string().min(3, "Guardian's/Trainee's full name must be at least 3 characters.").trim(),
  guardianPhone1: z.string().regex(phoneRegex, "Guardian's/Trainee's primary phone invalid.").trim(),
  guardianPhone2: z.string().regex(phoneRegex, "Secondary phone invalid.").optional().or(z.literal('')),
  guardianTelegramPhoneNumber: z.string().regex(phoneRegex, "Telegram phone invalid.").trim(),
  guardianUsePhone1ForTelegram: z.boolean().optional(),
  guardianUsePhone2ForTelegram: z.boolean().optional(),
  certificateFile: z.any().optional(), // For File object
  certificateDataUri: z.string().optional(), // For base64 string
});
export type ParticipantInfoData = z.infer<typeof ParticipantInfoSchema>;

export const EnrolledParticipantSchema = z.object({
  programId: z.string().min(1, "Program selection is required for each participant."),
  participantInfo: ParticipantInfoSchema,
});
export type EnrolledParticipantData = z.infer<typeof EnrolledParticipantSchema>;

// Base PaymentProofSchema focusing on individual field types, made optional here
export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment method is required."),
  proofSubmissionType: z.enum(['transactionId', 'screenshot', 'pdfLink'], {
    required_error: "Proof submission method is required.",
  }),
  screenshot: z.any().optional(), 
  screenshotDataUri: z.string().optional().or(z.literal('')),
  pdfLink: z.string().url("Invalid URL format. Must be http:// or https://").optional().or(z.literal('')),
  transactionId: z.string().optional().or(z.literal('')),
}).optional(); // Make the whole object optional at this level

export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  parentInfo: z.object({
    parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters.").trim().optional(),
    parentEmail: z.string().regex(emailRegex, "Invalid email address format.").trim().optional(),
    parentPhone1: z.string().regex(phoneRegex, "Primary phone number invalid (e.g., 0911XXXXXX).").trim().optional(),
  }).optional(),
  participants: z.array(EnrolledParticipantSchema).min(1, "At least one participant must be enrolled."),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema, // Referencing the optional schema
  loginEmail: z.string().regex(emailRegex, "Invalid email address format for login.").trim().optional(),
  loginPassword: z.string().min(6, "Password for login must be at least 6 characters.").optional(),
})
.superRefine((data, ctx) => {
    const hasParticipants = data.participants && data.participants.length > 0;

    if (hasParticipants) {
        if (!data.paymentProof) {
            // If paymentProof object itself is missing, flag its conceptually mandatory sub-fields
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'paymentType'], 
                message: 'Payment method (bank) selection is required.',
            });
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'proofSubmissionType'],
                message: 'Proof submission method selection is required.',
            });
            // Optionally, add a general message to the paymentProof object path itself
            // This might not always show up in errorsFromRHF argument but helps formState.errors
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof'], 
                message: 'Payment details are incomplete. Please select method and proof type.',
            });
            return; // Stop further validation of paymentProof if the object itself is missing
        }

        // If paymentProof object exists, validate its properties
        if (!data.paymentProof.paymentType || data.paymentProof.paymentType.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'paymentType'],
                message: 'Payment method (bank) selection is required.',
            });
        }
        
        if (!data.paymentProof.proofSubmissionType) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'proofSubmissionType'],
                message: 'Proof submission method selection is required.',
            });
        } else { // Only check sub-proof types if proofSubmissionType IS selected
            if (data.paymentProof.proofSubmissionType === 'transactionId') {
                if (!data.paymentProof.transactionId || data.paymentProof.transactionId.trim().length < 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'transactionId'],
                        message: 'Transaction ID is required and must be at least 3 characters.',
                    });
                }
            } else if (data.paymentProof.proofSubmissionType === 'screenshot') {
                if (!data.paymentProof.screenshotDataUri || data.paymentProof.screenshotDataUri.trim() === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        // Path for UI field related to screenshot upload
                        path: ['paymentProof', 'screenshot'], 
                        message: 'A screenshot file is required for this submission type.',
                    });
                }
            } else if (data.paymentProof.proofSubmissionType === 'pdfLink') {
                if (!data.paymentProof.pdfLink || data.paymentProof.pdfLink.trim() === '' || !z.string().url().safeParse(data.paymentProof.pdfLink).success) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'pdfLink'],
                        message: 'A valid PDF link (e.g., https://...) is required.',
                    });
                }
            }
        }
    }
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

// For storing in Firestore, we ensure ParentInfoData is used fully
export type RegistrationData = {
  parentInfo: ParentInfoData; 
  participants: EnrolledParticipantData[];
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData; // The submitted proof, which would have passed validation
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; // For admin notes, AI results (if any), etc.
  registrationDate: Date | string; // Store as ISO string in Firestore, convert to Date in app
  firebaseUserId?: string; // Link to Firebase Auth user
};


export const BankDetailFormSchema = z.object({
  value: z.string().min(3, "Bank ID must be at least 3 characters (e.g., 'cbe_branch_x').").regex(/^[a-z0-9_]+$/, "ID can only contain lowercase letters, numbers, and underscores."),
  logoPlaceholder: z.string().url({ message: "Please enter a valid URL for the logo placeholder." }).optional().or(z.literal('')),
  dataAiHint: z.string().optional(),
  iconUrl: z.string().url({ message: "Please enter a valid URL for the icon." }).optional().or(z.literal('')),
  iconDataAiHint: z.string().optional(),
  accountNumber: z.string().min(5, "Account number must be at least 5 digits.").optional().or(z.literal('')),
  enLabel: z.string().min(1, "English label (Bank Name) is required."),
  enAccountName: z.string().optional(),
  enAdditionalInstructions: z.string().optional(),
  amLabel: z.string().optional(),
  amAccountName: z.string().optional(),
  amAdditionalInstructions: z.string().optional(),
  arLabel: z.string().optional(),
  arAccountName: z.string().optional(),
  arAdditionalInstructions: z.string().optional(),
});

export type BankDetailFormData = z.infer<typeof BankDetailFormSchema>;

const couponDiscountTypes: [CouponDiscountType, ...CouponDiscountType[]] = ['percentage', 'fixed_amount'];

export const CouponFormSchema = z.object({
  id: z.string().min(3, "Coupon ID must be at least 3 characters.").regex(/^[a-zA-Z0-9_.-]+$/, "ID can only contain letters, numbers, underscores, hyphens, and periods."),
  couponCode: z.string().min(3, "Coupon Code must be at least 3 characters.").regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, underscores, and hyphens."),
  discountType: z.enum(couponDiscountTypes, { required_error: "Discount type is required." }),
  discountValue: z.coerce.number().min(0, "Discount value must be positive."),
  description: z.string().optional(),
  expiryDate: z.date().optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === 'percentage' && (data.discountValue < 0 || data.discountValue > 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Percentage discount must be between 0 and 100.',
    });
  }
});

export type CouponFormData = z.infer<typeof CouponFormSchema>;
export type CouponData = ConstantCouponData;


export type { HafsaProgram, ProgramField, HafsaPaymentMethod, HafsaProgramCategory };

    

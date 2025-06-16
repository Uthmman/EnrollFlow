
import { z } from 'zod';
import type { HafsaProgram, ProgramField, HafsaPaymentMethod, HafsaProgramCategory, CouponData as ConstantCouponData, CouponDiscountType } from '@/lib/constants';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{9,15}$/; // Allows for international numbers, adjust if only local

// Schema for Login
export const LoginSchema = z.object({
    loginEmail: z.string().regex(emailRegex, "Invalid email address format for login.").trim(),
    loginPassword: z.string().min(6, "Password for login must be at least 6 characters."),
});
export type LoginData = z.infer<typeof LoginSchema>;


// Schema for Parent/Registrant Information (used for new account creation)
export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters.").trim(),
  parentEmail: z.string().regex(emailRegex, "Invalid email address format.").trim(),
  parentPhone1: z.string().regex(phoneRegex, "Primary phone number invalid (e.g., 0911XXXXXX).").trim().optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters.").optional(),
}).superRefine((data, ctx) => {
  if (data.password && data.confirmPassword) { // Only validate if both are provided (for new registration)
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }
  } else if (data.password && !data.confirmPassword) { // If password is provided, confirmation is needed
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Please confirm your password.',
    });
  }
  // No issue if only confirmPassword is provided without password, or if neither are (for logged-in state)
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
  certificateFile: z.any().optional(),
  certificateDataUri: z.string().optional(),
});
export type ParticipantInfoData = z.infer<typeof ParticipantInfoSchema>;

export const EnrolledParticipantSchema = z.object({
  programId: z.string().min(1, "Program selection is required for each participant."),
  participantInfo: ParticipantInfoSchema,
});
export type EnrolledParticipantData = z.infer<typeof EnrolledParticipantSchema>;

export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment method is required."),
  proofSubmissionType: z.enum(['transactionId', 'screenshot', 'pdfLink'], {
    required_error: "Proof submission method is required.",
  }),
  screenshot: z.any().optional(),
  screenshotDataUri: z.string().optional(),
  pdfLink: z.string().url("Invalid URL for PDF link.").optional().or(z.literal('')),
  transactionId: z.string().min(3, "Transaction ID must be at least 3 characters.").optional().or(z.literal('')),
}).refine(data => {
  if (data.proofSubmissionType === 'transactionId') {
    return data.transactionId && data.transactionId.trim().length >= 3;
  }
  return true;
}, {
  message: 'Transaction ID is required and must be at least 3 characters when submission type is Transaction ID.',
  path: ['transactionId'],
}).refine(data => {
  if (data.proofSubmissionType === 'screenshot') {
    return data.screenshotDataUri && data.screenshotDataUri.trim() !== '';
  }
  return true;
}, {
  message: 'Please upload a screenshot for verification when submission type is Screenshot.',
  path: ['screenshot'], // This path will relate to the file input field in the UI
}).refine(data => {
  if (data.proofSubmissionType === 'pdfLink') {
    return data.pdfLink && data.pdfLink.trim() !== '' && (data.pdfLink.startsWith('http://') || data.pdfLink.startsWith('https://'));
  }
  return true;
}, {
  message: 'A valid PDF link (starting with http:// or https://) is required when submission type is PDF Link.',
  path: ['pdfLink'],
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  parentInfo: z.object({ // Manually define as optional, equivalent to ParentInfoSchema.partial().optional()
    parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters.").trim().optional(),
    parentEmail: z.string().regex(emailRegex, "Invalid email address format.").trim().optional(),
    parentPhone1: z.string().regex(phoneRegex, "Primary phone number invalid (e.g., 0911XXXXXX).").trim().optional(),
    password: z.string().min(6, "Password must be at least 6 characters.").optional(),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters.").optional(),
  }).optional(),
  participants: z.array(EnrolledParticipantSchema).optional().default([]),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema.optional(), // This will now use the refined PaymentProofSchema
  loginEmail: z.string().regex(emailRegex, "Invalid email address format for login.").trim().optional(),
  loginPassword: z.string().min(6, "Password for login must be at least 6 characters.").optional(),
})
.superRefine((data, ctx) => {
    const hasParticipants = data.participants && data.participants.length > 0;

    if (hasParticipants) {
        if (!data.paymentProof) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof'], // General path for the whole paymentProof object
                message: 'Payment details (including method and proof type) are required when participants are enrolled.',
            });
        } else {
            // The detailed validation of transactionId, pdfLink, screenshotDataUri
            // based on proofSubmissionType is now handled within PaymentProofSchema.refine.
            // We still need to ensure that paymentType and proofSubmissionType are selected.
            if (!data.paymentProof.paymentType || data.paymentProof.paymentType.trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['paymentProof', 'paymentType'],
                    message: 'Please select a payment method.',
                });
            }
            if (!data.paymentProof.proofSubmissionType) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['paymentProof', 'proofSubmissionType'],
                    message: 'Please select a proof submission method.',
                });
            }
        }
    }
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

export type RegistrationData = {
  parentInfo: ParentInfoData;
  participants: EnrolledParticipantData[];
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData;
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any;
  registrationDate: Date | string;
  firebaseUserId?: string;
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
    

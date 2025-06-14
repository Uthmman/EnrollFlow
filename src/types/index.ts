
import { z } from 'zod';

// Program related types
export type ProgramField =
  | { type: 'text'; name: 'specialAttention'; label: 'Special Attention (e.g., allergies, specific needs)' }
  | { type: 'select'; name: 'schoolGrade'; label: 'School Grade'; options: string[] }
  | { type: 'select'; name: 'quranLevel'; label: 'Quran Level'; options: string[] };

export type HafsaProgram = {
  id: string; // Firestore document ID will be used here
  label: string;
  description: string;
  price: number;
  category: 'daycare' | 'quran_kids' | 'arabic_women';
  ageRange?: string;
  duration?: string;
  schedule?: string;
  isChildProgram: boolean;
  specificFields?: ProgramField[];
  termsAndConditions: string;
};


// Authentication and Form related types
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{9,15}$/; // Basic phone regex, adjust if needed for specific formats

export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters."),
  parentEmail: z.string().regex(emailRegex, "Invalid email address format."),
  parentPhone1: z.string().regex(phoneRegex, "Invalid primary phone number format (e.g., 0911XXXXXX).").optional(), // Added primary phone
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters."),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    });
  }
});
export type ParentInfoData = z.infer<typeof ParentInfoSchema>;

export const ParticipantInfoSchema = z.object({
  firstName: z.string().min(2, "Participant's first name must be at least 2 characters."),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Participant's date of birth is required." }),
  specialAttention: z.string().optional(),
  schoolGrade: z.string().optional(),
  quranLevel: z.string().optional(),
  guardianFullName: z.string().min(3, "Guardian's full name must be at least 3 characters."),
  guardianPhone1: z.string().regex(phoneRegex, "Invalid guardian primary phone number format."),
  guardianPhone2: z.string().regex(phoneRegex, "Invalid guardian secondary phone number format.").optional().or(z.literal('')),
  guardianTelegramPhoneNumber: z.string().regex(phoneRegex, "Invalid guardian Telegram phone number format."),
  guardianUsePhone1ForTelegram: z.boolean().optional(),
  guardianUsePhone2ForTelegram: z.boolean().optional(),
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
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  parentInfo: ParentInfoSchema,
  participants: z.array(EnrolledParticipantSchema).optional().default([]),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema.optional(),
  loginEmail: z.string().regex(emailRegex, "Invalid email address format.").optional(),
  loginPassword: z.string().min(6, "Password must be at least 6 characters.").optional(),
  otp: z.string().min(6, "OTP must be 6 digits.").optional(), // Kept for potential future use, but not active in email/pass
})
.superRefine((data, ctx) => {
    if (data.paymentProof) {
        const { proofSubmissionType, transactionId, screenshot, pdfLink, screenshotDataUri } = data.paymentProof;
        if (proofSubmissionType === 'transactionId') {
            if (!transactionId || transactionId.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'transactionId'],
                message: 'Transaction ID is required and must be at least 3 characters.',
            });
            }
        } else if (proofSubmissionType === 'screenshot') {
            if (typeof window !== 'undefined') {
                const ssAsFileList = screenshot as FileList | undefined | null;
                if (!ssAsFileList || ssAsFileList.length === 0) {
                    // Only add error if screenshotDataUri is also missing
                    if (!screenshotDataUri) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            path: ['paymentProof', 'screenshot'],
                            message: 'Please upload a screenshot file for verification.',
                        });
                    }
                } else if (ssAsFileList.length > 1) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'Only one screenshot can be uploaded.',
                    });
                } else if (!(ssAsFileList[0] instanceof File)) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'A valid screenshot file object is required.',
                    });
                }
            } else { // For server-side or environments without FileList
                 if (!screenshotDataUri && !screenshot) { // Check if either is present
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'Screenshot is required for this submission type (ensure it is uploaded).',
                    });
                 }
            }
        } else if (proofSubmissionType === 'pdfLink') {
            if (!pdfLink || (!pdfLink.startsWith('http://') && !pdfLink.startsWith('https://'))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'pdfLink'],
                message: 'A valid PDF link (starting with http:// or https://) is required for this proof type.',
            });
            }
        }
    }

    const hasParticipants = data.participants && data.participants.length > 0;
    const hasPaymentProofObject = !!data.paymentProof;
    const paymentMethodSelected = !!data.paymentProof?.paymentType;
    const proofSubmissionTypeSelected = !!data.paymentProof?.proofSubmissionType;

    if (hasParticipants && !hasPaymentProofObject) {
       ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['paymentProof', 'paymentType'],
            message: 'Payment details are required when participants are enrolled.',
        });
    } else if (hasParticipants && hasPaymentProofObject) {
        if (!paymentMethodSelected) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'paymentType'],
                message: 'Please select a payment method.',
            });
        }
        if (!proofSubmissionTypeSelected) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentProof', 'proofSubmissionType'],
                message: 'Please select a proof submission method.',
            });
        }
    } else if (!hasParticipants && hasPaymentProofObject && (paymentMethodSelected || proofSubmissionTypeSelected)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participants'],
        message: 'At least one participant must be enrolled to submit payment proof.',
      });
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
  registrationDate: Date;
  firebaseUserId?: string; // Added to store Firebase User ID
};

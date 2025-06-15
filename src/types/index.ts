
import { z } from 'zod';
// Import HafsaProgram, ProgramField, HafsaPaymentMethod etc. from constants where they are now primarily defined
import type { HafsaProgram, ProgramField, HafsaPaymentMethod, HafsaProgramCategory } from '@/lib/constants';

// Authentication and Form related types
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{9,15}$/; // Basic phone regex, adjust if needed for specific formats

export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters."),
  parentEmail: z.string().regex(emailRegex, "Invalid email address format."),
  parentPhone1: z.string().regex(phoneRegex, "Primary phone number invalid (e.g., 0911XXXXXX)."),
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
  firstName: z.string().min(2, "Participant's/Trainee's first name must be at least 2 characters."),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  specialAttention: z.string().optional(),
  schoolGrade: z.string().optional(),
  quranLevel: z.string().optional(),
  guardianFullName: z.string().min(3, "Guardian's/Trainee's full name must be at least 3 characters."),
  guardianPhone1: z.string().regex(phoneRegex, "Guardian's/Trainee's primary phone invalid."),
  guardianPhone2: z.string().regex(phoneRegex, "Secondary phone invalid.").optional().or(z.literal('')),
  guardianTelegramPhoneNumber: z.string().regex(phoneRegex, "Telegram phone invalid."),
  guardianUsePhone1ForTelegram: z.boolean().optional(),
  guardianUsePhone2ForTelegram: z.boolean().optional(),
});
export type ParticipantInfoData = z.infer<typeof ParticipantInfoSchema>;

export const EnrolledParticipantSchema = z.object({
  programId: z.string().min(1, "Program selection is required for each participant."),
  // Store program details that were current at time of enrollment for receipt/history
  // This could include the translated label and price, but for simplicity, we might just store ID
  // and look it up. For now, just programId.
  participantInfo: ParticipantInfoSchema,
});
export type EnrolledParticipantData = z.infer<typeof EnrolledParticipantSchema>;

export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment method is required."), // This will be the ID/value from Firestore
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
            } else { 
                 if (!screenshotDataUri && !screenshot) { 
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

// Store IDs for program and payment method, actual translated data can be looked up
// or a snapshot of relevant translated fields can be stored.
// For simplicity, we'll store less here and rely on lookups in components like Receipt.
export type RegistrationData = {
  parentInfo: ParentInfoData;
  participants: EnrolledParticipantData[]; // Contains programId
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData; // Contains paymentType (ID)
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any;
  registrationDate: Date;
  firebaseUserId?: string;
};

// Re-exporting types defined in constants.ts for centralized access
export type { HafsaProgram, ProgramField, HafsaPaymentMethod, HafsaProgramCategory };

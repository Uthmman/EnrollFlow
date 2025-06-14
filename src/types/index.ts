
import { z } from 'zod';

const phoneRegex = /^[0-9]{9,15}$/; // General phone regex, adjust as needed

// Simplified schema for the primary account holder
export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters."),
  parentPhone1: z.string().regex(phoneRegex, "Invalid primary phone number format."),
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

// Expanded schema for each participant, now including their specific guardian's contact
export const ParticipantInfoSchema = z.object({
  // Participant's own details
  firstName: z.string().min(2, "Participant's first name must be at least 2 characters."),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Participant's date of birth is required." }),
  
  // Program-specific details (optional, based on program)
  specialAttention: z.string().optional(),
  schoolGrade: z.string().optional(),
  quranLevel: z.string().optional(),

  // Guardian contact details for this specific participant
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
  screenshot: z.any().optional(), // Changed from z.instanceof(FileList) to z.any() for SSR safety
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
  loginIdentifier: z.string().optional(), 
  loginPassword: z.string().optional(), 
})
.superRefine((data, ctx) => {
    // Specific validations for paymentProof fields based on proofSubmissionType
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
            if (typeof window !== 'undefined') { // Client-side specific checks for FileList/File
                const ssAsFileList = screenshot as FileList | undefined | null; // Cast for client-side context
                if (!ssAsFileList || ssAsFileList.length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'Please upload a screenshot file for verification.',
                    });
                } else if (ssAsFileList.length > 1) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'Only one screenshot can be uploaded.',
                    });
                } else if (!(ssAsFileList[0] instanceof File)) { // File is generally available in modern Node, but FileList isn't.
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['paymentProof', 'screenshot'],
                        message: 'A valid screenshot file object is required.',
                    });
                }
            } else {
                 // Server-side context: 'screenshot' won't be a FileList.
                 // Check if screenshotDataUri is missing, as that's what server would expect if client processed it.
                 // However, this schema is mainly for client form validation before screenshotDataUri is generated.
                 // A simple check for presence might be 'if (!screenshot && !screenshotDataUri)'
                 // but 'screenshot' on server isn't meaningful as FileList.
                 // Rely on client validation for file object; server action will check screenshotDataUri.
                 if (!screenshotDataUri && !screenshot) { // if screenshot (placeholder for file list) and data URI are both missing
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

// Defines the structure for the actual registration record
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
};

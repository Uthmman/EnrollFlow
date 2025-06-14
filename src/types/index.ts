
import { z } from 'zod';

const phoneRegex = /^[0-9]{9,15}$/;

export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Registrant's full name must be at least 3 characters."),
  parentPhone1: z.string().regex(phoneRegex, "Invalid primary phone number format."),
  parentPhone2: z.string().regex(phoneRegex, "Invalid secondary phone number format.").optional().or(z.literal('')),
  telegramPhoneNumber: z.string().regex(phoneRegex, "Invalid Telegram phone number format."),
  usePhone1ForTelegram: z.boolean().optional(),
  usePhone2ForTelegram: z.boolean().optional(),
});
export type ParentInfoData = z.infer<typeof ParentInfoSchema>;

export const ParticipantInfoSchema = z.object({
  firstName: z.string().min(2, "Participant's first name must be at least 2 characters."),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Participant's date of birth is required." }),
  specialAttention: z.string().optional(),
  schoolGrade: z.string().optional(),
  quranLevel: z.string().optional(),
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
  screenshot: z.custom<File>((val) => val instanceof File, "Screenshot file is required.").optional(),
  screenshotDataUri: z.string().optional(),
  pdfLink: z.string().url("Invalid URL for PDF link.").optional().or(z.literal('')),
  transactionId: z.string().min(3, "Transaction ID must be at least 3 characters.").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.proofSubmissionType === 'transactionId' && (!data.transactionId || data.transactionId.length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['transactionId'],
      message: 'Transaction ID is required and must be at least 3 characters.',
    });
  }
  if (data.proofSubmissionType === 'screenshot' && !data.screenshot) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['screenshot'],
      message: 'Screenshot is required for this proof type.',
    });
  }
  if (data.proofSubmissionType === 'pdfLink' && (!data.pdfLink || (!data.pdfLink.startsWith('http://') && !data.pdfLink.startsWith('https://')))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pdfLink'],
      message: 'A valid PDF link (starting with http:// or https://) is required for this proof type.',
    });
  }
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  parentInfo: ParentInfoSchema,
  participants: z.array(EnrolledParticipantSchema).optional().default([]), // Participants are optional until payment
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema.optional(),
  loginIdentifier: z.string().optional(),
  loginPassword: z.string().optional(),
})
.superRefine((data, ctx) => {
    if (!data.parentInfo || !data.parentInfo.parentFullName) {
        // This check is more relevant for the registration path.
        // For login, parentInfo might be populated after successful login.
        // We might need a more sophisticated way to handle this if we were fully implementing login.
    }
    if (data.participants && data.participants.length > 0 && !data.paymentProof) {
       ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['paymentProof.paymentType'],
            message: 'Payment information is required when participants are enrolled.',
        });
    }
     if (data.paymentProof && (!data.participants || data.participants.length === 0)) {
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
  paymentVerificationDetails?: any; // This can be VerifyPaymentFromScreenshotOutput or similar
  registrationDate: Date;
};

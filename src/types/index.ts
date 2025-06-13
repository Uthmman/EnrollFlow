
import { z } from 'zod';
import { HAFSA_PROGRAMS, SCHOOL_GRADES, QURAN_LEVELS } from '@/lib/constants';

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

export const ChildInfoSchema = z.object({
  childFirstName: z.string().min(2, "Child's first name must be at least 2 characters."),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Child's date of birth is required." }),
  specialAttention: z.string().optional(), 
  schoolGrade: z.string().optional(), 
  quranLevel: z.string().optional(), 
});
export type ChildInfoData = z.infer<typeof ChildInfoSchema>;

export const EnrolledChildSchema = z.object({
  programId: z.string().min(1, "Program selection is required for each child."),
  childInfo: ChildInfoSchema,
});
export type EnrolledChildData = z.infer<typeof EnrolledChildSchema>;


export const AdultTraineeSchema = z.object({
  dateOfBirth: z.date({ required_error: "Trainee's date of birth is required." }),
  programId: z.string().min(1, "Program selection is required for the trainee."),
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
  parentInfo: ParentInfoSchema, 
  adultTraineeInfo: AdultTraineeSchema.optional(), 
  children: z.array(EnrolledChildSchema).optional().default([]),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  couponCode: z.string().optional(),
  paymentProof: PaymentProofSchema.optional(),
})
.superRefine((data, ctx) => {
    if (!data.parentInfo || !data.parentInfo.parentFullName) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['parentInfo', 'parentFullName'],
            message: 'Primary registrant information is required.',
        });
    }

    if (data.adultTraineeInfo) {
        if (!data.adultTraineeInfo.programId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['adultTraineeInfo', 'programId'],
                message: 'Program selection is required for adult trainee.',
            });
        }
        if (!data.adultTraineeInfo.dateOfBirth) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['adultTraineeInfo', 'dateOfBirth'],
                message: 'Date of birth is required for adult trainee.',
            });
        }
    }
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

export type RegistrationData = {
  parentInfo: ParentInfoData; 
  adultTraineeInfo?: AdultTraineeData; 
  children?: EnrolledChildData[];
  agreeToTerms: boolean;
  couponCode?: string;
  paymentProof: PaymentProofData;
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; 
  registrationDate: Date;
};

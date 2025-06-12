import { z } from 'zod';

export const StudentInfoSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").optional(),
  address: z.string().min(5, "Address must be at least 5 characters.").optional(),
});

export const ProgramSelectionSchema = z.object({
  schoolLevel: z.string().min(1, "School level is required."),
  program: z.string().min(1, "Program is required."),
  selectedCourses: z.array(z.string()).optional(),
});

export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment type is required."),
  screenshot: z.custom<File>((val) => val instanceof File, "Screenshot is required.").optional(),
  screenshotDataUri: z.string().optional(),
  pdfLink: z.string().url("Invalid URL for PDF link.").optional(),
  transactionId: z.string().min(5, "Transaction ID must be at least 5 characters.").optional(),
});

export const EnrollmentFormSchema = ProgramSelectionSchema.merge(StudentInfoSchema).merge(PaymentProofSchema);

export type StudentInfoData = z.infer<typeof StudentInfoSchema>;
export type ProgramSelectionData = z.infer<typeof ProgramSelectionSchema>;
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;
export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

export type RegistrationData = EnrollmentFormData & {
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; // Consider defining this more strictly
  registrationDate: Date;
};

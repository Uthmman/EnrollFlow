import { z } from 'zod';

export const ParentInfoSchema = z.object({
  parentFullName: z.string().min(3, "Parent's full name must be at least 3 characters."),
  parentEmail: z.string().email("Invalid parent email address."),
  parentPhone: z.string().min(10, "Parent's phone number must be at least 10 digits.").optional(),
});

export type ParentInfoData = z.infer<typeof ParentInfoSchema>;

export const ChildInfoSchema = z.object({
  fullName: z.string().min(3, "Child's full name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Child's date of birth is required." }),
  // Email, phone, address for child can be optional or removed if not needed per child, assuming parent contact is primary
  // For now, let's keep them minimal
});

export const ChildProgramSelectionSchema = z.object({
  schoolLevel: z.string().min(1, "School level is required."),
  program: z.string().min(1, "Program is required."),
  selectedCourses: z.array(z.string()).optional(),
});

// Combines info and program selection for a single child
export const ChildEnrollmentSchema = ChildInfoSchema.merge(ChildProgramSelectionSchema);
export type ChildEnrollmentData = z.infer<typeof ChildEnrollmentSchema>;

export const PaymentProofSchema = z.object({
  paymentType: z.string().min(1, "Payment type is required."),
  screenshot: z.custom<File>((val) => val instanceof File, "Screenshot is required.").optional(),
  screenshotDataUri: z.string().optional(),
  pdfLink: z.string().url("Invalid URL for PDF link.").optional(),
  transactionId: z.string().min(5, "Transaction ID must be at least 5 characters.").optional(),
});
export type PaymentProofData = z.infer<typeof PaymentProofSchema>;


export const EnrollmentFormSchema = z.object({
  parentInfo: ParentInfoSchema,
  children: z.array(ChildEnrollmentSchema).min(1, "At least one child must be registered."),
  paymentProof: PaymentProofSchema,
});

export type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

// Data structure for the final receipt
export type RegistrationData = {
  parentInfo: ParentInfoData;
  children: ChildEnrollmentData[]; // Array of children, each with their full details
  paymentProof: PaymentProofData;
  calculatedPrice: number;
  paymentVerified: boolean;
  paymentVerificationDetails?: any; 
  registrationDate: Date;
};

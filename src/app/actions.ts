
"use server";

import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput } from '@/ai/flows/payment-verification';
import type { PaymentProofData } from '@/types'; 

interface VerificationInput {
  paymentProof: PaymentProofData; 
  expectedAmount: number;
}

interface VerificationResult {
  isPaymentValid: boolean;
  extractedPaymentAmount?: number;
  transactionNumber?: string;
  reason?: string;
  message: string;
}

export async function handlePaymentVerification(input: VerificationInput): Promise<VerificationResult> {
  const { paymentProof, expectedAmount } = input;

  if (!paymentProof.proofSubmissionType) {
    return { isPaymentValid: false, message: "Proof submission type is missing." };
  }

  // All current payment types in HAFSA_PAYMENT_METHODS are bank-like and require proof.
  // The paymentProof.paymentType indicates the bank (e.g., 'cbe', 'telebirr').
  // The paymentProof.proofSubmissionType indicates how proof is provided.

  switch (paymentProof.proofSubmissionType) {
    case 'transactionId':
      if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
        return { 
          isPaymentValid: true, // Basic validation, assumes ID is correct
          transactionNumber: paymentProof.transactionId,
          message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType}. Verification pending.` 
        };
      }
      return { 
          isPaymentValid: false, 
          transactionNumber: paymentProof.transactionId,
          message: `Transaction ID/Reference is required and must be at least 3 characters for ${paymentProof.paymentType}.` 
      };

    case 'screenshot':
      if (!paymentProof.screenshotDataUri) {
        return { isPaymentValid: false, message: "Screenshot data URI is missing for AI verification." };
      }
      try {
        const aiInput: VerifyPaymentFromScreenshotInput = {
          paymentScreenshotDataUri: paymentProof.screenshotDataUri!, 
          expectedPaymentAmount: expectedAmount,
          transactionNumber: paymentProof.transactionId, // Can still pass if user also entered it
        };
        
        const aiResult = await verifyPaymentFromScreenshot(aiInput);

        if (aiResult.isPaymentValid && aiResult.extractedPaymentAmount === expectedAmount) {
          return { ...aiResult, message: "Payment verified successfully by AI from screenshot." };
        } else if (aiResult.isPaymentValid && aiResult.extractedPaymentAmount !== expectedAmount) {
           return { 
              ...aiResult, 
              isPaymentValid: false, 
              reason: aiResult.reason || `Extracted amount ${aiResult.extractedPaymentAmount} does not match expected amount ${expectedAmount}.`,
              message: `Payment amount mismatch from screenshot. Expected ${expectedAmount}, AI extracted ${aiResult.extractedPaymentAmount}.`
          };
        } else {
          return { ...aiResult, isPaymentValid: false, message: aiResult.reason || "AI verification from screenshot failed." };
        }
      } catch (error) {
        console.error("AI Payment Screenshot Verification Error:", error);
        return { isPaymentValid: false, message: "An error occurred during AI screenshot verification." };
      }

    case 'pdfLink':
      if (paymentProof.pdfLink && (paymentProof.pdfLink.startsWith('http://') || paymentProof.pdfLink.startsWith('https://'))) {
        // For PDF links, direct AI verification isn't implemented in the current AI flow.
        // This would typically be a manual check or require a different AI model/flow for PDF processing.
        // We'll assume valid for submission, pending manual verification.
        return { 
          isPaymentValid: true, // Submitted, but not AI verified.
          message: `Payment proof submitted via PDF link: ${paymentProof.pdfLink} for ${paymentProof.paymentType}. Verification pending.` 
        };
      }
      return { 
          isPaymentValid: false, 
          message: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType}.` 
      };

    default:
      return { isPaymentValid: false, message: "Invalid proof submission type." };
  }
}

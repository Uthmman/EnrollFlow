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

  if (paymentProof.paymentType === "screenshot") {
    if (!paymentProof.screenshotDataUri) {
      return { isPaymentValid: false, message: "Screenshot data URI is missing." };
    }

    try {
      const aiInput: VerifyPaymentFromScreenshotInput = {
        paymentScreenshotDataUri: paymentProof.screenshotDataUri,
        expectedPaymentAmount: expectedAmount,
        transactionNumber: paymentProof.transactionId, // Pass if available from form
      };
      
      const aiResult = await verifyPaymentFromScreenshot(aiInput);

      if (aiResult.isPaymentValid && aiResult.extractedPaymentAmount === expectedAmount) {
        return { ...aiResult, message: "Payment verified successfully by AI." };
      } else if (aiResult.isPaymentValid && aiResult.extractedPaymentAmount !== expectedAmount) {
         return { 
            ...aiResult, 
            isPaymentValid: false, 
            reason: aiResult.reason || `Extracted amount ${aiResult.extractedPaymentAmount} does not match expected amount ${expectedAmount}.`,
            message: `Payment amount mismatch. Expected ${expectedAmount}, got ${aiResult.extractedPaymentAmount}.`
        };
      } else {
        return { ...aiResult, message: aiResult.reason || "AI verification failed." };
      }
    } catch (error) {
      console.error("AI Payment Verification Error:", error);
      return { isPaymentValid: false, message: "An error occurred during AI payment verification." };
    }
  } else if (paymentProof.paymentType === "link") {
    // Placeholder logic for PDF link verification
    // In a real app, you might fetch the PDF, parse it, etc.
    // For now, assume valid if a link is provided. Could add amount check if user enters it.
    if (paymentProof.pdfLink) {
      return { isPaymentValid: true, message: "PDF link submitted. (Verification Placeholder)" };
    }
    return { isPaymentValid: false, message: "PDF link is missing." };
  } else if (paymentProof.paymentType === "transaction_id") {
    // Placeholder logic for Transaction ID
    // For now, assume valid if an ID is provided. Could add amount check.
    if (paymentProof.transactionId) {
      return { isPaymentValid: true, transactionNumber: paymentProof.transactionId, message: "Transaction ID submitted. (Verification Placeholder)" };
    }
    return { isPaymentValid: false, message: "Transaction ID is missing." };
  }

  return { isPaymentValid: false, message: "Invalid payment proof type." };
}

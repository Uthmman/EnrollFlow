
"use server";

import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput } from '@/ai/flows/payment-verification';
// Make sure PaymentProofData is imported correctly based on the new types structure
import type { PaymentProofData } from '@/types'; 

interface VerificationInput {
  paymentProof: PaymentProofData; // This type itself might not need to change if it's self-contained
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
      // Check if a file was provided for screenshot, as screenshotDataUri is generated on client
      if (!paymentProof.screenshot) {
         return { isPaymentValid: false, message: "Screenshot file or data URI is missing." };
      }
      // If screenshotDataUri is still missing at this point (shouldn't happen if file provided)
      // it will be caught by the AI flow or prior logic.
      // For AI, screenshotDataUri is essential.
    }

    try {
      const aiInput: VerifyPaymentFromScreenshotInput = {
        paymentScreenshotDataUri: paymentProof.screenshotDataUri!, // Asserting it's present due to check or client-side generation
        expectedPaymentAmount: expectedAmount,
        transactionNumber: paymentProof.transactionId,
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
    if (paymentProof.pdfLink) {
       // Basic validation for PDF link, could be enhanced
      if (!paymentProof.pdfLink.startsWith('http://') && !paymentProof.pdfLink.startsWith('https://')) {
         return { isPaymentValid: false, message: "Invalid PDF link format." };
      }
      // For now, assume valid if a link is provided.
      return { isPaymentValid: true, message: "PDF link submitted. (Basic Verification)" };
    }
    return { isPaymentValid: false, message: "PDF link is missing." };
  } else if (paymentProof.paymentType === "transaction_id") {
    if (paymentProof.transactionId && paymentProof.transactionId.length >= 5) {
      // For now, assume valid if an ID is provided.
      return { isPaymentValid: true, transactionNumber: paymentProof.transactionId, message: "Transaction ID submitted. (Basic Verification)" };
    }
    return { isPaymentValid: false, message: "Transaction ID is missing or too short." };
  }

  return { isPaymentValid: false, message: "Invalid payment proof type." };
}

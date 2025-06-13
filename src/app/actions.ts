
"use server";

import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput } from '@/ai/flows/payment-verification';
// Import main form data type, and also specific payment proof type for clarity
import type { EnrollmentFormData, PaymentProofData } from '@/types'; 
import { HAFSA_PAYMENT_METHODS } from '@/lib/constants';

interface VerificationInput {
  // The paymentProof part of EnrollmentFormData
  paymentProof: PaymentProofData; 
  expectedAmount: number;
  // Potentially add coupon code here if server-side validation is needed
  // couponCode?: string; 
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

  // Check if the payment type is one of the new Hafsa Madrassa methods
  const isHafsaMethod = HAFSA_PAYMENT_METHODS.some(method => method.value === paymentProof.paymentType);

  if (isHafsaMethod) {
    // For these methods, we are currently relying on a transaction ID / reference.
    // Actual verification would likely be manual or via direct bank integration,
    // which is beyond the scope of this AI-focused verification flow.
    // We'll assume valid if a transaction ID is provided.
    if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) { // Min length for a basic check
      return { 
        isPaymentValid: true, 
        transactionNumber: paymentProof.transactionId,
        message: `Payment submitted via ${paymentProof.paymentType}. Verification pending confirmation of Transaction ID: ${paymentProof.transactionId}.` 
      };
    }
    return { 
        isPaymentValid: false, 
        message: `Transaction ID/Reference is required for ${paymentProof.paymentType}.` 
    };
  } else if (paymentProof.paymentType === "screenshot_ai_verification") { // Example value if you want to keep AI for screenshots
    if (!paymentProof.screenshotDataUri) {
      // This case should ideally be handled by ensuring screenshotDataUri is generated client-side before calling this.
      return { isPaymentValid: false, message: "Screenshot data URI is missing for AI verification." };
    }

    try {
      const aiInput: VerifyPaymentFromScreenshotInput = {
        paymentScreenshotDataUri: paymentProof.screenshotDataUri!, 
        expectedPaymentAmount: expectedAmount,
        transactionNumber: paymentProof.transactionId, // Optional transaction ID from screenshot
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
  } else if (paymentProof.paymentType === "link") { // Legacy example
    if (paymentProof.pdfLink) {
      if (!paymentProof.pdfLink.startsWith('http://') && !paymentProof.pdfLink.startsWith('https://')) {
         return { isPaymentValid: false, message: "Invalid PDF link format." };
      }
      return { isPaymentValid: true, message: "PDF link submitted. (Basic Verification)" };
    }
    return { isPaymentValid: false, message: "PDF link is missing." };
  } else if (paymentProof.paymentType === "transaction_id_legacy") { // Legacy example
    if (paymentProof.transactionId && paymentProof.transactionId.length >= 5) {
      return { isPaymentValid: true, transactionNumber: paymentProof.transactionId, message: "Transaction ID submitted. (Basic Verification)" };
    }
    return { isPaymentValid: false, message: "Transaction ID is missing or too short." };
  }


  return { isPaymentValid: false, message: "Invalid or unsupported payment proof type." };
}

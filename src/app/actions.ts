
"use server";

import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput, VerifyPaymentFromScreenshotOutput } from '@/ai/flows/payment-verification';
import type { PaymentProofData } from '@/types';
import { HAFSA_PAYMENT_METHODS } from '@/lib/constants';

interface VerificationInput {
  paymentProof: PaymentProofData;
  expectedAmount: number;
}

interface VerificationResult extends Partial<VerifyPaymentFromScreenshotOutput> {
  isPaymentValid: boolean; // This should align with AI's output if AI is used
  message: string;
}

export async function handlePaymentVerification(input: VerificationInput): Promise<VerificationResult> {
  const { paymentProof, expectedAmount } = input;

  if (!paymentProof.proofSubmissionType) {
    return { isPaymentValid: false, message: "Proof submission type is missing." };
  }

  const selectedBankDetails = HAFSA_PAYMENT_METHODS.find(m => m.value === paymentProof.paymentType);

  switch (paymentProof.proofSubmissionType) {
    case 'transactionId':
      if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
        // Basic validation for transaction ID, assumes ID is correct for submission purposes.
        // Actual verification would happen backend/manually.
        return {
          isPaymentValid: true, // Submitted, pending actual verification
          transactionNumber: paymentProof.transactionId,
          message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType}. Verification pending.`
        };
      }
      return {
          isPaymentValid: false,
          transactionNumber: paymentProof.transactionId,
          reason: `Transaction ID/Reference is required and must be at least 3 characters for ${paymentProof.paymentType}.`,
          message: `Transaction ID/Reference is required and must be at least 3 characters for ${paymentProof.paymentType}.`
      };

    case 'screenshot':
      if (!paymentProof.screenshotDataUri) {
        return { isPaymentValid: false, reason: "Screenshot data URI is missing for AI verification.", message: "Screenshot data URI is missing for AI verification." };
      }
      try {
        const aiInput: VerifyPaymentFromScreenshotInput = {
          paymentScreenshotDataUri: paymentProof.screenshotDataUri!,
          expectedPaymentAmount: expectedAmount,
          transactionNumber: paymentProof.transactionId, // Can still pass if user also entered it
          expectedAccountName: selectedBankDetails?.accountName,
          expectedAccountNumber: selectedBankDetails?.accountNumber,
        };

        const aiResult = await verifyPaymentFromScreenshot(aiInput);

        if (aiResult.isPaymentValid) {
          // isPaymentValid from AI now means amount AND account match
           return {
            ...aiResult,
            isPaymentValid: true,
            message: "Payment verified successfully by AI from screenshot (amount and account match)."
          };
        } else {
          // Construct a more detailed message if AI validation fails
          let failureMessage = "AI verification from screenshot failed.";
          if (aiResult.reason) {
            failureMessage = aiResult.reason;
          } else if (aiResult.extractedPaymentAmount !== undefined && aiResult.extractedPaymentAmount !== expectedAmount) {
            failureMessage = `Extracted amount ${aiResult.extractedPaymentAmount} does not match expected amount ${expectedAmount}.`;
            if (aiResult.isAccountMatch === false) {
              failureMessage += " Additionally, account details do not match.";
            }
          } else if (aiResult.isAccountMatch === false) {
            failureMessage = "Account details extracted from screenshot do not match expected bank details.";
          }

          return {
            ...aiResult,
            isPaymentValid: false,
            reason: aiResult.reason || failureMessage,
            message: failureMessage
          };
        }
      } catch (error) {
        console.error("AI Payment Screenshot Verification Error:", error);
        return { isPaymentValid: false, reason: "An error occurred during AI screenshot verification.", message: "An error occurred during AI screenshot verification." };
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
          reason: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType}.`,
          message: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType}.`
      };

    default:
      return { isPaymentValid: false, reason: "Invalid proof submission type.", message: "Invalid proof submission type." };
  }
}

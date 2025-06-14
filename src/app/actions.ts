
"use server";

import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput, VerifyPaymentFromScreenshotOutput } from '@/ai/flows/payment-verification';
import type { PaymentProofData } from '@/types';
import { HAFSA_PAYMENT_METHODS } from '@/lib/constants';

interface VerificationInput {
  paymentProof: PaymentProofData;
  expectedAmount: number;
}

interface VerificationResult extends Partial<VerifyPaymentFromScreenshotOutput> {
  isPaymentValid: boolean; 
  message: string;
}

export async function handlePaymentVerification(input: VerificationInput): Promise<VerificationResult> {
  try {
    if (!input || !input.paymentProof || !input.expectedAmount) {
      console.error("handlePaymentVerification called with invalid input:", input);
      return { 
        isPaymentValid: false, 
        message: "Invalid input received for payment verification.",
        reason: "Incomplete input data."
      };
    }

    const { paymentProof, expectedAmount } = input;

    if (!paymentProof.proofSubmissionType) {
      return { 
        isPaymentValid: false, 
        message: "Proof submission type is missing.",
        reason: "Proof submission type not specified." 
      };
    }

    const selectedBankDetails = HAFSA_PAYMENT_METHODS.find(m => m.value === paymentProof.paymentType);

    switch (paymentProof.proofSubmissionType) {
      case 'transactionId':
        if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
          return {
            isPaymentValid: true, 
            transactionNumber: paymentProof.transactionId,
            message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType || 'selected method'}. Verification pending.`
          };
        }
        return {
            isPaymentValid: false,
            transactionNumber: paymentProof.transactionId,
            reason: `Transaction ID/Reference is required and must be at least 3 characters for ${paymentProof.paymentType || 'selected method'}.`,
            message: `Transaction ID/Reference is required and must be at least 3 characters for ${paymentProof.paymentType || 'selected method'}.`
        };

      case 'screenshot':
        if (!paymentProof.screenshotDataUri) {
          return { 
            isPaymentValid: false, 
            reason: "Screenshot data URI is missing for AI verification.", 
            message: "Screenshot data URI is missing for AI verification." 
          };
        }
        try {
          const aiInput: VerifyPaymentFromScreenshotInput = {
            paymentScreenshotDataUri: paymentProof.screenshotDataUri!,
            expectedPaymentAmount: expectedAmount,
            transactionNumber: paymentProof.transactionId, 
            expectedAccountName: selectedBankDetails?.accountName,
            expectedAccountNumber: selectedBankDetails?.accountNumber,
          };

          const aiResult = await verifyPaymentFromScreenshot(aiInput);

          if (aiResult.isPaymentValid) {
            return {
              ...aiResult,
              isPaymentValid: true,
              message: "Payment verified successfully by AI from screenshot (amount and account match)."
            };
          } else {
            let specificReason = aiResult.reason;
            if (!specificReason) {
              const amountExtracted = aiResult.extractedPaymentAmount !== undefined;
              const amountMatchesExpected = amountExtracted && aiResult.extractedPaymentAmount === expectedAmount;
              const amountMismatched = amountExtracted && !amountMatchesExpected;
              
              const accountMatchKnown = aiResult.isAccountMatch !== undefined;
              const accountMatches = accountMatchKnown && aiResult.isAccountMatch === true;
              const accountMismatched = accountMatchKnown && aiResult.isAccountMatch === false;

              if (amountMismatched && accountMismatched) {
                specificReason = `Amount mismatch (expected ${expectedAmount}, got ${aiResult.extractedPaymentAmount}) AND account details do not match.`;
              } else if (amountMismatched) {
                specificReason = `Amount mismatch: expected ${expectedAmount}, but extracted ${aiResult.extractedPaymentAmount}. Account details: ${accountMatchKnown ? (accountMatches ? 'match' : 'mismatch') : 'unknown'}.`;
              } else if (accountMismatched) {
                specificReason = `Account details do not match. Amount: ${amountExtracted ? (amountMatchesExpected ? 'matches' : `mismatch (expected ${expectedAmount}, got ${aiResult.extractedPaymentAmount})`) : 'not extracted'}.`;
              } else if (!amountExtracted && !accountMatchKnown) {
                specificReason = "AI could not extract payment amount or account details from the screenshot. Please ensure it's clear and shows all required information.";
              } else if (amountMatchesExpected && accountMatchKnown && !accountMatches) {
                  specificReason = "Account details mismatch, although amount appears correct. Please verify recipient details in screenshot.";
              } else if (!amountMatchesExpected && accountMatchKnown && accountMatches) {
                  specificReason = `Amount mismatch (expected ${expectedAmount}, got ${aiResult.extractedPaymentAmount || 'not found'}), although account details appear correct. Please verify payment amount in screenshot.`;
              }
              else {
                specificReason = "AI verification failed. Please check the screenshot clarity and ensure all required payment details (amount, recipient account) are clearly visible.";
              }
            }
            return {
              ...aiResult,
              isPaymentValid: false,
              reason: specificReason, 
              message: specificReason 
            };
          }
        } catch (aiError: any) {
          console.error("AI Payment Screenshot Verification Error in action:", aiError);
          let errorMessage = "An error occurred during AI screenshot verification.";
          if (aiError instanceof Error) {
            errorMessage = aiError.message;
          } else if (typeof aiError === 'string') {
            errorMessage = aiError;
          }
          return { 
            isPaymentValid: false, 
            reason: `AI service error: ${errorMessage}. Please try again or use a different verification method.`, 
            message: `AI service error: ${errorMessage}. Please try again or use a different verification method.`
          };
        }

      case 'pdfLink':
        if (paymentProof.pdfLink && (paymentProof.pdfLink.startsWith('http://') || paymentProof.pdfLink.startsWith('https://'))) {
          return {
            isPaymentValid: true, 
            message: `Payment proof submitted via PDF link: ${paymentProof.pdfLink} for ${paymentProof.paymentType || 'selected method'}. Verification pending.`
          };
        }
        return {
            isPaymentValid: false,
            reason: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType || 'selected method'}.`,
            message: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType || 'selected method'}.`
        };

      default:
        return { 
          isPaymentValid: false, 
          reason: `Invalid proof submission type: ${paymentProof.proofSubmissionType}`, 
          message: `Invalid proof submission type: ${paymentProof.proofSubmissionType}` 
        };
    }
  } catch (error: any) {
    console.error("Unhandled error in handlePaymentVerification:", error);
    let specificMessage = "An unexpected server error occurred during payment verification.";
    if (error instanceof Error) {
        specificMessage = error.message;
    } else if (typeof error === 'string') {
        specificMessage = error;
    }
    return { 
      isPaymentValid: false, 
      message: specificMessage,
      reason: `Server-side error: ${specificMessage}` 
    };
  }
}

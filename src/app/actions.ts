
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
  const { paymentProof, expectedAmount } = input;

  if (!paymentProof.proofSubmissionType) {
    return { isPaymentValid: false, message: "Proof submission type is missing." };
  }

  const selectedBankDetails = HAFSA_PAYMENT_METHODS.find(m => m.value === paymentProof.paymentType);

  switch (paymentProof.proofSubmissionType) {
    case 'transactionId':
      if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
        return {
          isPaymentValid: true, 
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
          // AI indicates payment is not valid
          let specificReason = aiResult.reason;

          if (!specificReason) { // If AI didn't provide a specific reason, try to build one
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
                // This case should ideally be covered by aiResult.reason if AI is thorough
                specificReason = "Account details mismatch, although amount appears correct. Please verify recipient details in screenshot.";
            } else if (!amountMatchesExpected && accountMatchKnown && accountMatches) {
                 // This case should ideally be covered by aiResult.reason
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
      } catch (error) {
        console.error("AI Payment Screenshot Verification Error:", error);
        return { isPaymentValid: false, reason: "An error occurred during AI screenshot verification. Please try again or use a different verification method.", message: "An error occurred during AI screenshot verification. Please try again or use a different verification method." };
      }

    case 'pdfLink':
      if (paymentProof.pdfLink && (paymentProof.pdfLink.startsWith('http://') || paymentProof.pdfLink.startsWith('https://'))) {
        return {
          isPaymentValid: true, 
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

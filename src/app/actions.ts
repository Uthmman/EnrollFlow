
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

async function fetchDocumentAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'EnrollFlow/1.0' } }); // Added User-Agent
    if (!response.ok) {
      console.error(`Failed to fetch document from ${url}. Status: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    
    // Determine MIME type - simplistic check, assumes PDF if not an image
    // A more robust check might inspect response.headers.get('Content-Type')
    // For now, Genkit's `media` helper relies on the Data URI's MIME type.
    // We'll assume PDF for URLs unless it's explicitly an image.
    // For this use case, we expect PDFs from URLs.
    const mimeType = response.headers.get('Content-Type')?.startsWith('image/') 
        ? response.headers.get('Content-Type')! 
        : 'application/pdf';

    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error fetching or converting document from ${url}:`, error);
    return null;
  }
}


export async function handlePaymentVerification(input: VerificationInput): Promise<VerificationResult> {
  try {
    if (!input || !input.paymentProof || !input.expectedAmount === undefined) { // check expectedAmount for undefined too
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
    let documentDataUriForAI: string | undefined;
    let requiresAiVerification = false;


    switch (paymentProof.proofSubmissionType) {
      case 'transactionId':
        if (paymentProof.paymentType === 'cbe' && paymentProof.transactionId && paymentProof.transactionId.length >= 12) {
          const first12Chars = paymentProof.transactionId.substring(0, 12);
          const cbeUrl = `https://apps.cbe.com.et:100/?id=${first12Chars}80423395`;
          
          const fetchedDataUri = await fetchDocumentAsDataUri(cbeUrl);
          if (fetchedDataUri) {
            documentDataUriForAI = fetchedDataUri;
            requiresAiVerification = true;
          } else {
            return {
              isPaymentValid: false,
              message: `Could not retrieve payment details from CBE for Transaction ID ${paymentProof.transactionId}. Please try another method or ensure ID is correct.`,
              reason: `Failed to fetch or process document from CBE URL for transaction ID.`
            };
          }
        } else if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
          // Non-CBE transaction ID or CBE TxID < 12 chars, but still valid format for manual check
          return {
            isPaymentValid: true, // Pending manual verification
            transactionNumber: paymentProof.transactionId,
            message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType || 'selected method'}. Verification pending.`
          };
        } else {
           return {
            isPaymentValid: false,
            transactionNumber: paymentProof.transactionId,
            reason: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} must be at least 3 characters (12 for CBE automated check).`,
            message: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} must be at least 3 characters (12 for CBE automated check).`
           };
        }
        break;

      case 'screenshot':
        if (!paymentProof.screenshotDataUri) {
          return { 
            isPaymentValid: false, 
            reason: "Screenshot data URI is missing for AI verification.", 
            message: "Screenshot data URI is missing for AI verification." 
          };
        }
        documentDataUriForAI = paymentProof.screenshotDataUri;
        requiresAiVerification = true;
        break;

      case 'pdfLink':
        if (paymentProof.pdfLink && (paymentProof.pdfLink.startsWith('http://') || paymentProof.pdfLink.startsWith('https://'))) {
            const fetchedDataUri = await fetchDocumentAsDataUri(paymentProof.pdfLink);
            if (fetchedDataUri) {
                documentDataUriForAI = fetchedDataUri;
                requiresAiVerification = true;
            } else {
                 return {
                    isPaymentValid: false,
                    message: `Could not retrieve or process the PDF from the link: ${paymentProof.pdfLink}. Please ensure the link is correct and publicly accessible.`,
                    reason: `Failed to fetch or process document from PDF link.`
                 };
            }
        } else {
            return {
                isPaymentValid: false,
                reason: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType || 'selected method'}.`,
                message: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType || 'selected method'}.`
            };
        }
        break;

      default:
        const exhaustiveCheck: never = paymentProof.proofSubmissionType; 
        return { 
          isPaymentValid: false, 
          reason: `Invalid proof submission type: ${exhaustiveCheck}`, 
          message: `Invalid proof submission type: ${exhaustiveCheck}` 
        };
    }

    if (requiresAiVerification && documentDataUriForAI) {
      try {
        const aiInput: VerifyPaymentFromScreenshotInput = {
          paymentScreenshotDataUri: documentDataUriForAI,
          expectedPaymentAmount: expectedAmount,
          transactionNumber: paymentProof.transactionId, 
          expectedAccountName: selectedBankDetails?.accountName,
          expectedAccountNumber: selectedBankDetails?.accountNumber,
        };

        const aiResult = await verifyPaymentFromScreenshot(aiInput);

        if (aiResult.isPaymentValid) {
          const successResult: VerificationResult = {
            isPaymentValid: true,
            message: `Payment verified successfully by AI from ${paymentProof.proofSubmissionType} (amount and account match).`,
            extractedPaymentAmount: aiResult.extractedPaymentAmount,
            transactionNumber: aiResult.transactionNumber || paymentProof.transactionId, // Fallback to input TxID if AI doesn't extract one
            isAccountMatch: aiResult.isAccountMatch,
            extractedAccountName: aiResult.extractedAccountName,
            extractedAccountNumber: aiResult.extractedAccountNumber,
            reason: aiResult.reason, 
          };
          return successResult;
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
              specificReason = "AI could not extract payment amount or account details from the document. Please ensure it's clear and shows all required information.";
            } else if (amountMatchesExpected && accountMatchKnown && !accountMatches) {
                specificReason = "Account details mismatch, although amount appears correct. Please verify recipient details in the document.";
            } else if (!amountMatchesExpected && accountMatchKnown && accountMatches) {
                specificReason = `Amount mismatch (expected ${expectedAmount}, got ${aiResult.extractedPaymentAmount || 'not found'}), although account details appear correct. Please verify payment amount in the document.`;
            }
            else {
              specificReason = "AI verification failed. Please check the document clarity and ensure all required payment details (amount, recipient account) are clearly visible.";
            }
          }
          const failureResult: VerificationResult = {
              isPaymentValid: false,
              message: specificReason || "AI verification failed.",
              reason: specificReason || "AI verification failed.",
              extractedPaymentAmount: aiResult.extractedPaymentAmount,
              transactionNumber: aiResult.transactionNumber || paymentProof.transactionId,
              isAccountMatch: aiResult.isAccountMatch,
              extractedAccountName: aiResult.extractedAccountName,
              extractedAccountNumber: aiResult.extractedAccountNumber,
          };
          return failureResult;
        }
      } catch (aiError: any) {
        console.error("AI Payment Document Verification Error in action:", aiError);
        let errorMessage = "An error occurred during AI document verification.";
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
    } else if (!requiresAiVerification && paymentProof.proofSubmissionType === 'transactionId') {
        // This case should have been handled inside the 'transactionId' switch block already
        // for non-CBE or failed CBE fetch but valid TxID format.
        // This is a safety net / redundant path if logic above changes.
        if (paymentProof.transactionId && paymentProof.transactionId.length >=3) {
             return {
                isPaymentValid: true, // Pending manual verification
                transactionNumber: paymentProof.transactionId,
                message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType || 'selected method'}. Verification pending.`
             };
        }
         return {
            isPaymentValid: false,
            transactionNumber: paymentProof.transactionId,
            reason: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} is invalid.`,
            message: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} is invalid.`
        };

    }
    
    // Fallback if no path explicitly returned a result (should be rare with current logic)
    return {
        isPaymentValid: false,
        message: "Unable to process payment proof. Please check your submission.",
        reason: "Incomplete or unsupported payment proof submission.",
    };

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

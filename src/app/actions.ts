
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
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });

    if (!response.ok) {
      let errorBodyText = 'Could not read error body from response.';
      try {
        // Clone the response before attempting to read its body, as body can only be consumed once.
        const clonedResponse = response.clone();
        errorBodyText = await clonedResponse.text();
      } catch (e) {
        console.warn(`Error trying to read body of failed response from ${url}:`, e);
      }
      console.error(
        `Failed to fetch document from ${url}. Status: ${response.status} ${response.statusText}. ` +
        `Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}. ` +
        `Response Body Snippet: ${errorBodyText.substring(0, 500)}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    let mimeType = response.headers.get('Content-Type');

    if (!mimeType) {
        console.warn(`Content-Type header missing for ${url}. Attempting to infer.`);
        if (url.toLowerCase().endsWith('.pdf')) {
            mimeType = 'application/pdf';
        } else if (url.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null) {
            const ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
            mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        } else {
            mimeType = 'application/octet-stream';
            console.warn(`Could not infer MIME type for ${url}, using application/octet-stream. AI processing might be affected.`);
        }
    } else if (!mimeType.startsWith('application/pdf') && !mimeType.startsWith('image/')) {
        console.warn(`Unexpected Content-Type '${mimeType}' for ${url}. AI processing might be affected if not a PDF or image.`);
    }


    return `data:${mimeType};base64,${base64String}`;
  } catch (error: any) {
    console.error(`Error fetching or converting document from ${url}. Message: ${error.message}`, error.stack ? `Stack: ${error.stack}` : '', error.cause ? `Cause: ${error.cause}` : '');
    return null;
  }
}


export async function handlePaymentVerification(input: VerificationInput): Promise<VerificationResult> {
  try {
    if (!input || !input.paymentProof || input.expectedAmount === undefined) {
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
    let documentDataUriForAI: string | undefined | null;
    let requiresAiVerification = false;


    switch (paymentProof.proofSubmissionType) {
      case 'transactionId':
        if (paymentProof.paymentType === 'cbe' && paymentProof.transactionId && paymentProof.transactionId.length >= 12) {
          const first12Chars = paymentProof.transactionId.substring(0, 12);
          const cbeUrl = `https://apps.cbe.com.et:100/?id=${first12Chars}80423395`;

          documentDataUriForAI = await fetchDocumentAsDataUri(cbeUrl);
          if (documentDataUriForAI) {
            requiresAiVerification = true;
          } else {
            console.error(`Failed to fetch or process document from CBE URL: ${cbeUrl}. fetchDocumentAsDataUri returned null.`); // Explicit log
            return {
              isPaymentValid: false,
              message: `System could not retrieve payment details from CBE for Transaction ID ${paymentProof.transactionId} using the automated link. This often happens due to bank system restrictions on automated access. Please try uploading a screenshot of your payment receipt instead, or verify the Transaction ID and try again later.`,
              reason: `Automated fetch from CBE URL (${cbeUrl}) failed.`
            };
          }
        } else if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
           return {
            isPaymentValid: true,
            transactionNumber: paymentProof.transactionId,
            message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType || 'selected method'}. Verification pending human review.`
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
            documentDataUriForAI = await fetchDocumentAsDataUri(paymentProof.pdfLink);
            if (documentDataUriForAI) {
                requiresAiVerification = true;
            } else {
                 return {
                    isPaymentValid: false,
                    message: `Could not retrieve or process the document from the link: ${paymentProof.pdfLink}. Please ensure the link is correct and publicly accessible. If the issue persists, try uploading a screenshot of the document instead.`,
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
        // This case should ideally not be reached if types are correct
        // const exhaustiveCheck: never = paymentProof.proofSubmissionType;
        return {
          isPaymentValid: false,
          reason: `Invalid proof submission type: ${paymentProof.proofSubmissionType}`,
          message: `Invalid proof submission type: ${paymentProof.proofSubmissionType}`
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
            transactionNumber: aiResult.transactionNumber || paymentProof.transactionId,
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
        console.error("AI Payment Document Verification Error in action:", aiError.message, aiError.stack ? `Stack: ${aiError.stack}` : '', aiError.cause ? `Cause: ${aiError.cause}` : '');
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
        if (paymentProof.transactionId && paymentProof.transactionId.length >=3) {
             return {
                isPaymentValid: true,
                transactionNumber: paymentProof.transactionId,
                message: `Payment proof submitted via Transaction ID: ${paymentProof.transactionId} for ${paymentProof.paymentType || 'selected method'}. Verification pending human review.`
             };
        }
         return {
            isPaymentValid: false,
            transactionNumber: paymentProof.transactionId,
            reason: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} is invalid.`,
            message: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} is invalid.`
        };

    } else if (requiresAiVerification && !documentDataUriForAI) {
        // This covers cases like failed CBE fetch or failed PDF link fetch where AI was intended.
        // The specific error message from the switch case would have already been returned.
        // This is a general fallback if, for some reason, those return paths were missed.
        return {
            isPaymentValid: false,
            message: "Document required for AI verification could not be obtained. Please check the provided link/ID or try uploading a screenshot.",
            reason: "Failed to obtain document for AI verification.",
        };
    }

    // Fallback for any unhandled scenarios
    return {
        isPaymentValid: false,
        message: "Unable to process payment proof. Please check your submission or try a different method.",
        reason: "Incomplete or unsupported payment proof submission.",
    };

  } catch (error: any) {
    console.error("Unhandled error in handlePaymentVerification:", error.message, error.stack ? `Stack: ${error.stack}` : '', error.cause ? `Cause: ${error.cause}` : '');
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

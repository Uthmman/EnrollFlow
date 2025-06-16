
"use server";

// Removed AI verification imports:
// import { verifyPaymentFromScreenshot, VerifyPaymentFromScreenshotInput, VerifyPaymentFromScreenshotOutput } from '@/ai/flows/payment-verification';
import type { PaymentProofData } from '@/types';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService'; // Import the service function

interface PreparedProofData extends PaymentProofData {
  // This interface will be used to return the proof data,
  // possibly with a fetched documentDataUri if applicable (e.g., for CBE).
  documentDataUriForStorage?: string | null; 
}

interface VerificationResult {
  // This result is simplified as verification is now manual.
  // It primarily confirms submission and provides the proof data.
  isSubmitted: boolean; // Indicates if the proof was processed for submission
  message: string;      // User-facing message
  reason?: string;     // Internal reason for issues, if any
  preparedProof: PreparedProofData | null;
  transactionNumber?: string; // Still useful to pass back
}


async function fetchDocumentAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });

    if (!response.ok) {
      let errorBodyText = 'Could not read error body from response.';
      try {
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
            console.warn(`Could not infer MIME type for ${url}, using application/octet-stream.`);
        }
    } else if (!mimeType.startsWith('application/pdf') && !mimeType.startsWith('image/')) {
        console.warn(`Fetched content from ${url} with Content-Type '${mimeType}'.`);
    }

    return `data:${mimeType};base64,${base64String}`;
  } catch (error: any) {
    console.error(`Error fetching or converting document from ${url}. Message: ${error.message}`, error.stack ? `Stack: ${error.stack}` : '', error.cause ? `Cause: ${error.cause}` : '');
    return null;
  }
}

function getMimeTypeFromDataUri(dataUri: string): string | null {
    const match = dataUri.match(/^data:([^;]+);base64,/);
    return match ? match[1] : null;
}

// Renamed and repurposed: This function now prepares the proof for storage,
// fetches external documents if needed (like CBE), but does not do AI verification.
export async function preparePaymentProofForStorage(input: { paymentProof: PaymentProofData }): Promise<VerificationResult> {
  try {
    if (!input || !input.paymentProof) {
      console.error("preparePaymentProofForStorage called with invalid input:", input);
      return {
        isSubmitted: false,
        message: "Invalid input received for payment proof preparation.",
        reason: "Incomplete input data.",
        preparedProof: null,
      };
    }

    const { paymentProof } = input;

    if (!paymentProof.proofSubmissionType) {
      return {
        isSubmitted: false,
        message: "Proof submission type is missing.",
        reason: "Proof submission type not specified.",
        preparedProof: paymentProof,
      };
    }
    
    let documentDataUriForStorage: string | undefined | null = paymentProof.screenshotDataUri; // Default to screenshot if provided

    switch (paymentProof.proofSubmissionType) {
      case 'transactionId':
        if (paymentProof.paymentType === 'cbe' && paymentProof.transactionId && paymentProof.transactionId.length >= 12) {
          const first12Chars = paymentProof.transactionId.substring(0, 12);
          const cbeUrl = `https://apps.cbe.com.et:100/?id=${first12Chars}80423395`;

          documentDataUriForStorage = await fetchDocumentAsDataUri(cbeUrl);

          if (documentDataUriForStorage) {
            const documentMimeType = getMimeTypeFromDataUri(documentDataUriForStorage);
            if (documentMimeType && (documentMimeType.startsWith('application/pdf') || documentMimeType.startsWith('image/'))) {
                // Successfully fetched and it's a usable document type
            } else {
                console.warn(`CBE URL (${cbeUrl}) returned content of type '${documentMimeType}', which might not be ideal for storage/review. Transaction ID: ${paymentProof.transactionId}`);
                // Still store it, admin can decide.
            }
          } else {
            console.error(`Failed to fetch or process document from CBE URL: ${cbeUrl}. fetchDocumentAsDataUri returned null. Transaction ID: ${paymentProof.transactionId}`);
            // For CBE, if fetch fails, we might not want to proceed or store just the ID.
            // Let's return a failure here, or a specific status.
             return {
              isSubmitted: false,
              message: `System could not retrieve payment details from CBE for Transaction ID ${paymentProof.transactionId}. Please verify the ID or upload a screenshot.`,
              reason: `Automated fetch from CBE URL (${cbeUrl}) failed.`,
              preparedProof: {...paymentProof, documentDataUriForStorage: null },
              transactionNumber: paymentProof.transactionId,
            };
          }
        } else if (paymentProof.transactionId && paymentProof.transactionId.length >= 3) {
           // Non-CBE or short CBE ID, no document to fetch. Just the ID is the proof.
           documentDataUriForStorage = undefined; // No separate document URI
        } else {
           return {
            isSubmitted: false,
            message: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} must be at least 3 characters (12 for CBE automated check).`,
            reason: `Transaction ID/Reference for ${paymentProof.paymentType || 'selected method'} is invalid.`,
            preparedProof: paymentProof,
            transactionNumber: paymentProof.transactionId,
           };
        }
        break;

      case 'screenshot':
        if (!paymentProof.screenshotDataUri) {
          return {
            isSubmitted: false,
            message: "Screenshot data URI is missing. Please upload the screenshot again.",
            reason: "Screenshot data URI missing.",
            preparedProof: paymentProof,
          };
        }
        documentDataUriForStorage = paymentProof.screenshotDataUri;
        const screenshotMimeType = getMimeTypeFromDataUri(documentDataUriForStorage);
        if (!screenshotMimeType || (!screenshotMimeType.startsWith('image/') && !screenshotMimeType.startsWith('application/pdf'))) {
             return {
                isSubmitted: false,
                message: `Uploaded file type ('${screenshotMimeType || 'unknown'}') is not a supported image or PDF. Please upload a clear image (PNG, JPG) or PDF of your receipt.`,
                reason: `Unsupported file type for screenshot: ${screenshotMimeType || 'unknown'}`,
                preparedProof: paymentProof,
            };
        }
        break;

      case 'pdfLink':
        if (paymentProof.pdfLink && (paymentProof.pdfLink.startsWith('http://') || paymentProof.pdfLink.startsWith('https://'))) {
            // For simplicity now, we will store the link itself.
            // If fetching the content was desired, similar logic to CBE would apply:
            // documentDataUriForStorage = await fetchDocumentAsDataUri(paymentProof.pdfLink);
            // And then check mimeType etc.
            // For now, no separate documentDataUriForStorage if it's just a link.
            documentDataUriForStorage = undefined; 
        } else {
            return {
                isSubmitted: false,
                message: `A valid PDF link (starting with http:// or https://) is required for ${paymentProof.paymentType || 'selected method'}.`,
                reason: `Invalid PDF link provided.`,
                preparedProof: paymentProof,
            };
        }
        break;

      default:
        return {
          isSubmitted: false,
          message: `Invalid proof submission type: ${paymentProof.proofSubmissionType}`,
          reason: `Invalid proof submission type: ${paymentProof.proofSubmissionType}`,
          preparedProof: paymentProof,
        };
    }
    
    // If we reached here, the input was valid enough to be prepared.
    const finalPreparedProof: PreparedProofData = {
        ...paymentProof,
        documentDataUriForStorage: documentDataUriForStorage, // This will hold the CBE fetched doc or the screenshot URI
    };

    return {
        isSubmitted: true,
        message: "Payment proof details prepared for submission.",
        preparedProof: finalPreparedProof,
        transactionNumber: paymentProof.transactionId,
    };

  } catch (error: any) {
    console.error("Unhandled error in preparePaymentProofForStorage:", error.message, error.stack ? `Stack: ${error.stack}` : '', error.cause ? `Cause: ${error.cause}` : '');
    let specificMessage = "An unexpected server error occurred during payment proof preparation.";
    if (error instanceof Error) {
        specificMessage = error.message;
    } else if (typeof error === 'string') {
        specificMessage = error;
    }
    return {
      isSubmitted: false,
      message: specificMessage,
      reason: `Server-side error: ${specificMessage}`,
      preparedProof: input?.paymentProof || null, // Return original proof if available
    };
  }
}



// This file uses server-side code.
'use server';

/**
 * @fileOverview Payment Verification flow. Verifies payment information from a screenshot of a payment receipt.
 *
 * - verifyPaymentFromScreenshot - A function that handles the payment verification process.
 * - VerifyPaymentFromScreenshotInput - The input type for the verifyPaymentFromScreenshot function.
 * - VerifyPaymentFromScreenshotOutput - The return type for the verifyPaymentFromScreenshot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyPaymentFromScreenshotInputSchema = z.object({
  paymentScreenshotDataUri: z
    .string()
    .describe(
      "A screenshot of the payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedPaymentAmount: z.number().describe('The expected payment amount.'),
  transactionNumber: z.string().optional().describe('The transaction number, if available.'),
  expectedAccountName: z.string().optional().describe('The expected recipient account name for this payment.'),
  expectedAccountNumber: z.string().optional().describe('The expected recipient account number for this payment.'),
});

export type VerifyPaymentFromScreenshotInput = z.infer<
  typeof VerifyPaymentFromScreenshotInputSchema
>;

const VerifyPaymentFromScreenshotOutputSchema = z.object({
  isPaymentValid: z
    .boolean()
    .describe('Whether the payment is valid or not. True if amount and recipient account details match expected values.'),
  extractedPaymentAmount: z
    .number()
    .optional()
    .describe('The payment amount extracted from the screenshot.'),
  transactionNumber: z
    .string()
    .optional()
    .describe('The transaction number extracted from the screenshot.'),
  isAccountMatch: z
    .boolean()
    .optional()
    .describe('Whether the extracted recipient account name OR number matches the expected ones.'),
  extractedAccountName: z
    .string()
    .optional()
    .describe('The recipient account name extracted from the screenshot (if found).'),
  extractedAccountNumber: z
    .string()
    .optional()
    .describe('The recipient account number extracted from the screenshot (if found).'),
  reason: z
    .string()
    .optional()
    .describe('The reason for invalid payment, if any (e.g., "Amount mismatch," "Account details mismatch," "Information unclear in screenshot").'),
});

export type VerifyPaymentFromScreenshotOutput = z.infer<
  typeof VerifyPaymentFromScreenshotOutputSchema
>;

export async function verifyPaymentFromScreenshot(
  input: VerifyPaymentFromScreenshotInput
): Promise<VerifyPaymentFromScreenshotOutput> {
  return verifyPaymentFromScreenshotFlow(input);
}

const verifyPaymentFromScreenshotPrompt = ai.definePrompt({
  name: 'verifyPaymentFromScreenshotPrompt',
  input: {schema: VerifyPaymentFromScreenshotInputSchema},
  output: {schema: VerifyPaymentFromScreenshotOutputSchema},
  prompt: `You are an expert payment verification agent. Your goal is to verify the payment information from a screenshot of a payment receipt.

  Here is the screenshot: {{media url=paymentScreenshotDataUri}}

  The expected payment amount is: {{{expectedPaymentAmount}}}
  The transaction number, if available, is: {{{transactionNumber}}}
  The expected recipient account name for this payment is: {{{expectedAccountName}}}
  The expected recipient account number for this payment is: {{{expectedAccountNumber}}}

  Analyze the screenshot and extract the payment amount, transaction number, and the recipient account details (name and/or number) to whom the payment was made.
  Determine if the payment is valid. A payment is valid if:
  1. The extracted payment amount from the screenshot matches the {{{expectedPaymentAmount}}}.
  2. The recipient account details (name or number) extracted from the screenshot match EITHER the {{{expectedAccountName}}} OR the {{{expectedAccountNumber}}}. It's a match if at least one of these (name or number) corresponds to the expected values.
  If a transaction number is provided in the input, try to extract it from the screenshot for cross-referencing, but its presence or absence in the screenshot does not solely determine payment validity if amount and account match.

  Set the following output fields:
  - isPaymentValid: true if both amount and recipient account details match the expected values, false otherwise.
  - extractedPaymentAmount: The payment amount extracted from the screenshot.
  - transactionNumber: The transaction number extracted from the screenshot (if found).
  - isAccountMatch: true if the extracted recipient account name OR number matches the expected ones, false otherwise.
  - extractedAccountName: The recipient account name extracted from the screenshot (if found).
  - extractedAccountNumber: The recipient account number extracted from the screenshot (if found).
  - reason: If isPaymentValid is false, provide a clear reason (e.g., "Amount mismatch," "Account details mismatch," "Amount and account details mismatch," "Information unclear in screenshot").

  Prioritize accuracy in extracting the amount and account details. If the information is ambiguous or unreadable in the screenshot, indicate this in the reason.
`,
});

const verifyPaymentFromScreenshotFlow = ai.defineFlow(
  {
    name: 'verifyPaymentFromScreenshotFlow',
    inputSchema: VerifyPaymentFromScreenshotInputSchema,
    outputSchema: VerifyPaymentFromScreenshotOutputSchema,
  },
  async (input): Promise<VerifyPaymentFromScreenshotOutput> => {
    const {output} = await verifyPaymentFromScreenshotPrompt(input);
    if (!output) {
        console.error("AI prompt 'verifyPaymentFromScreenshotPrompt' returned null or undefined output.", {input});
        return {
            isPaymentValid: false,
            reason: "AI model failed to produce an output. Please ensure the screenshot is clear and legible, then try again. If the issue persists, please use a different verification method.",
            // Optional fields will be undefined, which is valid for the schema.
        };
    }
    return output;
  }
);


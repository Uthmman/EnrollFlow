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
});

export type VerifyPaymentFromScreenshotInput = z.infer<
  typeof VerifyPaymentFromScreenshotInputSchema
>;

const VerifyPaymentFromScreenshotOutputSchema = z.object({
  isPaymentValid: z
    .boolean()
    .describe('Whether the payment is valid or not.'),
  extractedPaymentAmount: z
    .number()
    .optional()
    .describe('The payment amount extracted from the screenshot.'),
  transactionNumber: z
    .string()
    .optional()
    .describe('The transaction number extracted from the screenshot.'),
  reason: z
    .string()
    .optional()
    .describe('The reason for invalid payment, if any.'),
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

  Analyze the screenshot and extract the payment amount and transaction number.
  Determine if the payment is valid based on the extracted information and the expected payment amount and transaction number.
  If the payment is not valid, provide a reason.

  Ensure that the isPaymentValid field is set correctly, the extractedPaymentAmount field is set to the payment amount from the screenshot, and the transactionNumber field is set to the transaction number from the screenshot.
  If a transaction number is not provided in the input, try to extract it from the screenshot, but if not found, leave the transactionNumber field blank.
`,
});

const verifyPaymentFromScreenshotFlow = ai.defineFlow(
  {
    name: 'verifyPaymentFromScreenshotFlow',
    inputSchema: VerifyPaymentFromScreenshotInputSchema,
    outputSchema: VerifyPaymentFromScreenshotOutputSchema,
  },
  async input => {
    const {output} = await verifyPaymentFromScreenshotPrompt(input);
    return output!;
  }
);

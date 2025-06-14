
// This file is no longer used for UI text translation as per the new i18n strategy.
// It can be removed or repurposed if server-side translation of dynamic content (e.g., admin-entered data)
// is needed in the future.

// 'use server';
// /**
//  * @fileOverview A Genkit flow for translating text.
//  *
//  * - translateText - A function that handles text translation.
//  * - TranslateTextInput - The input type for the translateText function.
//  * - TranslateTextOutput - The return type for the translateText function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const TranslateTextInputSchema = z.object({
//   text: z.string().describe('The text to be translated.'),
//   targetLanguageCode: z.string().describe('The ISO 639-1 code of the language to translate to (e.g., "es" for Spanish, "am" for Amharic).'),
//   sourceLanguageCode: z.string().optional().describe('The ISO 639-1 code of the source language (e.g., "en" for English). If not provided, the model will attempt to auto-detect.'),
// });
// export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

// const TranslateTextOutputSchema = z.object({
//   translatedText: z.string().describe('The translated text.'),
// });
// export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

// export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
//   return translateTextFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'translateTextPrompt',
//   input: {schema: TranslateTextInputSchema},
//   output: {schema: TranslateTextOutputSchema},
//   prompt: `Translate the following text from {{#if sourceLanguageCode}}{{{sourceLanguageCode}}}{{else}}the auto-detected language{{/if}} to {{{targetLanguageCode}}}:

// Text:
// "{{{text}}}"

// Return only the translated text.`,
// });

// const translateTextFlow = ai.defineFlow(
//   {
//     name: 'translateTextFlow',
//     inputSchema: TranslateTextInputSchema,
//     outputSchema: TranslateTextOutputSchema,
//   },
//   async (input) => {
//     const {output} = await prompt(input);
//     if (!output) {
//       console.error("AI prompt 'translateTextPrompt' returned null or undefined output.", {input});
//       // Fallback to original text if translation fails
//       return { translatedText: input.text };
//     }
//     return output;
//   }
// );

export {}; // Add an empty export to make this a module if all content is commented out

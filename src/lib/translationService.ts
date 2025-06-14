
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text-flow';

const translationCache = new Map<string, string>();

/**
 * Translates text to the target language, using a cache to store results.
 * @param text The text to translate.
 * @param targetLanguageCode The ISO 639-1 code for the target language (e.g., "am", "ar").
 * @param sourceLanguageCode The ISO 639-1 code for the source language (e.g., "en"). Defaults to 'en'.
 * @returns The translated text, or the original text if translation fails.
 */
export async function getTranslatedText(
  text: string,
  targetLanguageCode: string,
  sourceLanguageCode: string = 'en'
): Promise<string> {
  if (!text || !targetLanguageCode) {
    return text; // Return original text if inputs are invalid
  }

  if (targetLanguageCode === sourceLanguageCode) {
    return text; // No translation needed
  }

  const cacheKey = `${sourceLanguageCode}_${targetLanguageCode}_${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const input: TranslateTextInput = {
      text,
      targetLanguageCode,
      sourceLanguageCode,
    };
    const result = await translateText(input);
    if (result && result.translatedText) {
      translationCache.set(cacheKey, result.translatedText);
      return result.translatedText;
    }
    // Fallback to original text if translation result is not as expected
    return text;
  } catch (error) {
    console.error('Error during text translation:', error);
    // Fallback to original text on error
    return text;
  }
}


import { locales, defaultLang, type LanguageCode } from '@/locales';

/**
 * Retrieves a translated string from the locale files.
 * @param key The key of the string to translate (e.g., "welcomeMessage").
 * @param lang The target language code (e.g., "am", "ar").
 * @param options Optional parameters for string interpolation.
 * @returns The translated string, or the English string if the key/language is not found, or the key itself as a last resort.
 */
export function getTranslatedText(
  key: string,
  lang: LanguageCode,
  options?: Record<string, string | number>
): string {
  let selectedLangStrings = locales[lang] || locales[defaultLang];
  
  // Handle nested keys for programs, e.g., "programs.daycare_morning.label"
  let text: string | undefined = key.split('.').reduce((obj: any, k: string) => obj && obj[k], selectedLangStrings);

  if (text === undefined && lang !== defaultLang) {
    // Fallback to default language if key not found in selected language
    selectedLangStrings = locales[defaultLang];
    text = key.split('.').reduce((obj: any, k: string) => obj && obj[k], selectedLangStrings);
  }
  
  if (text === undefined) {
    // Fallback to the key itself if not found in any language
    // console.warn(`Translation key "${key}" not found for language "${lang}" or default language.`);
    return key; 
  }

  if (options && typeof text === 'string') {
    return Object.entries(options).reduce((str, [optKey, optValue]) => {
      return str.replace(new RegExp(`{${optKey}}`, 'g'), String(optValue));
    }, text);
  }

  return text;
}


/**
 * Fetches all translations for a given language.
 * @param lang The target language code.
 * @returns An object containing all key-value pairs for the language.
 */
export function getTranslationsForLanguage(lang: LanguageCode): Record<string, string> {
    const languageStrings = locales[lang] || locales[defaultLang];
    
    // Flatten the nested structure for easier use in components
    // This is a simple flatten, might need more robust for deeper nesting
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {} as Record<string, string>);
    };

    return flattenObject(languageStrings);
}

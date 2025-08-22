import { en } from './en';
import { es } from './es';

export const translations = {
  en,
  es
};

export const getTranslation = (key, language = 'en') => {
  const keys = key.split('.');
  let translation = translations[language];
  
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      // Fallback to English if translation not found
      translation = translations['en'];
      for (const fallbackKey of keys) {
        if (translation && translation[fallbackKey]) {
          translation = translation[fallbackKey];
        } else {
          return key; // Return the key if no translation found
        }
      }
      break;
    }
  }
  
  return typeof translation === 'string' ? translation : key;
};

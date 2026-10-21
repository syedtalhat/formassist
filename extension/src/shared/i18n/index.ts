import { Language } from '../types';
import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';

export const translations = { en, hi, mr };

export function getTranslation(lang: Language = 'en') {
  return translations[lang] || translations.en;
}

export { en, hi, mr };

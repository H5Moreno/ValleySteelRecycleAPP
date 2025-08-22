import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    return getTranslation(key, language);
  };
  
  return { t, language };
};

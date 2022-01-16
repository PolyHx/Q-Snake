import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const debug = process.env.NODE_ENV === 'production' ? false : true;

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    debug,
    detection: {
      order: ['cookie'],
      cache: ['cookie'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

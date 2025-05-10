import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhTranslation from "./locales/zh.json";
import enTranslation from "./locales/en.json";

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: zhTranslation
      },
      en: {
        translation: enTranslation
      }
    },
    lng: "zh", // Default language is Chinese
    fallbackLng: "zh",
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./translations/en/translation.json";
import translationAR from "./translations/ar/translation.json";

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
};

const savedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.setAttribute(
  "dir",
  savedLanguage === "ar" ? "rtl" : "ltr"
);

export default i18n;

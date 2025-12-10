import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translations
import it from '../constants/locales/it.json';
import en from '../constants/locales/en.json';
import fr from '../constants/locales/fr.json';
import es from '../constants/locales/es.json';
import de from '../constants/locales/de.json';

const i18n = new I18n({
    it,
    en,
    fr,
    es,
    de,
});

// Set the locale once at the beginning of your app.
i18n.enableFallback = true;
i18n.defaultLocale = 'it';

// Helper function to get device language
export const getDeviceLanguage = () => {
    const locales = getLocales();
    return locales[0]?.languageCode ?? 'it';
};

export default i18n;

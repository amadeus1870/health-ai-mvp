import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { getDeviceLanguage } from '../config/i18n';

type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
    language: 'it',
    setLanguage: async () => { },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<string>('it');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user_language');
            if (savedLanguage) {
                setLanguageState(savedLanguage);
                i18n.locale = savedLanguage;
            } else {
                const deviceLang = getDeviceLanguage();
                // Check if device language is supported, otherwise fallback to 'it'
                const supportedLangs = ['it', 'en', 'fr', 'es', 'de'];
                const initialLang = supportedLangs.includes(deviceLang) ? deviceLang : 'it';

                setLanguageState(initialLang);
                i18n.locale = initialLang;
            }
        } catch (error) {
            console.error('Failed to load language', error);
        }
    };

    const setLanguage = async (lang: string) => {
        try {
            await AsyncStorage.setItem('user_language', lang);
            i18n.locale = lang;
            setLanguageState(lang);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

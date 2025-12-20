import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('investman-language');
        return saved || 'en';
    });

    useEffect(() => {
        localStorage.setItem('investman-language', language);
        document.documentElement.setAttribute('data-language', language);
        document.documentElement.style.fontFamily = language === 'th'
            ? "'Kanit', 'Inter', sans-serif"
            : "'Inter', sans-serif";
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'th' : 'en');
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

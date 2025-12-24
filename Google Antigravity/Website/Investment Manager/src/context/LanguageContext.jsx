/**
 * LanguageContext.jsx - Internationalization (i18n) System with Firestore Sync
 * 
 * Provides language switching between English and Thai.
 * Translations are defined in translations.js and accessed via the `t` object.
 * 
 * Features:
 * - Syncs language preference to Firestore when logged in
 * - Falls back to localStorage for guests
 * - Sets data-language attribute on <html> for font targeting
 * - Automatically switches font (Inter for EN, Kanit for TH)
 * 
 * Usage in components:
 *   const { language, toggleLanguage, t } = useLanguage();
 *   return <h1>{t.welcomeTitle}</h1>;
 * 
 * Adding new translations:
 *   1. Add key to both en and th objects in translations.js
 *   2. Use via t.yourNewKey in any component
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { translations } from '../translations';

// Create the context
const LanguageContext = createContext();

/**
 * Custom hook to access language state, toggle, and translations
 * Must be used within a LanguageProvider
 * 
 * @returns {{ language: 'en' | 'th', toggleLanguage: () => void, t: object }}
 */
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

/**
 * Language Provider Component
 * Wrap your app with this to enable i18n functionality
 */
export const LanguageProvider = ({ children }) => {
    const { user } = useAuth();

    // Initialize language from localStorage, default to English
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('investman-language');
        return saved || 'en';
    });

    // Track if we've loaded from Firestore
    const [hasLoadedFromFirestore, setHasLoadedFromFirestore] = useState(false);

    // Load language from Firestore when user logs in
    useEffect(() => {
        const loadLanguageFromFirestore = async () => {
            if (!user) {
                setHasLoadedFromFirestore(false);
                return;
            }

            try {
                const prefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
                const prefsDoc = await getDoc(prefsRef);

                if (prefsDoc.exists() && prefsDoc.data().language !== undefined) {
                    const firestoreLanguage = prefsDoc.data().language;
                    setLanguage(firestoreLanguage);
                    localStorage.setItem('investman-language', firestoreLanguage);
                }
                setHasLoadedFromFirestore(true);
            } catch (error) {
                console.error('Error loading language from Firestore:', error);
                setHasLoadedFromFirestore(true);
            }
        };

        loadLanguageFromFirestore();
    }, [user]);

    // Save language to Firestore when it changes (and user is logged in)
    const saveLanguageToFirestore = useCallback(async (lang) => {
        if (!user || !hasLoadedFromFirestore) return;

        try {
            const prefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
            await setDoc(prefsRef, { language: lang }, { merge: true });
        } catch (error) {
            console.error('Error saving language to Firestore:', error);
        }
    }, [user, hasLoadedFromFirestore]);

    // Effect: Persist language and apply font changes
    useEffect(() => {
        // Save to localStorage for next visit (always)
        localStorage.setItem('investman-language', language);

        // Set data-language attribute on <html> for CSS targeting
        document.documentElement.setAttribute('data-language', language);

        // Switch font - Thai uses Kanit font for better readability
        document.documentElement.style.fontFamily = language === 'th'
            ? "'Kanit', 'Inter', sans-serif"  // Thai: Kanit (with Inter fallback)
            : "'Inter', sans-serif";           // English: Inter

        // Save to Firestore if user is logged in
        saveLanguageToFirestore(language);
    }, [language, saveLanguageToFirestore]);

    // Toggle between English and Thai
    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'th' : 'en');
    };

    // Get the translations object for current language
    // This is what components use: t.keyName
    const t = translations[language];

    // Provide language state, toggle function, and translations
    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

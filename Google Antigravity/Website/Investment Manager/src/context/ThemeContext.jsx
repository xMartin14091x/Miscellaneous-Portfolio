/**
 * ThemeContext.jsx - Dark/Light Theme Management with Firestore Sync
 * 
 * Provides global theme state management for the application.
 * Supports dark and light modes with automatic persistence.
 * 
 * Features:
 * - Syncs theme preference to Firestore when logged in
 * - Falls back to localStorage for guests
 * - Detects system preference on first visit
 * - Sets data-theme attribute on <html> for CSS targeting
 * 
 * Usage in components:
 *   const { isDark, toggleTheme } = useTheme();
 * 
 * CSS targeting:
 *   [data-theme="dark"] { --bg-color: #0f172a; }
 *   [data-theme="light"] { --bg-color: #ffffff; }
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Create the context - this holds the theme state
const ThemeContext = createContext();

/**
 * Custom hook to access theme state and controls
 * Must be used within a ThemeProvider
 * 
 * @returns {{ isDark: boolean, toggleTheme: () => void }}
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Theme Provider Component
 * Wrap your app with this to enable theme functionality
 */
export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();

    // Initialize theme from localStorage or system preference
    const [isDark, setIsDark] = useState(() => {
        // First, check if user has a saved preference in localStorage
        const saved = localStorage.getItem('investman-theme');
        if (saved) return saved === 'dark';

        // No saved preference - check system/OS preference
        if (window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Default to light mode
        return false;
    });

    // Track if we've loaded from Firestore
    const [hasLoadedFromFirestore, setHasLoadedFromFirestore] = useState(false);

    // Load theme from Firestore when user logs in
    useEffect(() => {
        const loadThemeFromFirestore = async () => {
            if (!user) {
                setHasLoadedFromFirestore(false);
                return;
            }

            try {
                const prefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
                const prefsDoc = await getDoc(prefsRef);

                if (prefsDoc.exists() && prefsDoc.data().theme !== undefined) {
                    const firestoreTheme = prefsDoc.data().theme === 'dark';
                    setIsDark(firestoreTheme);
                    localStorage.setItem('investman-theme', firestoreTheme ? 'dark' : 'light');
                }
                setHasLoadedFromFirestore(true);
            } catch (error) {
                console.error('Error loading theme from Firestore:', error);
                setHasLoadedFromFirestore(true);
            }
        };

        loadThemeFromFirestore();
    }, [user]);

    // Save theme to Firestore when it changes (and user is logged in)
    const saveThemeToFirestore = useCallback(async (theme) => {
        if (!user || !hasLoadedFromFirestore) return;

        try {
            const prefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
            await setDoc(prefsRef, { theme: theme ? 'dark' : 'light' }, { merge: true });
        } catch (error) {
            console.error('Error saving theme to Firestore:', error);
        }
    }, [user, hasLoadedFromFirestore]);

    // Effect: Persist theme and apply to document
    useEffect(() => {
        // Save to localStorage for next visit (always)
        localStorage.setItem('investman-theme', isDark ? 'dark' : 'light');

        // Set data-theme attribute on <html> element
        // CSS variables change based on this attribute (see index.css)
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

        // Save to Firestore if user is logged in
        saveThemeToFirestore(isDark);
    }, [isDark, saveThemeToFirestore]);

    // Toggle function - switches between dark and light
    const toggleTheme = () => setIsDark(prev => !prev);

    // Provide theme state and toggle function to all children
    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

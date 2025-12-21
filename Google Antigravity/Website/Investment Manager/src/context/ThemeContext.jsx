/**
 * ThemeContext.jsx - Dark/Light Theme Management
 * 
 * Provides global theme state management for the application.
 * Supports dark and light modes with automatic persistence.
 * 
 * Features:
 * - Persists theme preference to localStorage
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

import { createContext, useContext, useState, useEffect } from 'react';

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
    // Initialize theme from localStorage or system preference
    const [isDark, setIsDark] = useState(() => {
        // First, check if user has a saved preference
        const saved = localStorage.getItem('investman-theme');
        if (saved) return saved === 'dark';

        // No saved preference - check system/OS preference
        if (window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Default to light mode
        return false;
    });

    // Effect: Persist theme and apply to document
    useEffect(() => {
        // Save to localStorage for next visit
        localStorage.setItem('investman-theme', isDark ? 'dark' : 'light');

        // Set data-theme attribute on <html> element
        // CSS variables change based on this attribute (see index.css)
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Toggle function - switches between dark and light
    const toggleTheme = () => setIsDark(prev => !prev);

    // Provide theme state and toggle function to all children
    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

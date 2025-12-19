import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import '../styles/global.css';
import './Header.css';

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language];

    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (!isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = 'unset';
    };

    const headerClasses = `header ${scrolled ? 'scrolled' : ''} ${isHomePage ? 'dark-text' : ''}`;

    return (
        <header className={headerClasses}>
            <div className="logo">
                FutureCity<span>.</span>
            </div>

            {/* Toggle Icons Container */}
            <div className="header-toggles">
                {/* Language Toggle */}
                <button
                    className="toggle-btn"
                    onClick={toggleLanguage}
                    aria-label="Toggle language"
                    title={language === 'en' ? 'Switch to Thai' : 'Switch to English'}
                >
                    <span className="toggle-icon">{language === 'en' ? '🇬🇧' : '🇹🇭'}</span>
                    <span className="toggle-text">{language.toUpperCase()}</span>
                </button>

                {/* Theme Toggle */}
                <button
                    className="toggle-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    <span className="toggle-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
                </button>
            </div>

            <button
                className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </button>

            <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
                <Link to="/" className="nav-link" onClick={closeMenu}>{t.home}</Link>
                <Link to="/nuclear-power" className="nav-link" onClick={closeMenu}>{t.nuclearPower}</Link>
                <Link to="/water-filtration" className="nav-link" onClick={closeMenu}>{t.waterFiltration}</Link>
                <Link to="/waste-management" className="nav-link" onClick={closeMenu}>{t.wasteManagement}</Link>
                <Link to="/co-emissions" className="nav-link" onClick={closeMenu}>{t.coEmissions}</Link>
            </nav>
        </header>
    );
};

export default Header;

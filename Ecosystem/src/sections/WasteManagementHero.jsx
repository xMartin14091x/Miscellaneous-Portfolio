import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WasteManagementHero.css';

const WasteManagementHero = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="waste-management-hero" className="waste-hero">
            <div className="waste-hero-overlay"></div>
            <div className="waste-hero-content">
                <h1 className="waste-hero-title">
                    {t.wasteHeroTitle}
                </h1>
                <p className="waste-hero-subtitle">
                    {t.wasteHeroSubtitle}
                </p>
                <button className="waste-hero-button">
                    {t.learnMore}
                </button>
            </div>

            {/* Abstract Background Element */}
            <div className="waste-hero-background-element"></div>
        </section>
    );
};

export default WasteManagementHero;

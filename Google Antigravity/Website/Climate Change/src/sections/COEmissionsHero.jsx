import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './COEmissionsHero.css';

const COEmissionsHero = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="co-emissions-hero" className="co-hero">
            <div className="co-hero-overlay"></div>
            <div className="co-hero-content">
                <h1 className="co-hero-title">
                    {t.coHeroTitle}
                </h1>
                <p className="co-hero-subtitle">
                    {t.coHeroSubtitle}
                </p>
                <button className="co-hero-button">
                    {t.learnMore}
                </button>
            </div>

            {/* Abstract Background Element */}
            <div className="co-hero-background-element"></div>
        </section>
    );
};

export default COEmissionsHero;

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './NuclearHero.css';

const NuclearHero = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="nuclear-hero" className="nuclear-hero">
            <div className="nuclear-hero-overlay"></div>
            <div className="nuclear-hero-content">
                <h1 className="nuclear-hero-title">
                    {t.nuclearHeroTitle}
                </h1>
                <p className="nuclear-hero-subtitle">
                    {t.nuclearHeroSubtitle}
                </p>
                <button className="nuclear-hero-button">
                    {t.learnMore}
                </button>
            </div>

            {/* Abstract Background Element */}
            <div className="nuclear-hero-background-element"></div>
        </section>
    );
};

export default NuclearHero;

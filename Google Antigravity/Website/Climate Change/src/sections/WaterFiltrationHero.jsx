import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WaterFiltrationHero.css';

const WaterFiltrationHero = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="water-filtration-hero" className="water-hero">
            <div className="water-hero-overlay"></div>
            <div className="water-hero-content">
                <h1 className="water-hero-title">
                    {t.waterHeroTitle}
                </h1>
                <p className="water-hero-subtitle">
                    {t.waterHeroSubtitle}
                </p>
                <button className="water-hero-button">
                    {t.learnMore}
                </button>
            </div>

            {/* Abstract Background Element */}
            <div className="water-hero-background-element"></div>
        </section>
    );
};

export default WaterFiltrationHero;

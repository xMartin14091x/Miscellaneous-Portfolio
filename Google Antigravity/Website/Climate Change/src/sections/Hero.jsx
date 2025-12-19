import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './Hero.css';

const Hero = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="hero" className="hero">
            <div className="hero-overlay"></div>
            <div className="hero-content">
                <h1 className="hero-title">
                    {t.heroTitle}
                </h1>
                <p className="hero-subtitle">
                    {t.heroSubtitle}
                </p>
                <button className="hero-button">
                    {t.learnMore}
                </button>
            </div>

            {/* Abstract Background Element */}
            <div className="hero-background-element"></div>
        </section>
    );
};

export default Hero;

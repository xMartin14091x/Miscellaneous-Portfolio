import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './NuclearBenefits.css';

const NuclearBenefits = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const benefits = [
        {
            icon: '🌧️',
            title: t.nuclearBenefit1Title,
            text: t.nuclearBenefit1Text,
            color: '#eab308'
        },
        {
            icon: '🌍',
            title: t.nuclearBenefit2Title,
            text: t.nuclearBenefit2Text,
            color: '#ca8a04'
        },
        {
            icon: '⚡',
            title: t.nuclearBenefit3Title,
            text: t.nuclearBenefit3Text,
            color: '#a16207'
        }
    ];

    return (
        <section id="nuclear-benefits" className="nuclear-benefits-section">
            <div className="nuclear-benefits-container">
                <div className="nuclear-benefits-header">
                    <h2 className="nuclear-benefits-title">{t.nuclearBenefitsTitle}</h2>
                    <p className="nuclear-benefits-subtitle">{t.nuclearBenefitsSubtitle}</p>
                </div>
                <div className="nuclear-benefits-grid">
                    {benefits.map((item, index) => (
                        <div key={index} className="nuclear-benefit-card">
                            <span
                                className="nuclear-benefit-icon"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                                {item.icon}
                            </span>
                            <h3 className="nuclear-benefit-card-title">{item.title}</h3>
                            <p className="nuclear-benefit-card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NuclearBenefits;

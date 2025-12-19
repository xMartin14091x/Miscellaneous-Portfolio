import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WaterFiltrationBenefits.css';

const WaterFiltrationBenefits = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const benefits = [
        {
            icon: '🌊',
            title: t.waterBenefit1Title,
            text: t.waterBenefit1Text,
            color: '#0ea5e9'
        },
        {
            icon: '🧪',
            title: t.waterBenefit2Title,
            text: t.waterBenefit2Text,
            color: '#06b6d4'
        },
        {
            icon: '🦠',
            title: t.waterBenefit3Title,
            text: t.waterBenefit3Text,
            color: '#0284c7'
        }
    ];

    return (
        <section id="water-benefits" className="water-benefits-section">
            <div className="water-benefits-container">
                <div className="water-benefits-header">
                    <h2 className="water-benefits-title">{t.waterBenefitsTitle}</h2>
                    <p className="water-benefits-subtitle">{t.waterBenefitsSubtitle}</p>
                </div>
                <div className="water-benefits-grid">
                    {benefits.map((item, index) => (
                        <div key={index} className="water-benefit-card">
                            <span
                                className="water-benefit-icon"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                                {item.icon}
                            </span>
                            <h3 className="water-benefit-card-title">{item.title}</h3>
                            <p className="water-benefit-card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WaterFiltrationBenefits;

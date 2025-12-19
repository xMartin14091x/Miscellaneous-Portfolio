import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WasteManagementBenefits.css';

const WasteManagementBenefits = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const benefits = [
        {
            icon: '♻️',
            title: t.wasteBenefit1Title,
            text: t.wasteBenefit1Text,
            color: '#22c55e'
        },
        {
            icon: '🔋',
            title: t.wasteBenefit2Title,
            text: t.wasteBenefit2Text,
            color: '#16a34a'
        },
        {
            icon: '🌱',
            title: t.wasteBenefit3Title,
            text: t.wasteBenefit3Text,
            color: '#15803d'
        }
    ];

    return (
        <section id="waste-benefits" className="waste-benefits-section">
            <div className="waste-benefits-container">
                <div className="waste-benefits-header">
                    <h2 className="waste-benefits-title">{t.wasteBenefitsTitle}</h2>
                    <p className="waste-benefits-subtitle">{t.wasteBenefitsSubtitle}</p>
                </div>
                <div className="waste-benefits-grid">
                    {benefits.map((item, index) => (
                        <div key={index} className="waste-benefit-card">
                            <span
                                className="waste-benefit-icon"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                                {item.icon}
                            </span>
                            <h3 className="waste-benefit-card-title">{item.title}</h3>
                            <p className="waste-benefit-card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WasteManagementBenefits;

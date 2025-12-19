import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './COEmissionsBenefits.css';

const COEmissionsBenefits = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const benefits = [
        {
            icon: '🚗',
            title: t.coBenefit1Title,
            text: t.coBenefit1Text,
            color: '#64748b'
        },
        {
            icon: '🔧',
            title: t.coBenefit2Title,
            text: t.coBenefit2Text,
            color: '#475569'
        },
        {
            icon: '🚌',
            title: t.coBenefit3Title,
            text: t.coBenefit3Text,
            color: '#334155'
        }
    ];

    return (
        <section id="co-benefits" className="co-benefits-section">
            <div className="co-benefits-container">
                <div className="co-benefits-header">
                    <h2 className="co-benefits-title">{t.coBenefitsTitle}</h2>
                    <p className="co-benefits-subtitle">{t.coBenefitsSubtitle}</p>
                </div>
                <div className="co-benefits-grid">
                    {benefits.map((item, index) => (
                        <div key={index} className="co-benefit-card">
                            <span
                                className="co-benefit-icon"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                                {item.icon}
                            </span>
                            <h3 className="co-benefit-card-title">{item.title}</h3>
                            <p className="co-benefit-card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default COEmissionsBenefits;

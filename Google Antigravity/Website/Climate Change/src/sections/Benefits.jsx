import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './Benefits.css';

const Benefits = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const benefits = [
        {
            icon: '🌍',
            title: t.benefit1Title,
            text: t.benefit1Text,
            color: '#0ea5e9'
        },
        {
            icon: '🌧️',
            title: t.benefit2Title,
            text: t.benefit2Text,
            color: '#10b981'
        },
        {
            icon: '⚡',
            title: t.benefit3Title,
            text: t.benefit3Text,
            color: '#6366f1'
        }
    ];

    return (
        <section id="benefits" className="benefits-section">
            <div className="benefits-container">
                <div className="benefits-header">
                    <h2 className="benefits-title">{t.benefitsTitle}</h2>
                    <p className="benefits-subtitle">{t.benefitsSubtitle}</p>
                </div>
                <div className="benefits-grid">
                    {benefits.map((item, index) => (
                        <div key={index} className="benefit-card">
                            <span
                                className="benefit-icon"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                                {item.icon}
                            </span>
                            <h3 className="benefit-card-title">{item.title}</h3>
                            <p className="benefit-card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Benefits;

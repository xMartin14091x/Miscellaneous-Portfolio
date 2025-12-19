import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WaterFiltrationMethods.css';

const WaterFiltrationMethods = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const methods = [
        {
            icon: '🏔️',
            title: t.waterMethod1Title,
            description: t.waterMethod1Desc
        },
        {
            icon: '🔬',
            title: t.waterMethod2Title,
            description: t.waterMethod2Desc
        },
        {
            icon: '☀️',
            title: t.waterMethod3Title,
            description: t.waterMethod3Desc
        }
    ];

    return (
        <section id="water-methods" className="water-methods-section">
            <div className="water-methods-container">
                <div className="water-methods-header">
                    <h2 className="water-methods-title">{t.waterMethodsTitle}</h2>
                    <p className="water-methods-subtitle">{t.waterMethodsSubtitle}</p>
                </div>
                <div className="water-methods-grid">
                    {methods.map((method, index) => (
                        <div key={index} className="water-method-card">
                            <div className="water-method-number">{String(index + 1).padStart(2, '0')}</div>
                            <span className="water-method-icon">{method.icon}</span>
                            <h3 className="water-method-title">{method.title}</h3>
                            <p className="water-method-desc">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WaterFiltrationMethods;

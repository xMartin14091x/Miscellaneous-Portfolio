import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './COEmissionsMethods.css';

const COEmissionsMethods = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const methods = [
        {
            icon: '⚡',
            title: t.coMethod1Title,
            description: t.coMethod1Desc
        },
        {
            icon: '🌳',
            title: t.coMethod2Title,
            description: t.coMethod2Desc
        },
        {
            icon: '🏙️',
            title: t.coMethod3Title,
            description: t.coMethod3Desc
        }
    ];

    return (
        <section id="co-methods" className="co-methods-section">
            <div className="co-methods-container">
                <div className="co-methods-header">
                    <h2 className="co-methods-title">{t.coMethodsTitle}</h2>
                    <p className="co-methods-subtitle">{t.coMethodsSubtitle}</p>
                </div>
                <div className="co-methods-grid">
                    {methods.map((method, index) => (
                        <div key={index} className="co-method-card">
                            <div className="co-method-number">{String(index + 1).padStart(2, '0')}</div>
                            <span className="co-method-icon">{method.icon}</span>
                            <h3 className="co-method-title">{method.title}</h3>
                            <p className="co-method-desc">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default COEmissionsMethods;

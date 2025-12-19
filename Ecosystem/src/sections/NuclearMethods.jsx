import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './NuclearMethods.css';

const NuclearMethods = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const methods = [
        {
            icon: '🏭',
            title: t.nuclearMethod1Title,
            description: t.nuclearMethod1Desc
        },
        {
            icon: '🌱',
            title: t.nuclearMethod2Title,
            description: t.nuclearMethod2Desc
        },
        {
            icon: '⚖️',
            title: t.nuclearMethod3Title,
            description: t.nuclearMethod3Desc
        }
    ];

    return (
        <section id="nuclear-methods" className="nuclear-methods-section">
            <div className="nuclear-methods-container">
                <div className="nuclear-methods-header">
                    <h2 className="nuclear-methods-title">{t.nuclearMethodsTitle}</h2>
                    <p className="nuclear-methods-subtitle">{t.nuclearMethodsSubtitle}</p>
                </div>
                <div className="nuclear-methods-grid">
                    {methods.map((method, index) => (
                        <div key={index} className="nuclear-method-card">
                            <div className="nuclear-method-number">{String(index + 1).padStart(2, '0')}</div>
                            <span className="nuclear-method-icon">{method.icon}</span>
                            <h3 className="nuclear-method-title">{method.title}</h3>
                            <p className="nuclear-method-desc">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NuclearMethods;

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WasteManagementMethods.css';

const WasteManagementMethods = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const methods = [
        {
            icon: '🗑️',
            title: t.wasteMethod1Title,
            description: t.wasteMethod1Desc
        },
        {
            icon: '⚡',
            title: t.wasteMethod2Title,
            description: t.wasteMethod2Desc
        },
        {
            icon: '📚',
            title: t.wasteMethod3Title,
            description: t.wasteMethod3Desc
        }
    ];

    return (
        <section id="waste-methods" className="waste-methods-section">
            <div className="waste-methods-container">
                <div className="waste-methods-header">
                    <h2 className="waste-methods-title">{t.wasteMethodsTitle}</h2>
                    <p className="waste-methods-subtitle">{t.wasteMethodsSubtitle}</p>
                </div>
                <div className="waste-methods-grid">
                    {methods.map((method, index) => (
                        <div key={index} className="waste-method-card">
                            <div className="waste-method-number">{String(index + 1).padStart(2, '0')}</div>
                            <span className="waste-method-icon">{method.icon}</span>
                            <h3 className="waste-method-title">{method.title}</h3>
                            <p className="waste-method-desc">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WasteManagementMethods;

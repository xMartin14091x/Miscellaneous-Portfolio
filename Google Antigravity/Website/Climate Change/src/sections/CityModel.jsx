import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import cityImage from '../assets/city-model.png';
import './CityModel.css';

const CityModel = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const features = [
        { title: t.feature1Title, desc: t.feature1Desc },
        { title: t.feature2Title, desc: t.feature2Desc },
        { title: t.feature3Title, desc: t.feature3Desc }
    ];

    return (
        <section id="model-city" className="city-model-section">
            <div className="city-model-container">
                <div className="city-model-image-container">
                    <img
                        src={cityImage}
                        alt="Future Nuclear City"
                        className="city-model-image"
                    />
                    {/* Glowing effect behind image */}
                    <div className="city-model-glow"></div>
                </div>
                <div className="city-model-content">
                    <h2 className="city-model-title">{t.cityModelTitle}</h2>
                    <p className="city-model-subtitle">{t.cityModelSubtitle}</p>

                    <div className="city-model-features">
                        {features.map((feature, idx) => (
                            <div key={idx} className="city-model-feature">
                                <div className="feature-check">✓</div>
                                <div>
                                    <h4 className="feature-title">{feature.title}</h4>
                                    <p className="feature-desc">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CityModel;

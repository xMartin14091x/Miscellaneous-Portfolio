import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import './WorldIssues.css';

// Import images
import climateChangeImg from '../assets/climate_change.png';
import airPollutionImg from '../assets/air_pollution.png';
import biodiversityLossImg from '../assets/biodiversity_loss.png';
import plasticPollutionImg from '../assets/plastic_pollution.png';
import waterScarcityImg from '../assets/water_scarcity.png';
import unsustainableEnergyImg from '../assets/unsustainable_energy.png';

const WorldIssues = () => {
    const { language } = useLanguage();
    const t = translations[language];

    const issues = [
        {
            id: 'climate',
            icon: '🌡️',
            title: t.issueClimateTitle,
            description: t.issueClimateDesc,
            image: climateChangeImg,
            color: '#ef4444'
        },
        {
            id: 'air',
            icon: '🏭',
            title: t.issueAirTitle,
            description: t.issueAirDesc,
            image: airPollutionImg,
            color: '#64748b'
        },
        {
            id: 'biodiversity',
            icon: '🦋',
            title: t.issueBiodiversityTitle,
            description: t.issueBiodiversityDesc,
            image: biodiversityLossImg,
            color: '#22c55e'
        },
        {
            id: 'plastic',
            icon: '🌊',
            title: t.issuePlasticTitle,
            description: t.issuePlasticDesc,
            image: plasticPollutionImg,
            color: '#3b82f6'
        },
        {
            id: 'water',
            icon: '💧',
            title: t.issueWaterTitle,
            description: t.issueWaterDesc,
            image: waterScarcityImg,
            color: '#06b6d4'
        },
        {
            id: 'energy',
            icon: '⚡',
            title: t.issueEnergyTitle,
            description: t.issueEnergyDesc,
            image: unsustainableEnergyImg,
            color: '#f59e0b'
        }
    ];

    return (
        <section className="world-issues-section">
            <div className="world-issues-container">
                {/* Header */}
                <div className="world-issues-header">
                    <span className="section-label">{t.issuesSectionLabel}</span>
                    <h2 className="world-issues-title">{t.issuesSectionTitle}</h2>
                    <p className="world-issues-subtitle">{t.issuesSectionSubtitle}</p>
                </div>

                {/* Issues Grid */}
                <div className="issues-grid">
                    {issues.map((issue, index) => (
                        <div
                            key={issue.id}
                            className={`issue-card ${index % 2 === 1 ? 'reverse' : ''}`}
                        >
                            <div className="issue-image-container">
                                <img
                                    src={issue.image}
                                    alt={issue.title}
                                    className="issue-image"
                                />
                                <div
                                    className="issue-image-overlay"
                                    style={{ background: `linear-gradient(135deg, ${issue.color}40, transparent)` }}
                                ></div>
                            </div>
                            <div className="issue-content">
                                <div className="issue-icon-wrapper" style={{ backgroundColor: `${issue.color}20` }}>
                                    <span className="issue-icon">{issue.icon}</span>
                                </div>
                                <h3 className="issue-title">{issue.title}</h3>
                                <p className="issue-description">{issue.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Conclusion Banner */}
                <div className="conclusion-banner">
                    <div className="conclusion-icon">🔗</div>
                    <h3 className="conclusion-title">{t.issuesConclusionTitle}</h3>
                    <p className="conclusion-text">{t.issuesConclusionText}</p>
                </div>
            </div>
        </section>
    );
};

export default WorldIssues;

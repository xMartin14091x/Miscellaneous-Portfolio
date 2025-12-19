import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import WorldIssues from '../sections/WorldIssues';
import './Home.css';

const Home = () => {
    const [viewMode, setViewMode] = useState('problems'); // 'problems' | 'solutions'
    const { language } = useLanguage();
    const t = translations[language];

    const toggleView = () => {
        setViewMode(viewMode === 'problems' ? 'solutions' : 'problems');
    };

    return (
        <>
            {/* World Issues Section - appears before the toggle */}
            <WorldIssues />

            <div className={`home-container theme-${viewMode === 'problems' ? 'brown' : 'green'}`}>
                <div className="toggle-container">
                    <span className={`toggle-label ${viewMode === 'problems' ? 'active' : ''}`}>{t.toggleCurrentReality}</span>
                    <label className="switch">
                        <input type="checkbox" checked={viewMode === 'solutions'} onChange={toggleView} />
                        <span className="slider round"></span>
                    </label>
                    <span className={`toggle-label ${viewMode === 'solutions' ? 'active' : ''}`}>{t.toggleFutureVision}</span>
                </div>

                <div className="home-hero">
                    {viewMode === 'problems' ? (
                        <>
                            <h1>{t.problemsTitle}</h1>
                            <p>{t.problemsSubtitle}</p>
                        </>
                    ) : (
                        <>
                            <h1>{t.solutionsTitle}</h1>
                            <p>{t.solutionsSubtitle}</p>
                        </>
                    )}
                </div>

                <div className="content-grid">
                    {viewMode === 'problems' ? (
                        <>
                            <div className="card problem-card">
                                <h3>{t.acidRainTitle}</h3>
                                <p>{t.acidRainDesc}</p>
                                <p><strong>{t.impact}:</strong> {t.acidRainImpact}</p>
                            </div>
                            <div className="card problem-card">
                                <h3>{t.greenhouseTitle}</h3>
                                <p>{t.greenhouseDesc}</p>
                                <p><strong>{t.impact}:</strong> {t.greenhouseImpact}</p>
                            </div>
                            <div className="card problem-card">
                                <h3>{t.waterPollutionTitle}</h3>
                                <p>{t.waterPollutionDesc}</p>
                                <p><strong>{t.impact}:</strong> {t.waterPollutionImpact}</p>
                            </div>
                            <div className="card problem-card">
                                <h3>{t.landfillTitle}</h3>
                                <p>{t.landfillDesc}</p>
                                <p><strong>{t.impact}:</strong> {t.landfillImpact}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="card solution-card">
                                <h3>{t.nuclearEnergyTitle}</h3>
                                <p>{t.nuclearEnergyDesc}</p>
                                <p><strong>{t.benefit}:</strong> {t.nuclearEnergyBenefit}</p>
                            </div>
                            <div className="card solution-card">
                                <h3>{t.renewablesTitle}</h3>
                                <p>{t.renewablesDesc}</p>
                                <p><strong>{t.benefit}:</strong> {t.renewablesBenefit}</p>
                            </div>
                            <div className="card solution-card">
                                <h3>{t.waterFiltrationTitle}</h3>
                                <p>{t.waterFiltrationDesc}</p>
                                <p><strong>{t.benefit}:</strong> {t.waterFiltrationBenefit}</p>
                            </div>
                            <div className="card solution-card">
                                <h3>{t.circularWasteTitle}</h3>
                                <p>{t.circularWasteDesc}</p>
                                <p><strong>{t.benefit}:</strong> {t.circularWasteBenefit}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;


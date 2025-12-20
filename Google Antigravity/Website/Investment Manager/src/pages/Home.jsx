import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const Home = () => {
    const { t } = useLanguage();

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">{t.heroTitle}</h1>
                    <h2 className="hero-subtitle">{t.heroSubtitle}</h2>
                    <p className="hero-description">{t.heroDescription}</p>
                </div>
                <div className="scroll-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                </div>
            </section>

            {/* Origin Section */}
            <section className="section origin-section">
                <div className="origin-content">
                    <h2 className="section-title">{t.originTitle}</h2>
                    <p className="origin-text">{t.originText}</p>
                </div>
            </section>

            {/* Importance Section */}
            <section className="section importance-section">
                <h2 className="section-title">{t.importanceTitle}</h2>
                <p className="importance-intro">{t.importanceText}</p>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <p className="feature-text">{t.feature1}</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </div>
                        <p className="feature-text">{t.feature2}</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <p className="feature-text">{t.feature3}</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <p className="feature-text">{t.feature4}</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <h2 className="section-title">{t.ctaTitle}</h2>
                <Link to="/planning" className="cta-button">
                    {t.ctaButton}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </Link>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p className="footer-text">{t.footerText}</p>
            </footer>
        </div>
    );
};

export default Home;

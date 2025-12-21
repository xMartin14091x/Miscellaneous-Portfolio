import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './AuthPage.css';

const SignupPage = () => {
    const { user, signUp, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, authError, clearAuthError } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Auth mode: 'email' or 'phone'
    const [authMode, setAuthMode] = useState('email');

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+66');
    const [otpCode, setOtpCode] = useState('');

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showOTP, setShowOTP] = useState(false);

    // If user is already logged in (e.g., from redirect), navigate away
    useEffect(() => {
        if (user) {
            navigate('/planning', { replace: true });
        }
    }, [user, navigate]);

    // Show any redirect errors from AuthContext
    useEffect(() => {
        if (authError) {
            setError(authError);
            clearAuthError();
        }
    }, [authError, clearAuthError]);

    // Handle email/password signup
    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError(t.authPasswordMismatch);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError(t.authPasswordTooShort);
            return;
        }

        setLoading(true);

        const result = await signUp(email, password);

        if (result.success) {
            navigate('/planning', { replace: true });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    // Handle Google signup
    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);

        const result = await signInWithGoogle();

        if (result.success) {
            navigate('/planning', { replace: true });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    // Handle phone signup - Step 1
    const handlePhoneSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const fullPhoneNumber = countryCode + phoneNumber;
        const result = await sendPhoneOTP(fullPhoneNumber, 'recaptcha-container');

        if (result.success) {
            setShowOTP(true);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    // Handle phone signup - Step 2
    const handlePhoneVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verifyPhoneOTP(otpCode);

        if (result.success) {
            navigate('/planning', { replace: true });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <h1 className="auth-logo">{t.brand}</h1>
                    <h2 className="auth-title">{t.authSignupTitle}</h2>
                    <p className="auth-subtitle">{t.authSignupSubtitle}</p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${authMode === 'email' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('email'); setError(''); setShowOTP(false); }}
                    >
                        {t.authEmailTab}
                    </button>
                    <button
                        className={`auth-tab ${authMode === 'phone' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('phone'); setError(''); setShowOTP(false); }}
                    >
                        {t.authPhoneTab}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="auth-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Email Signup Form */}
                {authMode === 'email' && (
                    <form className="auth-form" onSubmit={handleEmailSignup}>
                        <div className="form-group">
                            <label>{t.authEmail}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.authEmailPlaceholder}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t.authPassword}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.authPasswordPlaceholder}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t.authConfirmPassword}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t.authConfirmPasswordPlaceholder}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <span className="btn-spinner"></span> : t.authSignupBtn}
                        </button>
                    </form>
                )}

                {/* Phone Signup Form */}
                {authMode === 'phone' && !showOTP && (
                    <form className="auth-form" onSubmit={handlePhoneSendOTP}>
                        <div className="form-group">
                            <label>{t.authPhoneNumber}</label>
                            <div className="phone-input-wrapper">
                                <input
                                    type="text"
                                    className="country-code"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    disabled={loading}
                                />
                                <input
                                    type="tel"
                                    className="phone-number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder={t.authPhonePlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <span className="btn-spinner"></span> : t.authSendOTP}
                        </button>
                    </form>
                )}

                {/* OTP Verification Form */}
                {authMode === 'phone' && showOTP && (
                    <form className="auth-form" onSubmit={handlePhoneVerifyOTP}>
                        <div className="auth-success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {t.authOTPSent}
                        </div>
                        <div className="form-group">
                            <label>{t.authEnterOTP}</label>
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength={6}
                                required
                                disabled={loading}
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                            />
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={loading || otpCode.length !== 6}>
                            {loading ? <span className="btn-spinner"></span> : t.authVerifyOTP}
                        </button>
                        <button
                            type="button"
                            className="resend-otp"
                            onClick={() => setShowOTP(false)}
                            disabled={loading}
                        >
                            {t.authResendOTP}
                        </button>
                    </form>
                )}

                {/* Divider */}
                <div className="auth-divider">
                    <span>{t.authOrContinue}</span>
                </div>

                {/* Social Login Buttons */}
                <div className="social-buttons">
                    <button
                        className="social-btn google-btn"
                        onClick={handleGoogleSignup}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {t.authGoogleBtn}
                    </button>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        {t.authHasAccount} <Link to="/login">{t.authLoginLink}</Link>
                    </p>
                </div>

                {/* reCAPTCHA container (invisible) */}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
};

export default SignupPage;

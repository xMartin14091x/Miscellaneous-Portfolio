import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { isDark, toggleTheme } = useTheme();
    const { toggleLanguage, t } = useLanguage();
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut();
        setShowUserMenu(false);
        navigate('/');
    };

    // Get user display name or email
    const getUserDisplayName = () => {
        if (!user) return '';
        if (user.displayName) return user.displayName;
        if (user.email) return user.email.split('@')[0];
        if (user.phoneNumber) return user.phoneNumber;
        return 'User';
    };

    // Get user avatar (first letter of name/email)
    const getUserAvatar = () => {
        const name = getUserDisplayName();
        return name.charAt(0).toUpperCase();
    };

    return (
        <nav className="navbar">
            {/* Left: Brand */}
            <Link to="/" className="navbar-brand">
                {t.brand}
            </Link>

            {/* Center: Page Navigation */}
            <div className="navbar-nav">
                <Link
                    to="/"
                    className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>{t.navHome}</span>
                </Link>
                <Link
                    to="/planning"
                    className={`nav-btn ${location.pathname === '/planning' ? 'active' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <span>{t.navPlan}</span>
                </Link>
            </div>

            {/* Right: Controls */}
            <div className="navbar-controls">
                {/* Language Toggle Button */}
                <button
                    className="control-btn lang-btn"
                    onClick={toggleLanguage}
                    aria-label="Toggle language"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <span className="btn-text">{t.language}</span>
                </button>

                {/* Theme Toggle Button */}
                <button
                    className="control-btn theme-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {isDark ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    )}
                    <span className="btn-text">{isDark ? t.lightMode : t.darkMode}</span>
                </button>

                {/* Auth: Login button or User menu */}
                {user ? (
                    <div className="user-menu-container" ref={userMenuRef}>
                        <button
                            className="user-avatar-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            aria-label="User menu"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="user-avatar-img" />
                            ) : (
                                <span className="user-avatar-text">{getUserAvatar()}</span>
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="user-menu-dropdown">
                                <div className="user-menu-header">
                                    <span className="user-menu-name">{getUserDisplayName()}</span>
                                    {user.email && <span className="user-menu-email">{user.email}</span>}
                                </div>
                                <div className="user-menu-divider"></div>
                                <button className="user-menu-item logout-btn" onClick={handleLogout}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    {t.authLogout}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="control-btn login-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        <span className="btn-text">{t.authLoginBtn}</span>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;


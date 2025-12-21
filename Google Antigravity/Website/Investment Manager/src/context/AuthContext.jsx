/**
 * AuthContext.jsx - Firebase Authentication Management
 * 
 * Provides authentication state and methods throughout the app.
 * Supports multiple authentication methods:
 * - Email/Password (traditional login)
 * - Phone Number with OTP (SMS verification)
 * - Google Sign-In (OAuth popup with redirect fallback)
 * 
 * Usage in components:
 *   const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
 *   
 *   if (loading) return <Spinner />;
 *   if (!user) return <LoginPage />;
 *   return <Dashboard />;
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,   // Email/password signup
    signInWithEmailAndPassword,        // Email/password login
    signInWithPopup,                   // Google popup auth
    signInWithRedirect,                // Google redirect auth (fallback)
    getRedirectResult,                 // Get result after redirect
    signInWithPhoneNumber,             // Phone OTP auth
    signOut as firebaseSignOut,        // Renamed to avoid conflict
    onAuthStateChanged                 // Auth state listener
} from 'firebase/auth';
import { auth, googleProvider, setupRecaptcha } from '../firebase';

// Create the auth context
const AuthContext = createContext(null);

/**
 * Custom hook to access authentication state and methods
 * Must be used within an AuthProvider
 * 
 * @returns {{
 *   user: object|null,           // Current Firebase user or null
 *   loading: boolean,            // True while checking initial auth state
 *   authError: string|null,      // Error from redirect auth
 *   clearAuthError: () => void,  // Clear the error
 *   signUp: (email, password) => Promise,
 *   signIn: (email, password) => Promise,
 *   signInWithGoogle: () => Promise,
 *   sendPhoneOTP: (phone, containerId) => Promise,
 *   verifyPhoneOTP: (code) => Promise,
 *   signOut: () => Promise
 * }}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// -----------------------------------------------------------------------------
// Error Message Mapping
// Converts Firebase error codes to user-friendly messages
// -----------------------------------------------------------------------------
const getErrorMessage = (errorCode) => {
    const errorMessages = {
        // Email/Password errors
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'This sign-in method is not enabled',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',

        // Google/Popup errors
        'auth/popup-closed-by-user': 'Sign-in popup was closed',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups or try again.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled',
        'auth/unauthorized-domain': 'This domain is not authorized for sign-in. Please contact support.',
        
        // Network/Internal errors
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/internal-error': 'An internal error occurred. Please try again.',
        'auth/web-storage-unsupported': 'Your browser does not support web storage. Please enable cookies.',
        'auth/timeout': 'The operation timed out. Please try again.',
        'auth/user-token-expired': 'Your session has expired. Please sign in again.',
        'auth/null-user': 'No user found. Please try signing in again.',
        
        // Redirect errors
        'auth/redirect-cancelled-by-user': 'Sign-in was cancelled',
        'auth/redirect-operation-pending': 'A sign-in is already in progress',

        // Phone auth errors
        'auth/invalid-phone-number': 'Invalid phone number format',
        'auth/missing-phone-number': 'Please enter a phone number',
        'auth/invalid-verification-code': 'Invalid verification code',
        'auth/code-expired': 'Verification code has expired'
    };
    
    // If we don't recognize the error, show the code for debugging
    if (!errorMessages[errorCode]) {
        console.error('Unknown Firebase error code:', errorCode);
        return `Error: ${errorCode || 'Unknown error'}. Please try again or use a different sign-in method.`;
    }
    
    return errorMessages[errorCode];
};

/**
 * Auth Provider Component
 * Wrap your app with this to enable authentication
 */
export const AuthProvider = ({ children }) => {
    // Current authenticated user (null if not logged in)
    const [user, setUser] = useState(null);

    // True while checking if user is already logged in on app load
    const [loading, setLoading] = useState(true);

    // Stores the confirmation result for phone OTP verification
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Stores any auth error from redirect (shown on page after redirect)
    const [authError, setAuthError] = useState(null);

    // -------------------------------------------------------------------------
    // Effect: Handle Google redirect result
    // When using redirect auth, the result is available when the page reloads
    // -------------------------------------------------------------------------
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && result.user) {
                    console.log('Redirect sign-in successful:', result.user.email);
                    setUser(result.user);
                }
            } catch (error) {
                console.error('Redirect sign-in error:', error.code, error.message);
                setAuthError(getErrorMessage(error.code));
            }
        };
        handleRedirectResult();
    }, []);

    // -------------------------------------------------------------------------
    // Effect: Listen for auth state changes
    // This is the source of truth for whether user is logged in
    // -------------------------------------------------------------------------
    useEffect(() => {
        // onAuthStateChanged fires immediately with current state,
        // then again whenever user logs in or out
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('Auth state changed:', currentUser?.email || 'null');
            setUser(currentUser);
            setLoading(false);  // Initial check complete
        });

        // Cleanup: stop listening when component unmounts
        return unsubscribe;
    }, []);

    // -------------------------------------------------------------------------
    // Auth Method: Email/Password Sign Up
    // Creates a new user account
    // -------------------------------------------------------------------------
    const signUp = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: getErrorMessage(error.code) };
        }
    };

    // -------------------------------------------------------------------------
    // Auth Method: Email/Password Sign In
    // Logs in an existing user
    // -------------------------------------------------------------------------
    const signIn = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: getErrorMessage(error.code) };
        }
    };

    // -------------------------------------------------------------------------
    // Auth Method: Google Sign In
    // Strategy: Detect mobile/problematic browsers and use appropriate method
    // - Samsung Internet: Always use redirect (popups often fail silently)
    // - Other mobile: Try popup, fallback to redirect
    // - Desktop: Use popup
    // -------------------------------------------------------------------------
    const signInWithGoogle = async () => {
        // Detect Samsung Internet browser (has popup issues)
        const isSamsungBrowser = /SamsungBrowser/i.test(navigator.userAgent);

        // Detect mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Samsung browser should always use redirect
        if (isSamsungBrowser) {
            console.log('Samsung browser detected, using redirect auth');
            try {
                await signInWithRedirect(auth, googleProvider);
                return { success: true, redirecting: true };
            } catch (error) {
                return { success: false, error: getErrorMessage(error.code) };
            }
        }

        // For other browsers, try popup first
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            // If popup was blocked, closed, or failed, fall back to redirect
            if (error.code === 'auth/popup-blocked' ||
                error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request' ||
                error.code === 'auth/network-request-failed' ||
                (isMobile && error.code)) {
                try {
                    console.log('Popup failed, trying redirect...', error.code);
                    await signInWithRedirect(auth, googleProvider);
                    return { success: true, redirecting: true };
                } catch (redirectError) {
                    return { success: false, error: getErrorMessage(redirectError.code) };
                }
            }
            return { success: false, error: getErrorMessage(error.code) };
        }
    };

    // -------------------------------------------------------------------------
    // Auth Method: Phone OTP - Step 1: Send Code
    // Sends an SMS with a verification code to the phone number
    // -------------------------------------------------------------------------
    const sendPhoneOTP = async (phoneNumber, recaptchaContainerId) => {
        try {
            // Set up invisible reCAPTCHA (required by Firebase)
            const recaptchaVerifier = setupRecaptcha(recaptchaContainerId);

            // Send the SMS
            const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

            // Store the confirmation result for step 2
            setConfirmationResult(result);
            return { success: true };
        } catch (error) {
            // Reset reCAPTCHA on error
            window.recaptchaVerifier = null;
            return { success: false, error: getErrorMessage(error.code) };
        }
    };

    // -------------------------------------------------------------------------
    // Auth Method: Phone OTP - Step 2: Verify Code
    // Verifies the code entered by the user
    // -------------------------------------------------------------------------
    const verifyPhoneOTP = async (code) => {
        // Must have a confirmation result from step 1
        if (!confirmationResult) {
            return { success: false, error: 'No confirmation result. Please resend OTP.' };
        }
        try {
            const result = await confirmationResult.confirm(code);
            setConfirmationResult(null);  // Clear for next attempt
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: getErrorMessage(error.code) };
        }
    };

    // -------------------------------------------------------------------------
    // Auth Method: Sign Out
    // Logs out the current user
    // -------------------------------------------------------------------------
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Clear the auth error (call this after displaying the error)
    const clearAuthError = () => setAuthError(null);

    // Bundle all auth state and methods for the context
    const value = {
        user,              // Current user object or null
        loading,           // True during initial auth check
        authError,         // Error from redirect auth
        clearAuthError,    // Clear the error
        signUp,            // Email/password registration
        signIn,            // Email/password login
        signInWithGoogle,  // Google OAuth
        sendPhoneOTP,      // Phone step 1: send code
        verifyPhoneOTP,    // Phone step 2: verify code
        signOut            // Log out
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

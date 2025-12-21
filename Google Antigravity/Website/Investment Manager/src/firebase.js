/**
 * firebase.js - Firebase Configuration & Initialization
 * 
 * This file sets up Firebase services for the app:
 * 1. Firebase App - Core Firebase instance
 * 2. Firebase Auth - User authentication (email, phone, Google)
 * 3. Firestore - Real-time cloud database for storing user data
 * 
 * Note: Firebase client-side API keys are safe to expose - security is handled
 * by Firebase Security Rules, not by hiding the API key.
 * 
 * Exports:
 * - auth: Firebase Auth instance for authentication operations
 * - db: Firestore instance for database operations
 * - googleProvider: Google OAuth provider for Google Sign-In
 * - setupRecaptcha: Helper function for phone authentication
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// -----------------------------------------------------------------------------
// Firebase Configuration
// Try environment variables first, fall back to direct values
// Note: Client-side Firebase keys are safe to expose - security is via rules
// -----------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB6tDMPeyYAE51SFUrntkq0CCMIbbCU1L8",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "investman-1eb61.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "investman-1eb61",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "investman-1eb61.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1091713940334",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1091713940334:web:d9b939f841ade4326bdf7f",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DFBFZFTJEE"
};

// Validate config - log warning if any values are missing
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
    console.error('Firebase config missing required keys:', missingKeys);
}

// -----------------------------------------------------------------------------
// Initialize Firebase Services
// -----------------------------------------------------------------------------

// Initialize the Firebase app - this must be done first
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Used for: login, signup, logout, Google sign-in, phone OTP
export const auth = getAuth(app);

// Initialize Cloud Firestore (database)
// Used for: storing and syncing user's investment data
export const db = getFirestore(app);

// -----------------------------------------------------------------------------
// Firestore Offline Persistence
// This allows the app to work offline and sync when back online
// -----------------------------------------------------------------------------
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // This happens when multiple tabs are open
        // Only one tab can have persistence enabled at a time
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // Some browsers (like Safari in private mode) don't support IndexedDB
        console.warn('Firestore persistence not supported in this browser');
    }
});

// -----------------------------------------------------------------------------
// Google Sign-In Provider
// -----------------------------------------------------------------------------

// Create a Google auth provider instance
export const googleProvider = new GoogleAuthProvider();

// Force account selection even if user is already signed in to Google
// This prevents automatic sign-in with the last used account
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// -----------------------------------------------------------------------------
// Phone Authentication Helper
// -----------------------------------------------------------------------------

/**
 * Sets up invisible reCAPTCHA for phone authentication
 * Firebase requires reCAPTCHA to prevent abuse of the phone auth system
 * 
 * @param {string} containerId - ID of the HTML element to attach reCAPTCHA to
 * @returns {RecaptchaVerifier} The reCAPTCHA verifier instance
 * 
 * Usage:
 *   const verifier = setupRecaptcha('recaptcha-container');
 *   await signInWithPhoneNumber(auth, phoneNumber, verifier);
 */
export const setupRecaptcha = (containerId) => {
    // Only create a new verifier if one doesn't exist
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            // 'invisible' means the user won't see a CAPTCHA box
            size: 'invisible',
            // Called when reCAPTCHA is solved (happens automatically)
            callback: () => {
                // reCAPTCHA solved - can proceed with phone auth
            },
            // Called when reCAPTCHA expires
            'expired-callback': () => {
                // Reset so next attempt creates a new verifier
                window.recaptchaVerifier = null;
            }
        });
    }
    return window.recaptchaVerifier;
};

export default app;

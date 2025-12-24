/**
 * App.jsx - Root Application Component
 * 
 * This is the main component that sets up:
 * 1. React Router for page navigation
 * 2. Context providers (nested in correct order)
 * 3. Route definitions for all pages
 * 
 * Provider Order (outermost to innermost):
 * - BrowserRouter: Enables routing throughout the app
 * - AuthProvider: Firebase authentication (needed by Theme/Language for sync)
 * - ThemeProvider: Dark/light mode (syncs to Firestore if logged in)
 * - LanguageProvider: i18n translations (syncs to Firestore if logged in)
 * - InvestmentProvider: Investment data (needs auth to know which user's data to load)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Context Providers - these wrap the app to provide global state
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { InvestmentProvider } from './context/InvestmentContext'

// Components
import ProtectedRoute from './components/ProtectedRoute'  // Auth guard for protected pages
import Navbar from './components/Navbar'                  // Top navigation bar

// Pages
import Home from './pages/Home'                // Landing page (public)
import PlanningPage from './pages/PlanningPage' // Investment planning (protected)
import LoginPage from './pages/LoginPage'       // Login form (public)
import SignupPage from './pages/SignupPage'     // Signup form (public)

// Global styles
import './index.css'

function App() {
  return (
    // BrowserRouter enables client-side routing (no page refresh on navigation)
    <BrowserRouter>
      {/* AuthProvider: Must be outermost so Theme/Language can sync to Firestore */}
      <AuthProvider>
        {/* ThemeProvider: Manages dark/light mode, syncs to user preferences */}
        <ThemeProvider>
          {/* LanguageProvider: Provides translations, syncs to user preferences */}
          <LanguageProvider>
            {/* InvestmentProvider: Manages investment data, syncs with Firestore */}
            <InvestmentProvider>
              {/* Navbar appears on all pages */}
              <Navbar />

              {/* Route definitions */}
              <Routes>
                {/* Public routes - anyone can access */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected route - requires authentication */}
                <Route
                  path="/planning"
                  element={
                    // ProtectedRoute redirects to /login if user is not authenticated
                    <ProtectedRoute>
                      <PlanningPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </InvestmentProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

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
 * - ThemeProvider: Dark/light mode (doesn't depend on anything)
 * - LanguageProvider: i18n translations (doesn't depend on anything)
 * - AuthProvider: Firebase authentication (needs to wrap InvestmentProvider)
 * - InvestmentProvider: Investment data (needs auth to know which user's data to load)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Context Providers - these wrap the app to provide global state
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { InvestmentProvider } from './context/InvestmentContext'
import { AuthProvider } from './context/AuthContext'

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
      {/* ThemeProvider: Manages dark/light mode across the app */}
      <ThemeProvider>
        {/* LanguageProvider: Provides translations (t object) to all components */}
        <LanguageProvider>
          {/* AuthProvider: Manages user authentication state */}
          <AuthProvider>
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
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

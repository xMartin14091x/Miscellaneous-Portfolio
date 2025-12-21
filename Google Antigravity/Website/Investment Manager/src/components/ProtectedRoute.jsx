/**
 * ProtectedRoute.jsx - Authentication Guard Component
 * 
 * A wrapper component that protects routes from unauthenticated access.
 * If user is not logged in, redirects to login page.
 * Remembers the original destination so user can be redirected back after login.
 * 
 * Usage in App.jsx:
 *   <Route
 *     path="/planning"
 *     element={
 *       <ProtectedRoute>
 *         <PlanningPage />
 *       </ProtectedRoute>
 *     }
 *   />
 * 
 * Flow:
 * 1. User visits /planning (protected route)
 * 2. ProtectedRoute checks auth state
 * 3. If loading → show spinner
 * 4. If not logged in → redirect to /login with original path in state
 * 5. If logged in → render the protected content
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - The component(s) to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
    // Get auth state from context
    const { user, loading } = useAuth();

    // Get current location (for redirect-back functionality)
    const location = useLocation();

    // While checking authentication status, show a loading spinner
    // This prevents flash of login page for already-authenticated users
    if (loading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading-spinner"></div>
            </div>
        );
    }

    // Not authenticated → redirect to login
    // Pass current location in state so login page can redirect back after success
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated → render the protected content
    return children;
};

export default ProtectedRoute;

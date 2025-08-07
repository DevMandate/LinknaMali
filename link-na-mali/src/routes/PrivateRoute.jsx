import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const INVITE_PATH = '/user-dashboard/company-invite-login';

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  // If on the invite path, bypass authentication checks
  if (location.pathname === INVITE_PATH) {
    return children;
  }

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch("https://api.linknamali.ke/auth/cookie", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json();
        if (data) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    // ✅ Redirect to Home (Landing Page) instead of Login
    return <Navigate to="/" replace />;
  }

  if (authenticated) {
    if (location.pathname === '/user-dashboard/login' || location.pathname === '/user-dashboard/signup') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return children;
  }

  return null;
};

export default PrivateRoute;

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://api.linknamali.ke';
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Resume functionality state
  const [pendingAction, setPendingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const navigate = useNavigate();

  // Authenticate user via cookie
  useEffect(() => {
    const authenticate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/cookie`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
        const data = await res.json();
        setUserData(data);
        setIsAuthenticated(true);
      } catch {
        // Let top-level login logic handle redirects
      }
    };
    authenticate();
  }, []);

  // If not a service provider, skip this context's logic
  useEffect(() => {
    if (isAuthenticated && userData?.role !== 'service_provider') {
      setIsLoading(false);
    }
  }, [isAuthenticated, userData]);

  // Fetch profile and check completeness for service providers only
  useEffect(() => {
    if (!isAuthenticated || !userData || userData.role !== 'service_provider') return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/serviceprovidersuserid?user_id=${userData.user_id}`,
          { method: 'GET', credentials: 'include' }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const profile = Array.isArray(data) ? data[0] : data;
        setIsProfileComplete(Boolean(profile.business_name && profile.category));
      } catch {
        setIsProfileComplete(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, userData]);

  // Redirect ONCE based on profile completeness for service providers only
  useEffect(() => {
    if (
      isLoading ||
      !isAuthenticated ||
      hasRedirected ||
      userData?.role !== 'service_provider'
    ) {
      return;
    }
    setHasRedirected(true);
    const target = isProfileComplete
      ? '/service-providers'
      : '/service-providers/profile';
    navigate(target, { replace: true });
  }, [isLoading, isAuthenticated, isProfileComplete, hasRedirected, userData, navigate]);

  // Expose a method to mark profile complete after media upload
  const markProfileComplete = useCallback(() => {
    setIsProfileComplete(true);
  }, []);

  // Show nothing while loading or if not authorized yet
  if (!isAuthenticated || isLoading) return null;

  // If not a service provider, render children directly
  if (userData.role !== 'service_provider') {
    return <>{children}</>;
  }

  return (
    <AppContext.Provider
      value={{
        userData,
        markProfileComplete,
        pendingAction,
        setPendingAction,
        actionSuccess,
        setActionSuccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppConsumer = AppContext.Consumer;
export default AppContext;

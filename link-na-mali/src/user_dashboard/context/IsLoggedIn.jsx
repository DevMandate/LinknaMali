import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchEngine } from './SearchEngine';
import { usePriorityDisplay } from './PriorityDisplay';

const LoginContext = createContext();

export const LoginProvider = ({ children }) => {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authCallback, setAuthCallback] = useState(null);
  const [requestLogout, setRequestLogout] = useState(false);
  const [userData, setUserData] = useState(null);
  const [pendingAction, setPendingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const navigate = useNavigate();
  const { setSearchEngine } = useSearchEngine();
  const { setDrawerOpen, setPriorityDisplay } = usePriorityDisplay();

  const getSessionRole = () => {
    const storedData = sessionStorage.getItem("userRole");
    if (storedData) {
      const { role, expiry } = JSON.parse(storedData);
      if (Date.now() < expiry) {
        return role;
      } else {
        sessionStorage.removeItem("userRole");
        return null;
      }
    }
    return null;
  };

  const LoginAdmin = (sessionRole) => {
    if (sessionRole === "general_user") {
      setIsLoggedIn(true);
    } else if (sessionRole === "admin") {
      sessionStorage.removeItem("userRole");
      window.location.href = "https://portal.linknamali.ke/admin-dashboard";
    } else if (sessionRole === "service_provider") {
      sessionStorage.removeItem("userRole");
      window.location.href = "https://portal.linknamali.ke/service-providers";
    }
  };

  useEffect(() => {
    const sessionRole = getSessionRole();
    LoginAdmin(sessionRole);
  }, [authCallback]);

  async function checkAuthStatus() {
    try {
      setSearchEngine(true);
      setAuthLoading(true);

      const response = await fetch("https://api.linknamali.ke/auth/cookie", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await response.json();

      // Account lock check
      if (data?.is_locked === 1 || data?.is_locked === true) {
        setIsLoggedIn(false);
        setUserData(null);
        alert("Your account has been locked. Please contact support.");
        return;
      }

      setUserData(data);

      if (
        data.company_id &&
        data.company_role &&
        data.is_company_admin_approved
      ) {
        sessionStorage.setItem(
          "userRole",
          JSON.stringify({
            role: data.role,
            company_id: data.company_id,
            company_role: data.company_role,
            expiry: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
          })
        );

        // 🧠 Store inviter’s ID for dashboard context
        const redirectId = data?.redirect_owner_id || data?.user_id;
        sessionStorage.setItem("dashboardOwnerId", redirectId);

        setIsLoggedIn(true);
        navigate("/user-dashboard"); // No need to pass ID in URL
        return;
      }


      // Continue with default role-based routing
      if (data.role === "general_user") {
        setIsLoggedIn(true);
      } else if (data.role === "super_admin" || data.role === "admin") {
        const sessionRole = getSessionRole();
        if (!sessionRole) {
          navigate(`/admin-select/${data.role}/${data.first_name}-${data.last_name}`);
        } else {
          LoginAdmin(sessionRole);
        }
      } else if (data.role === "service_provider") {
        window.location.href = "https://portal.linknamali.ke/service-providers";
      } else {
        setUserData(null);
        window.location.href = "https://portal.linknamali.ke/user-dashboard";
      }

    } catch (error) {
      console.error("Authentication error:", error);
      const storedData = sessionStorage.getItem("userRole");
      if (storedData) {
        navigate("/login");
      }
    } finally {
      setSearchEngine(false);
      setAuthLoading(false);
    }
  }


  const logout = async () => {
    try {
      setSearchEngine(true);

      const response = await fetch("https://api.linknamali.ke/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        sessionStorage.removeItem("userRole");
        setDrawerOpen(false);
        setIsLoggedIn(false);
        setAuthSuccess(false);
        setAuthCallback(false);
        setUserData(null);
        setPriorityDisplay(null);
        navigate('/');
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSearchEngine(false);
    }
  };

  useEffect(() => {
    checkAuthStatus(); // Always check at mount or on authSuccess
  }, [authSuccess]);

  useEffect(() => {
    if (requestLogout) {
      logout();
      setRequestLogout(false);
    }
  }, [requestLogout]);

  return (
    <LoginContext.Provider value={{
      isLoggedIn,
      userData,
      setRequestLogout,
      pendingAction,
      setPendingAction,
      actionSuccess,
      setActionSuccess,
      authSuccess,
      setAuthSuccess,
      setAuthCallback,
      authLoading,
    }}>
      <LoadingScreen isLoggedIn={isLoggedIn} />
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => {
  return useContext(LoginContext);
};

import { GridLoader } from "react-spinners";

const LoadingScreen = ({ isLoggedIn }) => {
  const [isVisible, setIsVisible] = useState(true);

  function displayLoadingScreen() {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }

  useEffect(() => {
    displayLoadingScreen();
  }, []);

  useEffect(() => {
    displayLoadingScreen();
  }, [isVisible]);

  useEffect(() => {
    setIsVisible(true);
  }, [isLoggedIn]);

  if (!isVisible || !isLoggedIn) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    }}>
      <GridLoader
        size={25}
        color='var(--text)'
      />
    </div>
  );
};

export default LoadingScreen;
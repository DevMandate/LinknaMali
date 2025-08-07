import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create the context
const AppContext = createContext();

// Helper functions to get and set cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; Max-Age=-99999999;`;
};

// Create the Provider component
export const AppProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const first_name = getCookie('first_name');
    const user_id = getCookie('userId');
    const auth_token = getCookie('authToken');
    if (first_name && user_id && auth_token) {
      setUserName(first_name);
      setUserId(user_id);
      setToken(auth_token);
      setUserData({ id: user_id, first_name, token: auth_token });
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (response) => {
    const { user_info, admin_info, token } = response;
    setIsLoggedIn(true);
    if (user_info) {
      setUserName(`${user_info.first_name} ${user_info.last_name}`);
      setUserId(user_info.id);
      setCookie('first_name', user_info.first_name, 7);
      setCookie('userId', user_info.id, 7);
    } else if (admin_info) {
      setUserName(admin_info.email);
      setUserId('admin');
      setCookie('first_name', admin_info.email, 7);
      setCookie('userId', 'admin', 7);
    }
    setToken(token);
    setCookie('authToken', token, 7);
    setUserData({ id: user_info ? user_info.id : 'admin', first_name: user_info ? user_info.first_name : admin_info.email, token });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setUserId('');
    setToken('');
    setUserProfile(null);
    setUserData(null);
    deleteCookie('first_name');
    deleteCookie('userId');
    deleteCookie('authToken');
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      // Fetch user profile data from backend
      axios.get('/getuserprofile', {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        //setUserProfile(response.data.user_profile); 
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
      });
    }
  }, [isLoggedIn, userId, token]);

  const updateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  async function checkAuthStatus() {
    try {
      const response = await fetch("https://api.linknamali.ke/auth/cookie", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await response.json();
      if (data) {
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setUserData(data);
        }
      } else {
        window.location.href = "https://linknamali.ke";
      }
    } catch (error) {
      console.error("Authentication error:", error.message);
      return null;
    }
  }

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn, userName, setUserName, userId, setUserId, token, handleLogin, handleLogout, userProfile, updateUserProfile, userData, setUserData }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for consuming the context
export const useAppContext = () => {
  return useContext(AppContext);
};

// Update useLogin to include setUserName
export const useLogin = () => {
  const { handleLogin, setIsLoggedIn, setUserName } = useAppContext();
  return { handleLogin, setIsLoggedIn, setUserName };
};

// Export AppProvider as LoginProvider if needed
export const LoginProvider = AppProvider;
export { getCookie, setCookie, deleteCookie };

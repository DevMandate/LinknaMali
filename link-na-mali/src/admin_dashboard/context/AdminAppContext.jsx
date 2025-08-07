import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create the context for admin data
const AdminContext = createContext();

// Helper functions for cookie handling
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

// Provider component to store and manage admin data
export const AdminAppProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [token, setToken] = useState('');
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  // Check cookies for existing admin data on mount
  useEffect(() => {
    const email = getCookie('admin_email');
    const id = getCookie('adminId');
    const authToken = getCookie('adminAuthToken');
    if (email && id /* && authToken if needed */) {
      setAdminEmail(email);
      setAdminId(id);
      setToken(authToken);
      setAdminData({ 
        id, 
        email, 
        token: authToken,
      });
      setIsLoggedIn(true);
    }
  }, []);

  // Function to handle admin login, updated to match API response
  const handleAdminLogin = (response) => {
    const { admin_info } = response;
    if (admin_info) {
      // Update state using keys from the API response
      setIsLoggedIn(true);
      setAdminEmail(admin_info.email);
      setAdminId(admin_info.user_id); // Note: API returns user_id, not id
      // Optionally, if you have a token, you can set it; if not, remove the token requirement
      setToken(admin_info.token || '');
      // Save values in cookies if needed
      setCookie('admin_email', admin_info.email, 7);
      setCookie('adminId', admin_info.user_id, 7);
      if (admin_info.token) {
        setCookie('adminAuthToken', admin_info.token, 7);
      }
      // Set the adminData state with the full response
      setAdminData({
        id: admin_info.user_id,
        firstName: admin_info.first_name,
        lastName: admin_info.last_name,
        email: admin_info.email,
        role: admin_info.role,
        profilePicUrl: admin_info.profile_pic_url,
        token: admin_info.token || '',
      });
    }
  };

  // Function to handle admin logout
  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    setAdminEmail('');
    setAdminId('');
    setToken('');
    setAdminData(null);
    deleteCookie('admin_email');
    deleteCookie('adminId');
    deleteCookie('adminAuthToken');
    navigate('/admin-dashboard'); // Navigate to /admin-dashboard on logout
  };

  // Example: Check admin auth status from API endpoint
  async function checkAdminAuthStatus() {
    try {
      const response = await fetch("https://api.linknamali.ke/auth/cookie", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate admin");
      }

      const data = await response.json();
      console.log("Admin auth API response:", data); // Debug: see the API response
      
      if (data && data.role === 'admin') {
        if (!adminData) {
          // Note: Since the API doesn't return a token, we pass the data as admin_info only
          handleAdminLogin({ admin_info: data });
        }
      } else {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error("Admin authentication error:", error.message);
      navigate('https://linknamali.ke');
    }
  }

  // Check admin auth status on mount
  useEffect(() => {
    checkAdminAuthStatus();
  }, []);

  return (
    <AdminContext.Provider value={{
      isLoggedIn,
      adminEmail,
      adminId,
      token,
      adminData,
      handleAdminLogin,
      handleAdminLogout,
      setAdminData
    }}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook for consuming admin context
export const useAdminAppContext = () => {
  return useContext(AdminContext);
};

export { getCookie, setCookie, deleteCookie };

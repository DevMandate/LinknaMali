import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaSignOutAlt, FaBars, FaTimes, FaUserCircle, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Notifications from './notifications/Notifications';
import logo from '../assets/images/Linknamali_main.png';

const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

const Header = ({ toggleSidebar = () => {} }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const logoutTimer = useRef(null);
  const profileMenuRef = useRef(null);
  const notifRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(handleAutoLogout, AUTO_LOGOUT_TIME);
  }, []);

  const handleAutoLogout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('https://api.linknamali.ke/auth/logout', { method: 'POST', credentials: 'include' });
      alert('Logged out due to inactivity.');
      localStorage.clear();
      window.location.replace('https://linknamali.ke');
    } catch (err) {
      setError('Error during auto-logout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to log out?')) {
      setLoading(true);
      fetch('https://api.linknamali.ke/auth/logout', { method: 'POST', credentials: 'include' })
        .then(() => {
          alert('Logout success...');
          localStorage.clear();
          window.location.replace('https://linknamali.ke');
        })
        .catch(err => setError('Error during logout: ' + err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  // Close profile or notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inactivity timer
  useEffect(() => {
    resetTimer();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [resetTimer]);

  const handleSidebarToggle = () => {
    setSidebarOpen(prev => !prev);
    toggleSidebar();
  };

  return (
    <header
      className="fixed top-0 left-0 w-full h-16 sm:h-[100px] z-[1000] flex items-center px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: 'var(--tertiary-color)',
        borderBottom: '3px solid var(--secondary-color)'
      }}
    >
      {/* Sidebar Toggle */}
      <button
        onClick={handleSidebarToggle}
        aria-label="Toggle Sidebar"
        className="mr-4 p-2 rounded focus:outline-none"
        style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}
      >
        {sidebarOpen ? <FaTimes className="text-xl sm:text-2xl" /> : <FaBars className="text-xl sm:text-2xl" />}
      </button>

      {/* Logo */}
      <div onClick={() => navigate('/service-providers/')} className="cursor-pointer mr-4">
        <img
          src={logo}
          alt="Linknamali Logo"
          className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
        />
      </div>

      {/* Title */}
      <h1 className="flex-grow text-center text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'white' }}>
        Service Providers
      </h1>

      {/* Notifications Bell */}
      <div className="relative mr-4" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(prev => !prev)}
          aria-label="Toggle Notifications"
          className="p-2 rounded focus:outline-none"
          style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}
        >
          <FaBell className="text-xl sm:text-2xl" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center bg-[var(--quaternary-color)] text-white">
              {notificationCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <Notifications
            forceOpen={true}
            onClose={() => setShowNotifications(false)}
            onCountChange={setNotificationCount}
          />
        )}
      </div>

      {/* Profile & Logout */}
      <div className="relative mr-4" ref={profileMenuRef}>
        <button
          onClick={() => setShowProfileMenu(prev => !prev)}
          aria-label="Profile Menu"
          className="p-2 rounded focus:outline-none"
          style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}
        >
          <FaUserCircle className="text-xl sm:text-2xl" />
        </button>
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-40 rounded shadow-lg py-2" style={{ backgroundColor: 'white', border: '1px solid var(--quaternary-color)' }}>
            <button
              onClick={confirmLogout}
              className="flex items-center w-full px-4 py-2 text-left focus:outline-none hover:bg-quaternary-color-dark"
              style={{ color: 'var(--tertiary-color)' }}
            >
              <FaSignOutAlt className="mr-2" /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Loading & Error */}
      {loading && <span className="text-sm text-white">Logging out...</span>}
      {error && <span className="text-sm ml-2" style={{ color: 'var(--secondary-color)' }}>{error}</span>}
    </header>
  );
};

Header.propTypes = { toggleSidebar: PropTypes.func };
export default Header;

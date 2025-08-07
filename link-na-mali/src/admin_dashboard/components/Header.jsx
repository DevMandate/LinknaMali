// src/admin_dashboard/components/Header.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaSignOutAlt, FaBell, FaBars, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../../assets/images/logo/Linknamali logo.png';
import Notifications from './notifications/Notifications';

// CSS variables defined globally (e.g. in :root)
// --primary-color: #29327E;
// --secondary-color: #35BEBD;
// --tertiary-color: #8080A0;
// --quaternary-color: #C1B3AF;
// --quaternary-color-dark: #A89A95;

const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

const Header = ({ onSidebarToggle = () => {} }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const logoutTimer = useRef(null);
  const profileMenuRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(handleAutoLogout, AUTO_LOGOUT_TIME);
  }, []);

  const handleAutoLogout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('https://api.linknamali.ke/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      alert('Admin logged out due to inactivity.');
      localStorage.clear();
      window.location.replace('https://linknamali.ke');
    } catch (err) {
      setError('Error during auto-logout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await fetch('https://api.linknamali.ke/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.clear();
      window.location.replace('https://linknamali.ke');
    } catch (err) {
      setError('Error during logout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to log out?')) {
      handleLogout();
      alert('Logout success...');
    }
  }, [handleLogout]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-logout on inactivity
  useEffect(() => {
    resetTimer();
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'click',
    ];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      events.forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, [resetTimer]);

  return (
    <header
      className="
        fixed top-0 left-0 w-full
        h-16 sm:h-[100px]
        z-[1000]
        flex flex-wrap justify-between items-center
        px-4 sm:px-6 lg:px-8
      "
      style={{
        backgroundColor: 'var(--tertiary-color)',
        borderBottom: '3px solid var(--secondary-color)',
      }}
    >
      {/* Left group: sidebar toggle + logo */}
      <div className="flex items-center flex-shrink-0 space-x-4">
        <button
          onClick={onSidebarToggle}
          aria-label="Toggle Sidebar"
          className="p-2 rounded focus:outline-none"
          style={{
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
          }}
        >
          <FaBars className="text-xl sm:text-2xl" />
        </button>

        <div
          onClick={() => navigate('/admin-dashboard')}
          className="cursor-pointer"
        >
          <img
            src={logoSrc}
            alt="Logo"
            className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
          />
        </div>
      </div>

      {/* Center: title */}
      <h1
        className="
          text-center
          text-lg sm:text-xl md:text-2xl
          font-bold
          flex-1
          whitespace-nowrap
          overflow-ellipsis
          overflow-hidden
        "
        style={{ color: 'white' }}
      >
        Admin Dashboard
      </h1>

      {/* Right group: notifications + profile/logout */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {/* Notifications */}
        <button
          onClick={() => {
            setShowNotifications((prev) => !prev);
            resetTimer();
          }}
          aria-label="Toggle Notifications"
          className="relative p-2 rounded focus:outline-none"
          style={{
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
          }}
        >
          <FaBell className="text-xl sm:text-2xl" />
          {notificationCount > 0 && (
            <span
              className="
                absolute -top-1 -right-1
                text-xs rounded-full w-5 h-5
                flex items-center justify-center
              "
              style={{
                backgroundColor: 'var(--quaternary-color)',
                color: 'white',
              }}
            >
              {notificationCount}
            </span>
          )}
        </button>

        {/* Profile & Logout */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              resetTimer();
            }}
            aria-label="Profile Menu"
            className="p-2 rounded focus:outline-none"
            style={{
              backgroundColor: 'var(--secondary-color)',
              color: 'white',
            }}
          >
            <FaUserCircle className="text-xl sm:text-2xl" />
          </button>

          {showProfileMenu && (
            <div
              className="
                absolute right-0 mt-2 w-40
                rounded shadow-lg py-2
              "
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--quaternary-color)',
              }}
            >
              <button
                onClick={confirmLogout}
                className="
                  flex items-center w-full px-4 py-2
                  text-left focus:outline-none
                "
                style={{ color: 'var(--tertiary-color)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--quaternary-color-dark)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'white')
                }
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <span className="text-sm" style={{ color: 'white' }}>
          Logging out...
        </span>
      )}
      {error && (
        <span
          className="text-sm ml-2"
          style={{ color: 'var(--secondary-color)' }}
        >
          {error}
        </span>
      )}

      <Notifications
        forceOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onCountChange={setNotificationCount}
      />
    </header>
  );
};

Header.propTypes = {
  onSidebarToggle: PropTypes.func,
};

export default Header;

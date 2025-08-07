import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from '../../context/AppContext';

const Logout = ({ idleTimeout = 600000 }) => {
  const { setUserData } = useAppContext();
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // stable logout function
  const doLogout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await fetch('https://api.linknamali.ke/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUserData(null);
      // Redirect only on successful logout
      window.location.replace('https://linknamali.ke');
    } catch (err) {
      console.error('Logout API error:', err);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  // reset idle timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, idleTimeout);
  }, [doLogout, idleTimeout]);

  useEffect(() => {
    // events that count as “activity”
    const events = [
  'click', 'scroll', 'keydown', 
  'mousemove', 'drag',
  'touchstart', 'touchmove'
];

    const debouncedResetTimer = debounce(resetTimer, 300); // Debounce for performance
    events.forEach(e => window.addEventListener(e, debouncedResetTimer));
    // start the first countdown
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, debouncedResetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // Confirm logout before proceeding
  const confirmLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      doLogout();
    }
  };

  return (
    <div
      className={`py-2 px-4 hover:bg-gray-100 cursor-pointer flex items-center space-x-2 ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={!loading ? confirmLogout : null}
    >
      <FontAwesomeIcon icon={faSignOutAlt} className="text-red-500" />
      <span className="text-red-500 font-medium">Logout</span>
      {loading && (
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="ml-2 text-red-500"
          aria-live="polite"
        />
      )}
      {error && (
        <div className="error-message text-red-600" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
};

export default Logout;

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
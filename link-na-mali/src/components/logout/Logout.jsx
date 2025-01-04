import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Logout = () => {
  const handleLogout = () => {
    // logout logic
    console.log('User logged out');
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-2 py-2 rounded transition duration-200 ease-in-out flex items-center bg-red-600 hover:bg-red-700 text-white"
    >
      <FontAwesomeIcon icon={faSignOutAlt} className="mr-4" />
      <span>Logout</span>
    </button>
  );
};

export default Logout;
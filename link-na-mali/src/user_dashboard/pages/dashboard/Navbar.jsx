import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faUserCircle } from '@fortawesome/free-solid-svg-icons';

// Components & Assets
import Notification from '../../components/notification/Notification';
import Logout from '../../components/logout/Logout';
import logo from '../../../assets/Linknamali_main.png';
import { useAppContext } from '../../context/AppContext';

const Navbar = ({ toggleSidebar, userData }) => {
  const navigate = useNavigate();
  const { userName } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const handleLogoClick = () => navigate('/user-dashboard');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-tertiary-color shadow-md p-4 flex items-center justify-between h-16">
      {/* Left Side: Sidebar Toggle & Logo */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-2xl mr-4 focus:outline-none lg:hidden bg-secondary-color rounded-full p-2"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleLogoClick}
        >
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Right Side: Notification & User Dropdown */}
      <div className="flex items-center space-x-4 relative">
        <Notification userId={userData?.user_id} iconClassName="text-white" />
        
        {/* Always mount the Logout component (hidden) so idle-timer logic runs */}
        <div style={{ display: 'none' }}>
          <Logout />
        </div>

        <div
          className="flex items-center cursor-pointer"
          onClick={toggleDropdown}
        >
          <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-white" />
          <span className="text-lg font-medium text-black ml-2">{userName}</span>
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <Logout />
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

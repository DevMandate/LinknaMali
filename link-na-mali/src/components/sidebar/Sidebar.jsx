import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboard,
  faUsers,
  faWarehouse,
  faChartLine, 
  faTachometerAlt,
  faCog,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isOpen }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out bg-[#29327E] text-white w-64 md:w-64 lg:w-64 shadow-lg z-50`}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-[#C1B3AF]">
        <div className="flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/40"
            alt="Logo"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-lg font-bold text-white">Merime Solutions</h1>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-4">
        <ul className="space-y-2">
          {[
            { label: 'Dashboard', icon: faTachometerAlt, link: '/' },
            { label: 'Property Management', icon: faWarehouse, link: '/property-management' },
            { label: 'Lead Management', icon: faUsers, link: '/lead-management' },
            { label: 'Reports & Analytics', icon: faChartLine, link: '/reports' },
            { label: 'Support', icon: faQuestionCircle, link: '/support' },
            { label: 'Settings', icon: faCog, link: '/settings' },
          ].map((item) => (
            <li key={item.label}>
              <Link
                to={item.link}
                className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md"
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
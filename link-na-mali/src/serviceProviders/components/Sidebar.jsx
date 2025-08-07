import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faBoxOpen,
  faCalendarAlt,
  faWallet,
  faChartLine,
  faFileAlt,
  faStar,
  faLifeRing,
  faBullhorn,
  faCog,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

const navStructure = [
  { label: 'Dashboard', icon: faTachometerAlt, link: '/service-providers/' },
  {
    label: 'Operations',
    icon: faBoxOpen,
    children: [
      { label: 'Enquiries', icon: faBoxOpen, link: '/service-providers/orders' },
      { label: 'Calendar', icon: faCalendarAlt, link: '/service-providers/calendar' },
      { label: 'Bookings', icon: faCalendarAlt, link: '/service-providers/bookings' },
    ],
  },
  {
    label: 'Finance & Analytics',
    icon: faChartLine,
    children: [
      { label: 'Payments', icon: faWallet, link: '/service-providers/payments' },
      { label: 'Analytics', icon: faChartLine, link: '/service-providers/analytics' },
      { label: 'Reports', icon: faFileAlt, link: '/service-providers/reports' },
    ],
  },
  {
    label: 'Support',
    icon: faLifeRing,
    children: [
      { label: 'Reviews', icon: faStar, link: '/service-providers/reviews' },
      { label: 'Tickets', icon: faLifeRing, link: '/service-providers/messages' },
    ],
  },
  { label: 'Marketing', icon: faBullhorn, link: '/service-providers/marketing' },
  { label: 'Settings', icon: faCog, link: '/service-providers/settings' },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [openMenus, setOpenMenus] = useState({});
  const handleToggle = (label) =>
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const buttonClasses =
    'flex items-center justify-between w-full space-x-2 p-2 rounded-md text-white bg-transparent hover:text-gray-300 hover:bg-opacity-10 focus:outline-none';
  const linkClasses =
    'flex items-center justify-start w-full space-x-2 p-2 rounded-md text-white bg-transparent hover:text-gray-300 hover:bg-opacity-10 focus:outline-none';

  return (
    <div
      className={`sidebar-container fixed top-16 sm:top-[100px] left-0 z-50 transform bg-primary-color w-56 shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ height: 'calc(100vh - 4rem)', '--header-height': '4rem' }}
    >
      <nav className="overflow-y-auto h-full px-2 py-4">
        <ul className="space-y-2">
          {navStructure.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  <button onClick={() => handleToggle(item.label)} className={buttonClasses}>
                    <span className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </span>
                    <FontAwesomeIcon icon={openMenus[item.label] ? faChevronUp : faChevronDown} />
                  </button>
                  {openMenus[item.label] && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((sub) => (
                        <li key={sub.label}>
                          <NavLink
                            to={sub.link}
                            className={linkClasses}
                            onClick={toggleSidebar}
                          >
                            <FontAwesomeIcon icon={sub.icon} />
                            <span>{sub.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.link}
                  end={item.link === '/service-providers/'}
                  className={linkClasses}
                  onClick={toggleSidebar}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
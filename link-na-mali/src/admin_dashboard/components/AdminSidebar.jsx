import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCogs,
  FaUsers,
  FaWrench,
  FaHeadset,
  FaAd,
  FaChartBar,
  FaPlus,
  FaMoneyCheckAlt,
  FaMoneyBillWave,
} from 'react-icons/fa';

const AdminSidebar = ({ isOpen = false, onToggle = () => { } }) => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const linkClass = "flex items-center p-3 rounded-md transition-all duration-200 hover:bg-opacity-20 hover:bg-white";

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 left-0 h-screen bg-[#29327E] text-white shadow-xl z-40 transition-transform duration-300 w-64 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="h-32 bg-[#29327E] sticky top-0 z-10" /> {/* Header spacer */}
      <div className="px-4 pb-8 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
        <ul className="space-y-2">
          <li>
            <Link to="/admin-dashboard" className={linkClass}>
              <FaTachometerAlt className="mr-3 text-xl" /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/AdminPropertyManagement" className={linkClass}>
              <FaWrench className="mr-3 text-xl" /> Property Management
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/UserManagement" className={linkClass}>
              <FaUsers className="mr-3 text-xl" /> User Management
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/AdminSupport" className={linkClass}>
              <FaHeadset className="mr-3 text-xl" /> Support
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/adminadscenter" className={linkClass}>
              <FaAd className="mr-3 text-xl" /> Ads Center
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/financialanalytics" className={linkClass}>
              <FaChartBar className="mr-3 text-xl" /> Financial Analytics
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/Payouts" className={linkClass}>
              <FaMoneyBillWave className="mr-3 text-xl" /> Payouts
            </Link>
          </li>
          <li>
            <Link to="/admin-dashboard/AdminNewListings" className={linkClass}>
              <FaPlus className="mr-3 text-xl" /> New Listings
            </Link>
          </li>

          <li>
            <Link to="/admin-dashboard/AdminNewBookings" className={linkClass}>
              <FaMoneyCheckAlt className="mr-3 text-xl" /> Booking Management
            </Link>
          </li>

          {/* Settings moved to bottom */}
          <li className="mt-auto">
            <Link to="/admin-dashboard/AdminSettings" className={linkClass}>
              <FaCogs className="mr-3 text-xl" /> Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSidebar;

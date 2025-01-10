import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import SettingsPage from '../../components/settings/Settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faUserCircle, faSignOutAlt, faClipboard, faQuestionCircle, faBuilding, faDollarSign, faHome } from '@fortawesome/free-solid-svg-icons';
import Bookings from '../../components/bookings';
import Inquiries from '../../components/inquiries';
import VacantListings from '../../components/vacant';
import SoldListings from '../../components/sold';
import RentedListings from '../../components/rented';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ userName = 'User' }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [activeSetting, setActiveSetting] = useState(null);
  const location = useLocation();

  const renderSection = () => {
    switch (activeSection) {
      case 'bookings':
        return <Bookings />;
      case 'inquiries':
        return <Inquiries />;
      case 'vacantListings':
        return <VacantListings />;
      case 'soldListings':
        return <SoldListings />;
      case 'rentedListings':
        return <RentedListings />;
      default:
        return null;
    }
  };

  const sections = [
    { label: 'Bookings', key: 'bookings', icon: faClipboard },
    { label: 'Inquiries', key: 'inquiries', icon: faQuestionCircle },
    { label: 'Vacant Listings', key: 'vacantListings', icon: faBuilding },
    { label: 'Sold Listings', key: 'soldListings', icon: faDollarSign },
    { label: 'Rented Listings', key: 'rentedListings', icon: faHome },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 15000, 17000, 13000, 16000, 18000],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `$${tooltipItem.raw.toLocaleString()}`,
        },
      },
    },
  };

  const isNestedRoute = location.pathname !== '/';

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setActiveSetting={setActiveSetting} />
      <div className={`flex-grow p-4 md:p-6 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-black focus:outline-none">
              <FontAwesomeIcon icon={faBars} className="text-2xl md:text-3xl" />
            </button>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-0 text-black">Welcome, {userName}!</h2>
          </div>
          <div className="flex items-center space-x-4">
            <FontAwesomeIcon icon={faUserCircle} className="text-2xl md:text-3xl text-gray-600" />
            <span className="text-lg font-medium text-black">{userName}</span>
            <button className="text-red-500 hover:text-red-700">
              <FontAwesomeIcon icon={faSignOutAlt} className="text-xl md:text-2xl" />
            </button>
          </div>
        </header>

        {!isNestedRoute && !activeSection && !activeSetting && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sections.map((section) => (
                <div
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="cursor-pointer bg-white shadow-lg rounded-lg p-4 md:p-6 flex items-center space-x-4 transition duration-200 ease-in-out transform hover:scale-105 hover:bg-blue-100"
                >
                  <FontAwesomeIcon icon={section.icon} className="text-2xl md:text-3xl text-blue-500" />
                  <span className="text-lg md:text-xl font-semibold text-black">{section.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <h2 className="text-xl md:text-2xl font-semibold text-black">Yearly Recap Report Revenue Bar Graph</h2>
              <div style={{ height: '400px', width: '100%' }} className="bg-white shadow-lg rounded-lg p-4 md:p-6 mt-4">
                <Bar
                  data={chartData}
                  options={chartOptions}
                  aria-label="Bar chart showing yearly revenue recap"
                  role="img"
                />
              </div>
            </div>
          </>
        )}

        {activeSection && (
          <div className="mt-8">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Back to Dashboard
            </button>
            {renderSection()}
          </div>
        )}

        {activeSetting && (
          <div className="mt-8">
            <button
              onClick={() => setActiveSetting(null)}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Back to Dashboard
            </button>
            <SettingsPage activeSetting={activeSetting} />
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
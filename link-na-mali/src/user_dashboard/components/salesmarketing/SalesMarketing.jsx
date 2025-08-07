import React from 'react';
import { FaChartLine, FaBullhorn, FaUserPlus, FaEnvelope, FaCogs } from 'react-icons/fa';

const SalesMarketing = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-2xl text-white shadow-lg" style={{ backgroundColor: 'var(--primary-color)' }}>
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 flex items-center">
          <FaChartLine className="mr-3" /> Sales &amp; Marketing Dashboard
        </h2>
        <p className="text-base sm:text-lg">
          Analyze and optimize your sales and marketing strategies in real-time.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <button className="w-full sm:w-auto text-white py-3 px-6 rounded-xl" style={{ backgroundColor: 'var(--secondary-color)' }}>
          <FaBullhorn className="mr-2" /> Create Campaign
        </button>
        {/*
        <button className="w-full sm:w-auto text-white py-3 px-6 rounded-xl" style={{ backgroundColor: 'var(--tertiary-color)' }}>
          <FaUserPlus className="mr-2" /> Add Leads
        </button>
        */}
        <button className="w-full sm:w-auto text-white py-3 px-6 rounded-xl" style={{ backgroundColor: 'var(--quaternary-color)' }}>
          <FaEnvelope className="mr-2" /> Send Newsletter
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white shadow-lg">
          <h3 className="text-xl sm:text-2xl font-semibold">Total Sales</h3>
          <p className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: 'var(--primary-color)' }}>
            KES 1,250,000
          </p>
        </div>

        {/*
        <div className="p-6 rounded-2xl bg-white shadow-lg">
          <h3 className="text-xl sm:text-2xl font-semibold">New Leads</h3>
          <p className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: 'var(--secondary-color)' }}>350</p>
        </div>
        */}

        <div className="p-6 rounded-2xl bg-white shadow-lg">
          <h3 className="text-xl sm:text-2xl font-semibold">Campaigns Running</h3>
          <p className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: 'var(--tertiary-color)' }}>
            8
          </p>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">Recent Campaigns</h3>
        <ul className="space-y-4">
          {['Summer Promo', 'New Product Launch', 'Customer Loyalty'].map((campaign, index) => (
            <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <span>{campaign}</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Status: Active</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Automation Settings */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">Automation Settings</h3>
        <button
          className="w-full sm:w-auto text-white py-2 px-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <FaCogs /> Manage Automation
        </button>
      </div>
    </div>
  );
};

export default SalesMarketing;

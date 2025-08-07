// src/serviceProviders/components/Analytics.jsx
import React from 'react';

const Analytics = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <div className="bg-white p-6 rounded shadow">
        <p className="mb-4">Here you can view your performance analytics.</p>
        {/* Dummy analytics content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-100 p-4 rounded shadow">
            <h2 className="font-semibold">Earnings Trend</h2>
            <p>$4,567 last month</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow">
            <h2 className="font-semibold">Customer Ratings</h2>
            <p>4.5/5 average rating</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

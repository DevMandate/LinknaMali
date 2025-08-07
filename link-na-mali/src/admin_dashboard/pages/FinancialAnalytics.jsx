// src/admin_dashboard/pages/FinancialAnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FinancialAnalyticsPage = () => {
  const [financialData, setFinancialData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    trend: [],
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock API fetch
    setTimeout(() => {
      setFinancialData({
        revenue: 50000,
        expenses: 20000,
        profit: 30000,
        trend: [20000, 22000, 25000, 28000, 30000, 31000, 33000, 35000],
      });
    }, 500);
  }, []);

  const data = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
    datasets: [{
      label: 'Revenue Trend',
      data: financialData.trend,
      fill: false,
      borderColor: 'var(--secondary-color)',
      tension: 0.1
    }]
  };

  const toggleSidebar = () => setIsSidebarOpen(open => !open);
  const handleOverlayClick = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header + Sidebar */}
      <Header onSidebarToggle={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Overlay whenever sidebar is open */}
      {isSidebarOpen && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
        />
      )}

      {/* Main content area */}
      <main
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
        className={`
          flex-1 transition-all duration-300 px-4 py-6 pt-20 z-20
          ${isSidebarOpen ? 'lg:ml-64' : ''}
        `}
      >
          {/* ← Back to Dashboard button */}
        <div className="pt-8 mb-8">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
      </div>

        {/* Page Title */}
        <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-4">
          Financial Analytics
        </h2>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-[var(--secondary-color)] text-white p-4 flex-1 min-w-[200px] rounded-lg text-center">
            <h3 className="text-lg">Total Revenue</h3>
            <p className="text-2xl font-bold">${financialData.revenue}</p>
          </div>
          <div className="bg-[var(--secondary-color)] text-white p-4 flex-1 min-w-[200px] rounded-lg text-center">
            <h3 className="text-lg">Total Expenses</h3>
            <p className="text-2xl font-bold">${financialData.expenses}</p>
          </div>
          <div className="bg-[var(--secondary-color)] text-white p-4 flex-1 min-w-[200px] rounded-lg text-center">
            <h3 className="text-lg">Profit</h3>
            <p className="text-2xl font-bold">${financialData.profit}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Revenue Trend (Last 8 Months)</h3>
          <Line data={data} />
        </div>
      </main>
    </div>
  );
};

export default FinancialAnalyticsPage;

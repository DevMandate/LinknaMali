// src/serviceProviders/components/Dashboard.jsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FaShoppingCart, FaDollarSign, FaCalendarCheck, FaStar, FaPlus, FaFileInvoice } from 'react-icons/fa';

const sampleRevenueData = [
  { day: 'Mon', revenue: 400 },
  { day: 'Tue', revenue: 300 },
  { day: 'Wed', revenue: 500 },
  { day: 'Thu', revenue: 450 },
  { day: 'Fri', revenue: 600 },
  { day: 'Sat', revenue: 700 },
  { day: 'Sun', revenue: 650 },
];

const recentOrders = [ /* ... */ ];
const upcomingAppointments = [ /* ... */ ];

const Dashboard = () => (
  <div className="p-4 sm:p-6 bg-gray-100 min-h-screen space-y-6">
    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Service Providers Dashboard</h1>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[{
        icon: FaShoppingCart,
        label: 'Total Orders',
        value: '123'
      }, {
        icon: FaDollarSign,
        label: 'Revenue',
        value: '$4,567'
      }, {
        icon: FaCalendarCheck,
        label: 'Upcoming Appointments',
        value: '8'
      }, {
        icon: FaStar,
        label: 'Customer Rating',
        value: '4.8'
      }].map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded shadow flex items-center space-x-3 sm:space-x-4">
            <Icon className="text-2xl sm:text-3xl text-primary-color flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>

    {/* Revenue Trend Chart */}
    <div className="bg-white p-4 sm:p-5 rounded shadow">
      <h2 className="text-md sm:text-lg font-semibold mb-3 text-gray-700">Revenue Trend (Last 7 Days)</h2>
      <div className="w-full h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampleRevenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Orders Table */}
      <div className="bg-white p-4 sm:p-5 rounded shadow overflow-x-auto">
        <h2 className="text-md sm:text-lg font-semibold mb-3 text-gray-700">Recent Orders</h2>
        <table className="w-full min-w-[400px] text-left">
          <thead>
            <tr>
              <th className="pb-2 pr-4 text-sm font-medium">Order ID</th>
              <th className="pb-2 pr-4 text-sm font-medium">Customer</th>
              <th className="pb-2 pr-4 text-sm font-medium">Status</th>
              <th className="pb-2 text-sm font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="py-2 pr-4 text-sm sm:text-base">{order.id}</td>
                <td className="py-2 pr-4 text-sm sm:text-base">{order.customer}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{order.status}</span>
                </td>
                <td className="py-2 text-right">
                  <button className="text-primary-color hover:underline text-sm sm:text-base">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upcoming Appointments & Quick Actions */}
      <div className="space-y-6">
        <div className="bg-white p-4 sm:p-5 rounded shadow">
          <h2 className="text-md sm:text-lg font-semibold mb-3 text-gray-700">Upcoming Appointments</h2>
          <ul className="space-y-2 text-sm sm:text-base">
            {upcomingAppointments.map((appt, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{appt.time}</span>
                <span className="font-medium text-gray-800 truncate">{appt.client}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded shadow">
          <h2 className="text-md sm:text-lg font-semibold mb-3 text-gray-700">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center space-x-2 px-3 py-2 bg-primary-color text-white rounded hover:bg-primary-dark text-sm sm:text-base">
              <FaPlus /> <span>New Order</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-primary-color text-white rounded hover:bg-primary-dark text-sm sm:text-base">
              <FaFileInvoice /> <span>Send Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;

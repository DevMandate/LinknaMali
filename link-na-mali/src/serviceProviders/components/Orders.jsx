// src/serviceProviders/components/Orders.jsx
import React from 'react';

const Orders = () => {
  // Dummy order data
  const orders = [
    { id: 1, service: 'Service 1', status: 'Pending' },
    { id: 2, service: 'Service 2', status: 'Confirmed' },
    { id: 3, service: 'Service 3', status: 'Completed' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Order ID</th>
              <th className="px-4 py-2 border">Service</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="px-4 py-2 border">{order.id}</td>
                <td className="px-4 py-2 border">{order.service}</td>
                <td className="px-4 py-2 border">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

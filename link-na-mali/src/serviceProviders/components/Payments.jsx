// src/serviceProviders/components/Payments.jsx
import React from 'react';

const Payments = () => {
  // Dummy payment data
  const payments = [
    { id: 1, amount: '$120', date: '2025-03-25' },
    { id: 2, amount: '$75', date: '2025-03-28' },
    { id: 3, amount: '$200', date: '2025-04-01' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Payment ID</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="px-4 py-2 border">{payment.id}</td>
                <td className="px-4 py-2 border">{payment.amount}</td>
                <td className="px-4 py-2 border">{payment.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;

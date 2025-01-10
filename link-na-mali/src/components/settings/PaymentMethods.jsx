import React from "react";

const PaymentMethods = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-gray-800">Payment Methods</h2>
      <p className="text-gray-600 mb-6">Add, edit, or remove payment methods for faster checkouts.</p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
        Add Payment Method
      </button>
    </div>
  );
};

export default PaymentMethods;
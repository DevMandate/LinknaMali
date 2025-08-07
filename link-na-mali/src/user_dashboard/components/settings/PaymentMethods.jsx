import React, { useState } from "react";

const PaymentMethods = () => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', expiry: '', cvv: '' });

  const handlePaymentMethodChange = (event) => {
    setSelectedMethod(event.target.value);
    if (event.target.value === "mpesa") {
      handleAddMpesa();
    } else if (event.target.value === "visa") {
      handleAddVisa();
    }
  };

  const handleAddMpesa = () => {
    console.log("Mpesa payment method added");
  };

  const handleAddVisa = () => {
    console.log("Visa payment method added");
  };

  return (
    <div className="flex items-start justify-center h-screen pt-10">
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Payment Methods</h2>
        <p className="text-gray-600 mb-6">Add, edit, or remove payment methods for faster checkouts.</p>
        
        {/* Payment Method Selection */}
        <div className="mb-4">
          <label className="mr-4">
            <input
              type="radio"
              value="mpesa"
              checked={selectedMethod === "mpesa"}
              onChange={handlePaymentMethodChange}
            />
            Mpesa
          </label>
          <label>
            <input
              type="radio"
              value="visa"
              checked={selectedMethod === "visa"}
              onChange={handlePaymentMethodChange}
            />
            Visa
          </label>
        </div>

        {/* Mpesa Input */}
        {selectedMethod === 'mpesa' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">M-Pesa Number</label>
            <input
              type="text"
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter your M-Pesa number"
              required
            />
          </div>
        )}

        {/* Visa Card Input */}
        {selectedMethod === 'visa' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Card Number</label>
            <input
              type="text"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Card Number"
              required
            />

            <div className="flex mt-2 space-x-4">
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="MM/YY"
                required
              />

              <input
                type="text"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="CVV"
                required
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethods;

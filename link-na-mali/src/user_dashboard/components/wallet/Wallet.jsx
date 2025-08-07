import React, { useState, useEffect } from "react";
import {
  FaWallet,
  FaArrowDown,
  FaArrowUp,
  FaCreditCard,
  FaLock,
  FaFileDownload,
  FaMobile,
  FaMoneyBillWave,
  FaExchangeAlt,
} from "react-icons/fa";
import axios from "axios";
import PaymentPollingModal from "../ads/PaymentPollingModal";

const Wallet = () => {
  // States for all modals
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [withdrawalAccount, setWithdrawalAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    checkoutRequestId: "",
    merchantRequestId: "",
    phoneNumber: "",
  });
  const [pendingDepositData, setPendingDepositData] = useState(null);

  // Mock user data
  const user = {
    balance: "12,500.00",
    currency: "KES",
    accountNumber: "1234-5678-9101",
    transactions: [
      {
        id: 1,
        type: "Deposit",
        amount: "+5,000",
        date: "2023-10-05",
        status: "Success",
      },
      {
        id: 2,
        type: "Withdrawal",
        amount: "-2,500",
        date: "2023-10-02",
        status: "Pending",
      },
      {
        id: 3,
        type: "Transfer",
        amount: "-1,000",
        date: "2023-09-28",
        status: "Failed",
      },
    ],
    cards: [
      { id: 1, provider: "Visa", lastFour: "1234", expiry: "12/25" },
      { id: 2, provider: "Mastercard", lastFour: "5678", expiry: "08/24" },
    ],
  };

  // M-Pesa payment initiation
  const initiateMpesaPayment = async () => {
    try {
      const paymentPayload = {
        phone: phoneNumber,
        amount: amount,
      };

      const response = await fetch("https://api.linknamali.ke/api/mpesa/stk-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.status}`);
      }

      const data = await response.json();

      // Check if STK push was initiated successfully
      if (data.ResponseCode === "0") {
        // STK push sent successfully to user's phone
        return {
          success: true,
          message:
            "Payment request sent to your phone. Please complete the payment.",
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
        };
      } else {
        // STK push failed
        return {
          success: false,
          message:
            data.errorMessage ||
            data.ResponseDescription ||
            "Payment initiation failed",
        };
      }
    } catch (error) {
      console.error("M-Pesa payment error:", error);
      return {
        success: false,
        message: "Failed to initiate payment. Please try again.",
      };
    }
  };

    // Process deposit after successful payment
  const processDepositAfterPayment = async () => {
    try {
      // Success Simulation
      setSuccessMessage("Deposit completed successfully!");
      
      // Reset form and close modal after showing success message
      setTimeout(() => {
        setShowMpesaModal(false);
        setAmount("");
        setPhoneNumber("");
        setSuccessMessage("");
      }, 3000);
      
      return true;
    } catch (error) {
      console.error("Deposit processing error:", error);
      setError("Failed to process deposit. Please contact support.");
      return false;
    }
  };

  // Handler functions
  const handleMpesaDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Store the deposit data for later use after payment
      setPendingDepositData({
        amount: amount,
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString(),
      });

      // Initiate M-Pesa payment
      const paymentResult = await initiateMpesaPayment();

      if (paymentResult.success) {
        // Show payment modal and start polling
        setPaymentData({
          checkoutRequestId: paymentResult.checkoutRequestId,
          merchantRequestId: paymentResult.merchantRequestId,
          phoneNumber: phoneNumber,
        });
        setShowPaymentModal(true);
        setShowMpesaModal(false); // Close the deposit modal
      } else {
        setError(paymentResult.message);
      }
    } catch (error) {
      console.error("M-Pesa deposit error:", error);
      setError("Failed to initiate deposit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);

    if (pendingDepositData) {
      const success = await processDepositAfterPayment(pendingDepositData);
      if (success) {
        setPendingDepositData(null);
      }
    }
  };

  // Handle payment modal close
  const handlePaymentModalClose = (reason) => {
    setShowPaymentModal(false);

    if (reason === "retry") {
      // Retry payment
      const retryPayment = async () => {
        setLoading(true);
        const paymentResult = await initiateMpesaPayment();

        if (paymentResult.success) {
          setPaymentData({
            checkoutRequestId: paymentResult.checkoutRequestId,
            merchantRequestId: paymentResult.merchantRequestId,
            phoneNumber: phoneNumber,
          });
          setShowPaymentModal(true);
        } else {
          setError(paymentResult.message);
          setShowMpesaModal(true); // Show deposit modal again
        }
        setLoading(false);
      };
      retryPayment();
    } else {
      // Cancel - clear pending data and show deposit modal again
      setPendingDepositData(null);
      setShowMpesaModal(true);
      setError("Payment cancelled. Please try again.");
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("https://api.linknamali.ke/withdraw", {
        amount: amount,
        account: withdrawalAccount,
      });

      if (response.status === 200) {
        setSuccessMessage("Withdrawal request submitted successfully");
        setTimeout(() => {
          setShowWithdrawModal(false);
          setAmount("");
          setWithdrawalAccount("");
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("https://api.linknamali.ke/transfer", {
        amount: amount,
        recipient_email: recipientEmail,
      });

      if (response.status === 200) {
        setSuccessMessage("Transfer completed successfully");
        setTimeout(() => {
          setShowTransferModal(false);
          setAmount("");
          setRecipientEmail("");
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  // Modal Components
  const MpesaModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Deposit via M-Pesa</h2>
            <form onSubmit={handleMpesaDeposit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (254...)
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="254700000000"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {successMessage && (
                  <p className="text-green-500 text-sm">{successMessage}</p>
                )}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowMpesaModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const WithdrawModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Withdraw Funds</h2>
        <form onSubmit={handleWithdraw}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Account
              </label>
              <input
                type="text"
                value={withdrawalAccount}
                onChange={(e) => setWithdrawalAccount(e.target.value)}
                placeholder="Enter account number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && (
              <p className="text-green-500 text-sm">{successMessage}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const TransferModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Transfer Funds</h2>
        <form onSubmit={handleTransfer}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient email"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && (
              <p className="text-green-500 text-sm">{successMessage}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Transfer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 bg-gray-100 min-h-screen">
      <div
        className="p-6 sm:p-8 rounded-2xl text-white shadow-lg"
        style={{ backgroundColor: "var(--primary-color)" }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center">
          <FaWallet className="mr-3" /> Wallet Overview
        </h2>
        <p className="text-lg sm:text-xl mb-2">
          Balance: {user.currency} {user.balance}
        </p>
        <p className="text-sm">Account Number: {user.accountNumber}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <button
          className="w-full sm:w-auto text-white py-3 px-6 rounded-xl flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--secondary-color)" }}
          onClick={() => setShowMpesaModal(true)}
        >
          <FaMobile /> Deposit via M-Pesa
        </button>
        <button
          className="w-full sm:w-auto text-white py-3 px-6 rounded-xl flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--tertiary-color)" }}
          onClick={() => setShowWithdrawModal(true)}
        >
          <FaMoneyBillWave /> Withdraw
        </button>
        <button
          className="w-full sm:w-auto text-white py-3 px-6 rounded-xl flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--quaternary-color)" }}
          onClick={() => setShowTransferModal(true)}
        >
          <FaExchangeAlt /> Transfer
        </button>
      </div>

      {/* Modals */}
      {showMpesaModal && <MpesaModal />}
      {showWithdrawModal && <WithdrawModal />}
      {showTransferModal && <TransferModal />}

      {/* Payment Polling Modal */}
      <PaymentPollingModal
        open={showPaymentModal}
        onClose={handlePaymentModalClose}
        onPaymentSuccess={handlePaymentSuccess}
        checkoutRequestId={paymentData.checkoutRequestId}
        phoneNumber={paymentData.phoneNumber}
      />

      {/* Transaction History */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg overflow-x-auto">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">
          Transaction History
        </h3>
        <div className="divide-y">
          {user.transactions.map((txn) => (
            <div
              key={txn.id}
              className="py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
            >
              <span className="flex items-center gap-3">
                {txn.type === "Deposit" ? (
                  <FaArrowDown style={{ color: "var(--secondary-color)" }} />
                ) : (
                  <FaArrowUp style={{ color: "var(--tertiary-color)" }} />
                )}
                <span>{txn.type}</span>
              </span>
              <span>{txn.amount}</span>
              <span>{txn.date}</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs sm:text-sm ${
                  txn.status === "Success"
                    ? "bg-green-200 text-green-700"
                    : txn.status === "Pending"
                    ? "bg-yellow-200 text-yellow-700"
                    : "bg-red-200 text-red-700"
                }`}
              >
                {txn.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Linked Cards */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">Linked Cards</h3>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {user.cards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl flex-1 flex flex-col justify-between"
              style={{ backgroundColor: "var(--quaternary-color)" }}
            >
              <FaCreditCard className="text-blue-500 mb-3 text-2xl" />
              <p className="text-lg">
                {card.provider} **** {card.lastFour}
              </p>
              <p className="text-sm">Expires: {card.expiry}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">
          Security Settings
        </h3>
        <button
          className="w-full sm:w-auto text-white py-2 px-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          <FaLock /> Enable 2FA
        </button>
      </div>

      {/* Export Transactions */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center">
          <FaFileDownload className="mr-2" /> Export Transactions
        </h3>
        {/* Add export functionality */}
      </div>
    </div>
  );
};

export default Wallet;
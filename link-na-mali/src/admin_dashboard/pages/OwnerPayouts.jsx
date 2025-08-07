import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUser,
  FaHome,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPercentage,
  FaChartLine,
  FaSpinner,
} from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";
import Header from "../components/Header";
import RefundPollingModal from "../components/bookings/PaymentPollingModal";
import { useAdminAppContext } from "../context/AdminAppContext";

const API_BASE = "https://api.linknamali.ke";

const PayoutStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: FaClock },
    processed: { color: "bg-green-100 text-green-800", icon: FaCheckCircle },
    failed: { color: "bg-red-100 text-red-800", icon: FaTimesCircle },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="mr-1" size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const OwnerPayouts = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [currentPayout, setCurrentPayout] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // RefundPollingModal states
  const [payoutPollingModal, setPayoutPollingModal] = useState(false);
  const [currentPayoutBooking, setCurrentPayoutBooking] = useState(null);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalPendingPayouts: 0,
    monthlyPayoutsProcessed: 0,
    commissionEarned: 0,
  });

  const { adminData } = useAdminAppContext();

  const fetchPayoutData = async () => {
    try {
      console.log("Starting fetchPayoutData...");

      // Initialize with empty arrays
      let fetchedPendingPayouts = [];
      let fetchedPayoutHistory = [];

      // Fetch pending payouts with individual error handling
      try {
        console.log("Fetching pending payouts...");
        const pendingResponse = await axios.get(
          `${API_BASE}/bookings/bookings/pending-payouts`,
          {
            headers: {
              Authorization: `Bearer ${adminData?.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Pending payouts success:", pendingResponse);
        fetchedPendingPayouts = pendingResponse.data.data || [];
      } catch (pendingError) {
        console.error("Error fetching pending payouts:", pendingError);
        console.error("Pending payouts URL:", `${API_BASE}/bookings/bookings/pending-payouts`);
      }

      // Fetch payout history with individual error handling
      try {
        console.log("Fetching payout history...");
        const historyResponse = await axios.get(
          `${API_BASE}/bookings/bookings/payout-history`,
          {
            headers: {
              Authorization: `Bearer ${adminData?.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("PAYOUT HISTORY RESPONSE: ", historyResponse);
        fetchedPayoutHistory = historyResponse.data.data || [];
      } catch (historyError) {
        console.error("Error fetching payout history:", historyError);
        console.error("Payout history URL:", `${API_BASE}/bookings/bookings/payout-history`);
      }

      // Set the state with whatever data we managed to fetch
      setPendingPayouts(fetchedPendingPayouts);
      setPayoutHistory(fetchedPayoutHistory);

      // Calculate dashboard stats
      const totalPending = fetchedPendingPayouts.reduce(
        (sum, payout) => sum + (payout.amount_due || 0),
        0
      );

      const monthlyProcessed = fetchedPayoutHistory
        .filter((payout) => {
          const payoutDate = new Date(payout.owner_payout_date);
          const currentDate = new Date();
          return (
            payoutDate.getMonth() === currentDate.getMonth() &&
            payoutDate.getFullYear() === currentDate.getFullYear()
          );
        })
        .reduce((sum, payout) => sum + (payout.owner_amount || 0), 0);

      const totalCommission = fetchedPayoutHistory.reduce(
        (sum, payout) => sum + (payout.platform_amount || 0),
        0
      );

      setDashboardStats({
        totalPendingPayouts: totalPending,
        monthlyPayoutsProcessed: monthlyProcessed,
        commissionEarned: totalCommission,
      });

    } catch (error) {
      console.error("Unexpected error in fetchPayoutData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const showMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const openPayoutModal = (payout) => {
    setCurrentPayout(payout);
    setMpesaPhone("");
    setPayoutModalOpen(true);
  };

  const closePayoutModal = () => {
    setPayoutModalOpen(false);
    setCurrentPayout(null);
    setMpesaPhone("");
    setIsProcessing(false);
  };

  const handleProcessPayout = async (e) => {
    e.preventDefault();
    if (!currentPayout || !mpesaPhone || isProcessing) return;

    setIsProcessing(true);

    try {
      const payload = {
        owner_phone_number: mpesaPhone,
      };

      const response = await fetch(
        `${API_BASE}/bookings/bookings/${currentPayout.booking.id}/payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminData?.token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log("Handle Process Payout DATA: ", data);

      if (response.ok) {
        // Close the payout modal
        closePayoutModal();
        
        // Open polling modal for tracking payout status
        setCurrentPayoutBooking(currentPayout);
        setPayoutPollingModal(true);
        
        showMessage("✅ Payout initiated successfully! Processing via M-Pesa...");
      } else {
        showMessage(`❌ Payout processing failed: ${data.response || "Unknown error occurred"}`);
      }
    } catch (err) {
      console.error("Process payout error:", err);
      showMessage("❌ An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayoutSuccess = (payoutData) => {
    showMessage("✅ Payout processed successfully!");
    setPayoutPollingModal(false);
    setCurrentPayoutBooking(null);
    fetchPayoutData(); // Refresh the payouts list
  };

  const handlePayoutModalClose = () => {
    setPayoutPollingModal(false);
    setCurrentPayoutBooking(null);
    fetchPayoutData(); // Refresh payouts to get updated status
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Header onSidebarToggle={toggleSidebar} />
        {successMessage && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[var(--primary-color)] text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {successMessage}
          </div>
        )}

        <div className="flex-1 p-6 pt-28 bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Payouts Management</h1>

          {/* Dashboard Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Pending Payouts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardStats.totalPendingPayouts)}
                  </p>
                </div>
                <FaClock className="text-3xl text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Payouts Processed
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardStats.monthlyPayoutsProcessed)}
                  </p>
                </div>
                <FaChartLine className="text-3xl text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Commission Earned (10%)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardStats.commissionEarned)}
                  </p>
                </div>
                <FaPercentage className="text-3xl text-blue-500" />
              </div>
            </div>
          </div>

          {/* Pending Payouts Table */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center">
                <FaMoneyBillWave className="mr-2 text-yellow-500" />
                Pending Payouts
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner / Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPayouts.map((payout) => (
                    <tr key={payout.booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payout.booking.user_name || "Unknown Owner"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payout.property?.is_deleted
                                ? "Property Deleted"
                                : "Property Name N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payout.payout_details.owner_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payout.booking.check_in_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(
                            payout.payout_details.platform_amount
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPayoutModal(payout)}
                          className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                        >
                          Process Payout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pendingPayouts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending payouts found.</p>
              </div>
            )}
          </div>

          {/* Payout History Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center">
                <FaCheckCircle className="mr-2 text-green-500" />
                Payout History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner / Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      M-Pesa Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payoutHistory.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payout.owner_name || "Unknown Owner"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payout.property_name || "Property Name N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payout.owner_amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payout.owner_payout_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PayoutStatusBadge status={payout.status} />
                        {payout.failure_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {payout.failure_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {payout.mpesa_transaction_id || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payoutHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No payout history found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout Modal */}
        {payoutModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">
                Process M-Pesa Payout
              </h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p>
                  <strong>Owner:</strong>{" "}
                  {currentPayout?.booking?.user_name || "Unknown Owner"}
                </p>
                <p>
                  <strong>Property:</strong>{" "}
                  {currentPayout?.property?.is_deleted
                    ? "Property Deleted"
                    : currentPayout?.property?.name || "Property Name N/A"}
                </p>
                <p>
                  <strong>Amount:</strong>{" "}
                  {formatCurrency(
                    currentPayout?.payout_details?.owner_amount || 0
                  )}
                </p>
              </div>

              <form onSubmit={handleProcessPayout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="254XXXXXXXXX"
                    required
                    pattern="254[0-9]{9}"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 254XXXXXXXXX (e.g., 254712345678)
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closePayoutModal}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded transition ${isProcessing
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded transition flex items-center ${isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[var(--primary-color)] hover:opacity-90"
                      } text-white`}
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" size={14} />
                        Processing Payout...
                      </>
                    ) : (
                      "Process Payout"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payout Polling Modal */}
        {payoutPollingModal && (
          <RefundPollingModal
            open={payoutPollingModal}
            onClose={handlePayoutModalClose}
            onRefundSuccess={handlePayoutSuccess}
            bookingId={currentPayoutBooking?.booking?.id}
            bookingDetails={currentPayoutBooking}
          />
        )}
      </div>
    </div>
  );
};

export default OwnerPayouts;
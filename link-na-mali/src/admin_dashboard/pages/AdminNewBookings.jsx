import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaUser,
  FaHome,
  FaUsers,
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";
import Header from "../components/Header";
import RefundPollingModal from "../components/bookings/PaymentPollingModal"
import { useAdminAppContext } from "../context/AdminAppContext";

const API_BASE = "https://api.linknamali.ke";
const REFUND_STATUSES = ["all", "pending", "confirmed", "none"];

const RefundStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: FaClock },
    confirmed: { color: "bg-green-100 text-green-800", icon: FaCheckCircle },
    // rejected: { color: "bg-red-100 text-red-800", icon: FaTimesCircle },
    none: { color: "bg-gray-100 text-gray-800", icon: FaMoneyBillWave },
  };

  const config = statusConfig[status] || statusConfig.none;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="mr-1" size={12} />
      {status === 'none' ? 'No Refund' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const BookingStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: FaClock },
    confirmed: { color: "bg-green-100 text-green-800", icon: FaCheckCircle },
    rejected: { color: "bg-red-100 text-red-800", icon: FaTimesCircle },
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

const RefundInfoDisplay = ({ booking }) => {
  if (!booking.refund_status || booking.refund_status === 'none') return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <h5 className="font-medium text-blue-800 flex items-center mb-2">
        <FaMoneyBillWave className="mr-2" />
        Refund Information
      </h5>
      <div className="space-y-1 text-sm">
        <p>
          <strong>Status:</strong> {booking.refund_status}
        </p>
        {booking.refund_amount && (
          <p>
            <strong>Amount:</strong> KSh{" "}
            {parseFloat(booking.refund_amount).toLocaleString()}
          </p>
        )}
        {booking.refund_reason && (
          <p>
            <strong>Reason:</strong> {booking.refund_reason}
          </p>
        )}
        {booking.refund_processed_at && (
          <p>
            <strong>Processed:</strong>{" "}
            {new Date(booking.refund_processed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

const AdminNewBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [refundStatusFilter, setRefundStatusFilter] = useState("all");
  const [expandedBookings, setExpandedBookings] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPollingModal, setRefundPollingModal] = useState(false);
  const [currentRefundBooking, setCurrentRefundBooking] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightBooking = searchParams.get("highlightBooking");
  const { adminData } = useAdminAppContext();

  useEffect(() => {
    console.log("Admin Data:", adminData);
  }, [adminData]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/bookings/getallbookings`);
      const bookingsData = Array.isArray(res.data.data)
        ? res.data.data
          .map((item) => item.booking)
          .filter((booking) => booking && booking.id)
        : [];
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (highlightBooking && bookings.length) {
      const el = document.getElementById(`booking-${highlightBooking}`);
      if (el) {
        el.classList.add("highlight-animation");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightBooking, bookings]);

  const showMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleExpand = (id) =>
    setExpandedBookings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleCancelBooking = async (bookingId) => {
    try {
      if (!bookingId) {
        showMessage("❌ Invalid booking ID");
        return;
      }

      const payload = { booking_id: bookingId };

      const resp = await axios.put(
        `${API_BASE}/bookings/bookings/${bookingId}/confirm_cancel`,
        payload
      );

      if (resp.status === 200 && resp.data) {
        const { response, refund_info } = resp.data;

        // Check if booking was actually cancelled
        if (refund_info?.booking_status === "rejected") {
          showMessage("❌ Booking cancellation was rejected");
          return;
        }

        // Find the booking details for the modal
        const bookingDetails = bookings.find((b) => b.id === bookingId);

        // Open refund polling modal
        setCurrentRefundBooking(bookingDetails);
        setRefundPollingModal(true);

        // Show initial success message
        showMessage(`✅ Cancellation initiated. Processing refund...`);
      } else {
        showMessage("❌ Cancellation failed - unexpected response");
      }
    } catch (err) {
      console.error(
        "Booking cancellation error:",
        err.response?.data || err.message
      );

      const errorMsg =
        err.response?.status === 500
          ? "❌ Server error - please try again later"
          : err.response?.data?.response || "❌ Cancellation failed!";

      showMessage(errorMsg);
    }
  };

  const handleRefundSuccess = (refundData) => {
    showMessage("✅ Refund processed successfully!");
    setRefundPollingModal(false);
    setCurrentRefundBooking(null);
    fetchBookings(); // Refresh the bookings list
  };

  const handleRefundModalClose = () => {
    setRefundPollingModal(false);
    setCurrentRefundBooking(null);
    fetchBookings(); // Refresh bookings to get updated status
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn && !checkOut) return "Not specified";
    if (!checkOut) return `From ${formatDate(checkIn)}`;
    if (!checkIn) return `Until ${formatDate(checkOut)}`;
    return `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
  };

  // Filter bookings by refund status
  const filteredBookings = bookings.filter((booking) => {
    // Refund status filter
    const refundStatusMatch = refundStatusFilter === "all" ||
      (booking.refund_status || 'none') === refundStatusFilter;

    // Exclude deleted bookings
    const notDeleted = !booking.is_deleted;

    return refundStatusMatch && notDeleted;
  });

  const getFilteredBookingsCount = () => {
    return {
      total: filteredBookings.length,
      pending: filteredBookings.filter(b => (b.refund_status || 'none') === 'pending').length,
      confirmed: filteredBookings.filter(b => (b.refund_status || 'none') === 'confirmed').length,
      rejected: filteredBookings.filter(b => (b.refund_status || 'none') === 'rejected').length,
      none: filteredBookings.filter(b => (b.refund_status || 'none') === 'none').length,
    };
  };

  const counts = getFilteredBookingsCount();

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex" id="pageRef">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Header onSidebarToggle={toggleSidebar} />
        {successMessage && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[var(--primary-color)] text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {successMessage}
          </div>
        )}
        <div className="flex-1 p-6 pt-28 bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Booking Management</h1>

          {/* Results Summary */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="text-sm text-gray-600">
              Showing {counts.total} bookings - Pending: {counts.pending}, Confirmed: {counts.confirmed}, No Refund: {counts.none}
            </div>
          </div>

          {/* Refund Status Filter Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            {REFUND_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setRefundStatusFilter(status)}
                className={`px-5 py-2 rounded transition ${refundStatusFilter === status
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-[var(--quaternary-color)] text-black hover:bg-[var(--quaternary-color-dark)]"
                  }`}
              >
                {status === 'none' ? 'No Refund' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Bookings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const expanded = expandedBookings.includes(booking.id);

              return (
                <div
                  key={booking.id}
                  id={`booking-${booking.id}`}
                  className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-blue-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Booking #{booking.id.slice(-8)}
                    </h2>
                    <div className="flex flex-col gap-1">
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FaUser className="mr-2 text-gray-500" />
                      <span>
                        <strong>Guest:</strong> {booking.user_name || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaHome className="mr-2 text-gray-500" />
                      <span>
                        <strong>Property:</strong>{" "}
                        {booking.property_type || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-500" />
                      <span>
                        <strong>Dates:</strong>{" "}
                        {formatDateRange(
                          booking.check_in_date,
                          booking.check_out_date
                        )}
                      </span>
                    </div>

                    {booking.number_of_guests && (
                      <div className="flex items-center">
                        <FaUsers className="mr-2 text-gray-500" />
                        <span>
                          <strong>Guests:</strong> {booking.number_of_guests}
                        </span>
                      </div>
                    )}

                    {booking.payment_method && (
                      <div className="flex items-center">
                        <FaCreditCard className="mr-2 text-gray-500" />
                        <span>
                          <strong>Payment:</strong> {booking.payment_method}
                        </span>
                      </div>
                    )}

                    <p>
                      <strong>Created:</strong> {formatDate(booking.created_at)}
                    </p>
                  </div>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                      {booking.special_requests && (
                        <p>
                          <strong>Special Requests:</strong>{" "}
                          {booking.special_requests}
                        </p>
                      )}
                      {booking.purchase_purpose && (
                        <p>
                          <strong>Purpose:</strong> {booking.purchase_purpose}
                        </p>
                      )}
                      {booking.travel_purpose && (
                        <p>
                          <strong>Travel Purpose:</strong>{" "}
                          {booking.travel_purpose}
                        </p>
                      )}
                      {booking.reservation_duration && (
                        <p>
                          <strong>Duration:</strong>{" "}
                          {booking.reservation_duration}
                        </p>
                      )}
                      {booking.payment_option && (
                        <p>
                          <strong>Payment Option:</strong>{" "}
                          {booking.payment_option}
                        </p>
                      )}
                      {booking.payment_period && (
                        <p>
                          <strong>Payment Period:</strong>{" "}
                          {booking.payment_period}
                        </p>
                      )}
                      {booking.pay_later_date && (
                        <p>
                          <strong>Pay Later Date:</strong>{" "}
                          {formatDate(booking.pay_later_date)}
                        </p>
                      )}
                      {booking.number_of_adults && (
                        <p>
                          <strong>Adults:</strong> {booking.number_of_adults}
                        </p>
                      )}
                      {booking.number_of_children && (
                        <p>
                          <strong>Children:</strong>{" "}
                          {booking.number_of_children}
                        </p>
                      )}
                      {booking.number_of_rooms && (
                        <p>
                          <strong>Rooms:</strong> {booking.number_of_rooms}
                        </p>
                      )}
                      {booking.cancellation_message && (
                        <p>
                          <strong>Cancellation Message:</strong>{" "}
                          {booking.cancellation_message}
                        </p>
                      )}
                      <p>
                        <strong>Property ID:</strong> {booking.property_id}
                      </p>
                      <p>
                        <strong>User ID:</strong> {booking.user_id}
                      </p>
                      <p>
                        <strong>Last Updated:</strong>{" "}
                        {formatDate(booking.updated_at)}
                      </p>

                      <RefundInfoDisplay booking={booking} />
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => toggleExpand(booking.id)}
                      className="w-full py-2 bg-[var(--quaternary-color)] text-black rounded-lg hover:bg-[var(--quaternary-color-dark)] transition"
                    >
                      {expanded ? "Show Less" : "Show More"}
                    </button>

                    {booking.refund_status === "pending" && (
                      <>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="w-full py-2 text-white rounded-lg transition"
                          style={{ backgroundColor: "#29327E" }}
                        >
                          Process Cancellation & Refund
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No bookings found matching your refund status filter.
              </p>
            </div>
          )}
        </div>

      </div>
      {refundPollingModal && (
        <RefundPollingModal
          open={refundPollingModal}
          onClose={handleRefundModalClose}
          onRefundSuccess={handleRefundSuccess}
          bookingId={currentRefundBooking?.id}
          bookingDetails={currentRefundBooking}
        />
      )}
    </div>
  );
};

export default AdminNewBookings;
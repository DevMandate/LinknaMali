import React, { useEffect, useState, useContext } from 'react';
import AppContext from '../../../context/ServiceProviderAppContext';

const API_BASE_URL = 'https://api.linknamali.ke';

export default function ServiceBookings() {
  const { userData } = useContext(AppContext);
  const providerUserId = userData?.user_id;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state for rejection reason
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!providerUserId) {
      setLoading(false);
      return;
    }

    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/service_bookings/${providerUserId}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.status}`);
        const data = await res.json();
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [providerUserId]);

  const updateStatus = async (bookingId, status, reason = '') => {
    const payload = { status };
    if (status === 'rejected') {
      payload.rejection_reason = reason;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/updateservicebookings/${bookingId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Failed to update status');
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status, rejection_reason: payload.rejection_reason }
            : b
        )
      );
    } catch {
      alert('Error updating status');
    }
  };

  const openRejectModal = (bookingId) => {
    setCurrentBookingId(bookingId);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!rejectionReason.trim()) {
      return alert('Rejection reason is required');
    }
    updateStatus(currentBookingId, 'rejected', rejectionReason.trim());
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  if (!providerUserId)
    return <p className="mt-6 text-center text-gray-500">Loading user information...</p>;
  if (error)
    return <p className="mt-6 text-center text-red-500">Error: {error}</p>;
  if (loading)
    return <p className="mt-6 text-center text-gray-500">Loading bookings...</p>;
  if (!bookings.length)
    return <p className="mt-6 text-center text-gray-500">No bookings found.</p>;

  return (
    <div className="p-6">
      {/* Rejection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-[#29327E]">Rejection Reason</h2>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 h-24"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 rounded-lg font-medium border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="px-4 py-2 rounded-lg font-medium bg-[#35BEBD] text-white"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mb-4 text-lg font-medium text-[#29327E]">
        Fetched {bookings.length} booking{bookings.length > 1 ? 's' : ''}.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl shadow-md bg-white p-6 flex flex-col justify-between border-l-4 border-[#29327E]"
          >
            <div>
              <h3 className="text-xl font-semibold text-[#29327E] mb-4">
                {b.first_name} {b.last_name}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Booking Date:</span> {new Date(b.booking_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {b.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {b.phone_number}
                </p>
                {b.business_name && (
                  <p>
                    <span className="font-medium">Business:</span> {b.business_name}
                  </p>
                )}
                <p>
                  <span className="font-medium">Additional Info:</span> {b.additional_info || 'None'}
                </p>
              </div>
              <p className="mt-4">
                <span className="font-medium text-[#29327E]">Status:</span>{' '}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
                    b.status === 'confirmed'
                      ? 'bg-[#35BEBD]'
                      : b.status === 'rejected'
                      ? 'bg-gray-400'
                      : 'bg-[#8080A0]'
                  }`}
                >
                  {b.status}
                </span>
              </p>
            </div>
            {b.status === 'pending' && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => updateStatus(b.id, 'confirmed')}
                  className="flex-1 py-2 rounded-lg font-medium transition bg-[#35BEBD] text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(b.id)}
                  className="flex-1 py-2 rounded-lg font-medium transition bg-gray-400 text-white"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

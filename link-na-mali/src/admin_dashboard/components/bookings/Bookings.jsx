import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAppContext } from '../../context/AdminAppContext';

const API_BASE_URL = 'https://api.linknamali.ke';

const BookingDashboard = () => {
  const { adminData } = useAdminAppContext();
  const adminId = adminData?.id;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!adminId) return;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/bookings/getallbookings`);
        setBookings(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [adminId]);

  if (!adminId) return <p className="p-6 text-center text-[var(--primary-color)]">No admin data found.</p>;
  if (loading)    return <p className="p-6 text-center">Loading bookings...</p>;
  if (error)      return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  // Filter bookings by status
  const filteredBookings = bookings.filter(({ booking }) => {
    const status = booking.status || 'pending';
    return filter === 'all' || status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-4 text-3xl font-bold text-[var(--primary-color)] text-center sm:text-left">
          Bookings
        </h1>

        {/* Filter Buttons */}
        <div className="flex justify-center sm:justify-start space-x-3 mb-8">
          {['all', 'approved', 'pending', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 
                ${filter === status 
                  ? 'bg-[var(--primary-color)] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-center text-[var(--tertiary-color)]">
            No {filter !== 'all' ? `${filter}` : ''} bookings found.
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map(({ booking }) => {
              const {
                id,
                first_name,
                last_name,
                email,
                phone_number,
                property_type,
                check_in_date,
                check_out_date,
                number_of_adults,
                number_of_children,
                number_of_rooms,
                status = 'pending',
                created_at,
                travel_purpose,
              } = booking;

              const badgeClasses =
                status === 'approved'
                  ? 'bg-[var(--secondary-color)] text-white'
                  : status === 'pending'
                    ? 'bg-[var(--quaternary-color)] text-[var(--quaternary-color-dark)]'
                    : 'bg-red-500 text-white';

              return (
                <div
                  key={id}
                  className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]" />

                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[var(--quaternary-color)] rounded-full flex items-center justify-center text-lg font-semibold text-[var(--primary-color)]">
                      {first_name?.[0]?.toUpperCase() || ''}
                    </div>
                    <div className="ml-4 flex-1">
                      <h2 className="text-xl font-semibold text-gray-800">{first_name} {last_name}</h2>
                      <p className="text-sm text-gray-600 capitalize">{property_type}</p>
                      <p className="text-sm text-[var(--quaternary-color-dark)]">{travel_purpose}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>{status}</span>
                  </div>

                  <p className="text-gray-700 mb-2">Check-in: {new Date(check_in_date).toLocaleDateString()}</p>
                  <p className="text-gray-700 mb-4">Check-out: {new Date(check_out_date).toLocaleDateString()}</p>

                  <p className="text-sm text-gray-500 mb-2">Email: {email}</p>
                  <p className="text-sm text-gray-500 mb-2">Phone: {phone_number}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Adults: {number_of_adults}, Children: {number_of_children}, Rooms: {number_of_rooms}
                  </p>

                  <p className="text-xs text-gray-400 mt-auto">Booked: {new Date(created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDashboard;
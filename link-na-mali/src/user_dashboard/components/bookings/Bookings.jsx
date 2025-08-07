import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import BookingDetails from './BookingDetails';
import { useLocation, useNavigate } from 'react-router-dom';

const Bookings = () => {
    const { userData } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noBookings, setNoBookings] = useState(false);
    const [filter, setFilter] = useState('All');
    const [modal, setModal] = useState({ isOpen: false, bookingId: null, action: '', reason: '' });
    const [reasonError, setReasonError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        if (!userData || !userData.user_id) {
            setError('User not found');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await axios.get(`https://api.linknamali.ke/allbookings/${userData.user_id}`);
                
                if (!response.data || !response.data.bookings || response.data.bookings.length === 0) {
                    setNoBookings(true);
                    return;
                }

                console.log('Bookings:', response.data.bookings);
                setBookings(response.data.bookings);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                
                if (error.response) {
                    console.error('Error response:', error.response);
                    if (error.response.status === 404) {
                        setNoBookings(true);
                    } else if (error.response.status === 500 && error.response.data?.message.includes('Table')) {
                        setError('There is a database error. Please contact support.');
                    } else {
                        setError(error.response.data?.message || 'Failed to fetch bookings.');
                    }
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    setError('No response from server. Please try again later.');
                } else {
                    console.error('Request error:', error.message);
                    setError('An unexpected error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    useEffect(() => {
        if (location.state && location.state.bookingId && bookings.length > 0) {
            const element = document.getElementById(`booking-${location.state.bookingId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.animation = 'pulseHighlight 10s ease-in-out infinite';
                element.style.border = '2px solid #007bff';
                setTimeout(() => {
                    element.style.animation = '';
                    element.style.border = '';
                }, 10000);
            }
        }
    }, [location.state, bookings]);

    const handleApprove = async (bookingId) => {
        try {
            const response = await axios.put(`https://api.linknamali.ke/updatebookings`, { booking_id: bookingId, action: 'confirm' });
            if (response.status === 200) {
                setBookings(bookings.map(item => item.id === bookingId ? { ...item, status: 'confirmed' } : item));
                alert('Booking approved successfully!');
            } else {
                alert('Failed to approve booking.');
            }
        } catch (error) {
            console.error('Error approving booking:', error);
            alert('An error occurred while approving the booking.');
        }
    };

    const handleReject = async (bookingId, reason) => {
        try {
            const response = await axios.put(`https://api.linknamali.ke/updatebookings`, { booking_id: bookingId, action: 'reject', rejection_message: reason });
            if (response.status === 200) {
                setBookings(bookings.map(item => item.id === bookingId ? { ...item, status: 'rejected' } : item));
                alert('Booking rejected successfully!');
            } else {
                alert('Failed to reject booking.');
            }
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('An error occurred while rejecting the booking.');
        }
    };

    const handleAction = async () => {
        setIsProcessing(true);
        if (modal.action === 'reject' && !modal.reason.trim()) {
            setReasonError('Reason for rejection is required.');
            setIsProcessing(false);
            return;
        }
        setReasonError('');

        if (modal.action === 'approve') {
            await handleApprove(modal.bookingId);
        } else if (modal.action === 'reject') {
            await handleReject(modal.bookingId, modal.reason);
        }

        setModal({ isOpen: false, bookingId: null, action: '', reason: '' });
        setIsProcessing(false);
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setModal({ isOpen: true, bookingId: booking.id, action: 'view' });
    };

    const filteredData = filter === 'All' ? bookings : bookings.filter((item) => item.status.toLowerCase() === filter.toLowerCase());

    if (loading) return <p className="text-gray-700 text-center">Loading bookings...</p>;
    if (error) return <p className="text-red-500 font-semibold">{error}</p>;
    if (noBookings) return <p className="text-gray-600 text-center">You have no bookings at the moment. Please check back later.</p>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-semibold mb-6 text-black text-center">My Bookings</h2>

            {/* NEW: Back Button */}
            <button
    onClick={() => {
        setActiveSection(null); // Reset the section
        navigate("/user-dashboard/property-management");
    }}
    className="mb-4 px-4 py-2 bg-primary-color text-white rounded-lg shadow hover:bg-secondary-color transition"
>
    Back to My Listings
</button>

            {/* Filters */}
            <div className="mb-4 text-gray-700 flex justify-end">
                <label htmlFor="filter" className="block text-gray-700 mb-2 mr-2">Filter by Status:</label>
                <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="p-2 border rounded bg-white shadow"
                >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Bookings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.length > 0 ? (
                    filteredData.map((booking) => (
                        <div
                            key={booking.id}
                            id={`booking-${booking.id}`}
                            className={`relative bg-white shadow-lg rounded-xl p-6 border-l-4 ${
                                booking.status === 'pending'
                                    ? 'border-yellow-500'
                                    : booking.status === 'confirmed'
                                    ? 'border-green-500'
                                    : 'border-red-500'
                            }`}
                        >
                            <h3 className="text-xl font-semibold text-gray-900">Property Name: {booking.title}</h3>
                            <p className="text-gray-700 mt-2">Name: <span className="font-medium">{booking.first_name} {booking.last_name}</span></p>
                            <p className="text-gray-700 mt-2">Property Type: <span className="font-medium">{booking.property_type}</span></p>
                            <p className="text-gray-700 mt-1">Checkin: {booking.check_in_date}</p>
                            <p className="text-gray-700 mt-1">Checkout: {booking.check_out_date}</p>
                            <p
                                className={`mt-2 text-sm font-semibold ${
                                    booking.status === 'pending'
                                        ? 'text-yellow-500'
                                        : booking.status === 'confirmed'
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                }`}
                            >
                                Status: {booking.status}
                            </p>

                            {/* Action Buttons */}
                            <div className="mt-4 flex justify-between">
                                {booking.status === 'pending' && (
                                    <>
                                        <button
                                            className="px-4 py-2 text-white bg-primary-color rounded-lg shadow hover:bg-secondary-color transition w-full sm:w-auto"
                                            disabled={isProcessing}
                                            onClick={() => setModal({ isOpen: true, bookingId: booking.id, action: 'approve' })}
                                        >
                                            {isProcessing ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            className="px-4 py-2 text-white bg-quaternary-color rounded-lg shadow hover:bg-secondary-color transition w-full sm:w-auto"
                                            disabled={isProcessing}
                                            onClick={() => setModal({ isOpen: true, bookingId: booking.id, action: 'reject', reason: '' })}
                                        >
                                            {isProcessing ? 'Processing...' : 'Reject'}
                                        </button>
                                    </>
                                )}
                                <a
                                    href="#"
                                    className="text-primary-color underline hover:text-secondary-color transition w-full sm:w-auto"
                                    onClick={() => handleViewDetails(booking)}
                                >
                                    View Details
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-gray-600">
                        You do not have bookings currently.
                    </p>
                )}
            </div>

            {/* Modal */}
            {modal.isOpen && modal.action === 'view' && selectedBooking && (
                <BookingDetails booking={selectedBooking} onClose={() => setModal({ isOpen: false, bookingId: null, action: '', reason: '' })} />
            )}
            {modal.isOpen && modal.action !== 'view' && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p>Are you sure you want to {modal.action} this booking?</p>
                        {modal.action === 'reject' && (
                            <>
                                <textarea
                                    className="w-full p-2 mt-2 border rounded"
                                    placeholder="Reason for rejection"
                                    value={modal.reason}
                                    onChange={(e) => setModal({ ...modal, reason: e.target.value })}
                                />
                                {reasonError && <p className="text-red-500 mt-2">{reasonError}</p>}
                            </>
                        )}
                        <div className="mt-4 flex justify-end">
                            <button className="px-4 py-2 bg-secondary-color text-white rounded mr-2" onClick={() => setModal({ isOpen: false, bookingId: null, action: '', reason: '' })}>Cancel</button>
                            <button className="px-4 py-2 bg-primary-color text-white rounded" onClick={handleAction}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;
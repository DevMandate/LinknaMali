import React from 'react';

const BookingDetails = ({ booking, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6 z-50">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-2xl">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Booking Details</h3>
                <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">Name:</span> {booking.first_name} {booking.last_name}</p>
                    <p className="text-gray-700"><span className="font-medium">Email:</span> {booking.email}</p>
                    <p className="text-gray-700"><span className="font-medium">Property Type:</span> {booking.property_type}</p>
                    <p className="text-gray-700"><span className="font-medium">Checkin:</span> {booking.check_in_date}</p>
                    <p className="text-gray-700"><span className="font-medium">Checkout:</span> {booking.check_out_date}</p>
                    <p className="text-gray-700"><span className="font-medium">Number of Adults:</span> {booking.number_of_adults}</p>
                    <p className="text-gray-700"><span className="font-medium">Number of Children:</span> {booking.number_of_children}</p>
                    <p className="text-gray-700"><span className="font-medium">Number of Guests:</span> {booking.number_of_guests}</p>
                    <p className="text-gray-700"><span className="font-medium">Number of Rooms:</span> {booking.number_of_rooms}</p>
                    <p className="text-gray-700"><span className="font-medium">Special Requests:</span> {booking.special_requests}</p>
                    <p className="text-gray-700"><span className="font-medium">Purchase Purpose:</span> {booking.purchase_purpose}</p>
                    <p className="text-gray-700"><span className="font-medium">Reservation Duration:</span> {booking.reservation_duration}</p>
                    <p className="text-gray-700"><span className="font-medium">Payment Option:</span> {booking.payment_option}</p>
                    <p className="text-gray-700"><span className="font-medium">Payment Period:</span> {booking.payment_period}</p>
                    <p className="text-gray-700"><span className="font-medium">Status:</span> {booking.status}</p>
                    <p className="text-gray-700"><span className="font-medium">Created At:</span> {booking.created_at}</p>
                    {booking.is_cancelled && (
                        <p className="text-gray-700"><span className="font-medium">Cancellation Message:</span> {booking.cancellation_message}</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button className="px-4 py-2 bg-secondary-color text-white rounded hover:bg-secondary-color-dark transition" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;
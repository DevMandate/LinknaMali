import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { useAppContext } from '../../context/AppContext';
import { useLocation } from 'react-router-dom'; // NEW: Import useLocation

Modal.setAppElement('#root');

const Inquiries = () => {
    const { userData } = useAppContext();
    const location = useLocation(); // NEW: Get location from router
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [conversations, setConversations] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noEnquiries, setNoEnquiries] = useState(false);

    useEffect(() => {
        if (!userData || !userData.user_id) {
            setError('User not found');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await axios.get(`https://api.linknamali.ke/getenquiries/${userData.user_id}`);

                if (!response.data || !response.data.enquiries || response.data.enquiries.length === 0) {
                    setNoEnquiries(true);
                    return;
                }

                setInquiries(response.data.enquiries);
            } catch (error) {
                console.error('Error fetching enquiries:', error);

                if (error.response) {
                    console.error('Error response:', error.response);
                    if (error.response.status === 404) {
                        setNoEnquiries(true);
                    } else if (error.response.status === 500 && error.response.data?.message.includes('Table')) {
                        setError('There is a database error. Please contact support.');
                    } else {
                        setError(error.response.data?.message || 'Failed to fetch enquiries.');
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

    // NEW: Auto-scroll and apply transition for the enquiry specified in location.state.inquiryId
    useEffect(() => {
        if (location.state && location.state.inquiryId && inquiries.length > 0) {
            const element = document.getElementById(`inquiry-${location.state.inquiryId}`);
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
    }, [location.state, inquiries]);

    const handleReplyClick = (inquiry) => setSelectedInquiry(inquiry);

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;

        try {
            console.log('Sending reply:', {
                enquiry_id: selectedInquiry.id,
                reply_message: replyMessage
            });

            const response = await axios.post('https://api.linknamali.ke/replyenquiry', {
                enquiry_id: selectedInquiry.id,
                reply_message: replyMessage
            });

            console.log('Response:', response);

            if (response.status === 200) {
                setConversations(prev => ({
                    ...prev,
                    [selectedInquiry.id]: [...(prev[selectedInquiry.id] || []), { sender: 'owner', message: replyMessage }],
                }));

                setReplyMessage('');
                setSelectedInquiry(null);
                alert('Reply sent successfully!');

                // Mark inquiry as resolved
                setInquiries(prev => prev.map(inquiry => 
                    inquiry.id === selectedInquiry.id ? { ...inquiry, resolved: true } : inquiry
                ));
            } else {
                alert('Failed to send reply.');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('An error occurred while sending the reply.');
        }
    };

    const handleCloseInquiry = async (inquiryId) => {
        try {
            // Send resolved status to backend
            await axios.post(`https://api.linknamali.ke/resolveenquiry`, {
                enquiry_id: inquiryId
            });
    
            // Update UI
            setInquiries(prev => 
                prev.map(inquiry => 
                    inquiry.id === inquiryId ? { ...inquiry, resolved: true } : inquiry
                )
            );
        } catch (error) {
            console.error('Error marking as resolved:', error);
            alert('Failed to mark inquiry as resolved. Please try again.');
        }
    };    

    if (loading) return <p className="text-gray-700 text-center">Loading enquiries...</p>;
    if (error) return <p className="text-red-500 font-semibold text-center">{error}</p>;
    if (noEnquiries) return <p className="text-gray-600 text-center">You have no enquiries at the moment. Please check back later.</p>;

    return (
        <>
            <h1 className="text-3xl font-semibold text-gray-800 mb-4 text-center">Property Enquiries</h1>
            <p className="text-gray-600 mb-6 text-center">Engage with potential clients regarding their property interests.</p>

            {/* Active Inquiries */}
            {inquiries.filter(inquiry => !inquiry.resolved).length > 0 && (
                <>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Active Inquiries</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inquiries.filter(inquiry => !inquiry.resolved).map((inquiry) => (
                            // NEW: Added a unique id for each inquiry so it can be targeted for auto-scroll and transition.
                            <div key={inquiry.id} id={`inquiry-${inquiry.id}`} className="relative p-6 bg-gray-100 shadow-lg rounded-lg transition-transform transform hover:scale-105">
                                <p className="text-lg text-gray-600"><strong>Email:</strong> {inquiry.email}</p>
                                <p className="text-lg text-gray-600"><strong>Subject:</strong> {inquiry.subject}</p>
                                <p className="text-gray-700 mt-1"><strong>Name:</strong> {inquiry.first_name} {inquiry.last_name}</p>
                                <p className="text-gray-700 mt-1"><strong>Message:</strong> {inquiry.message}</p>
                                <p className="text-gray-700 mt-1"><strong>Property Type:</strong> {inquiry.property_type}</p>
                                <p className="text-gray-700 mt-1"><strong>Property Name:</strong> {inquiry.title}</p>
                                <div className="flex justify-end">
                                    <button 
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-500 transition button-border-secondary"
                                        onClick={() => handleReplyClick(inquiry)}
                                    >
                                        Reply
                                    </button>
                                    <button 
                                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500 transition button-border-secondary ml-2"
                                        onClick={() => handleCloseInquiry(inquiry.id)}
                                    >
                                        Close
                                    </button>
                                </div>
                                <p className="absolute bottom-2 left-2 text-gray-700 text-sm ml-6">{new Date(inquiry.created_at).toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Responded Inquiries */}
            {inquiries.filter(inquiry => inquiry.resolved).length > 0 && (
                <>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Responded Inquiries</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inquiries.filter(inquiry => inquiry.resolved).map((inquiry) => (
                            <div key={inquiry.id} className="relative p-6 bg-gray-200 shadow-lg rounded-lg opacity-50 transition-transform transform hover:scale-105">
                                <p className="text-sm text-gray-600"><strong>Email:</strong> {inquiry.email}</p>
                                <p className="text-sm text-gray-600"><strong>Subject:</strong> {inquiry.subject}</p>
                                <p className="text-gray-700 mt-1"><strong>Name:</strong> {inquiry.first_name} {inquiry.last_name}</p>
                                <p className="text-gray-700 mt-1"><strong>Message:</strong> {inquiry.message}</p>
                                <p className="text-gray-700 mt-1"><strong>Property Type:</strong> {inquiry.property_type}</p>
                                <p className="text-gray-700 mt-1"><strong>Property Name:</strong> {inquiry.title}</p>
                                <p className="absolute bottom-2 left-2 text-gray-700 text-sm ml-6">{new Date(inquiry.created_at).toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Reply Modal */}
            <Modal
                isOpen={!!selectedInquiry}
                onRequestClose={() => setSelectedInquiry(null)}
                contentLabel="Reply Modal"
                className="modal"
                overlayClassName="modal-overlay"
            >
                {selectedInquiry && (
                    <div className="p-4 bg-white rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Reply to {selectedInquiry.first_name} {selectedInquiry.last_name}</h2>
                        <div className="space-y-2 mb-4 overflow-y-auto max-h-32">
                            {conversations[selectedInquiry.id]?.map((msg, index) => (
                                <p key={index} className={`p-2 rounded-lg ${msg.sender === 'owner' ? 'bg-blue-100' : 'bg-gray-200'}`}>{msg.message}</p>
                            ))}
                        </div>
                        <textarea
                            className="w-full p-2 border rounded-lg mb-4"
                            rows="3"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Send a reply..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition button-border-secondary"
                                onClick={handleSendReply}
                            >
                                Send
                            </button>
                            <button 
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition button-border-secondary"
                                onClick={() => setSelectedInquiry(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Inquiries;

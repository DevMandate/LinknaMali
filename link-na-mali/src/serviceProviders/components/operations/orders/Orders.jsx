import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AppContext from '../../../context/ServiceProviderAppContext';

const API_BASE_URL = 'https://api.linknamali.ke';

// Format date/time
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  return new Date(dateString).toLocaleString('en-KE', options);
};

const ServiceProviderInquiries = () => {
  const { userData } = useContext(AppContext);
  const userId = userData?.user_id;
  console.log('ServiceProviderInquiries - userId:', userId);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyState, setReplyState] = useState({});

  useEffect(() => {
    if (!userId) return;
    const fetchInquiries = async () => {
      try {
        setLoading(true);
        console.log('Fetching inquiries for user:', userId);
        const res = await axios.get(`${API_BASE_URL}/providerinquiries`, { params: { user_id: userId } });
        console.log('API response:', res.data);
        setInquiries(res.data.inquiries || []);
      } catch (err) {
        console.error('Error fetching inquiries:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [userId]);

  const handleToggleReply = (id) => {
    setReplyState(prev => ({
      ...prev,
      [id]: { show: !prev[id]?.show, message: prev[id]?.message || '' }
    }));
  };

  const handleReplyChange = (id, text) => {
    setReplyState(prev => ({ ...prev, [id]: { ...prev[id], message: text } }));
  };

  const handleSubmitReply = async (inquiryId) => {
    const state = replyState[inquiryId];
    if (!state?.message) return;
    try {
      setReplyState(prev => ({ ...prev, [inquiryId]: { ...prev[inquiryId], submitting: true } }));
      const postData = { inquiry_id: inquiryId, responder_id: userId, message: state.message };
      console.log('Submitting reply:', postData);
      const res = await axios.post(`${API_BASE_URL}/serviceproviderinquiryreply`, postData);
      console.log('Reply API response:', res.data);
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status: 'responded' } : i));
      setReplyState(prev => ({ ...prev, [inquiryId]: { show: false, message: '', submitting: false } }));
      alert('Reply submitted successfully.');
    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
      setReplyState(prev => ({ ...prev, [inquiryId]: { ...prev[inquiryId], submitting: false } }));
    }
  };

  if (!userId) return <p className="p-6 text-center text-[var(--primary-color)]">No user found.</p>;
  if (loading) return <p className="p-6 text-center">Loading inquiries...</p>;
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-8 text-3xl font-bold text-[var(--primary-color)] text-center sm:text-left">
          Service Inquiries
        </h1>

        {inquiries.length === 0 ? (
          <p className="text-center text-[var(--tertiary-color)]">No inquiries found.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {inquiries.map(inquiry => {
              const { id, first_name, last_name, email, subject, message, status, created_at } = inquiry;
              const rs = replyState[id] || {};
              const initials = `${first_name?.[0] || ''}${last_name?.[0] || ''}`.toUpperCase();

              const badgeClasses = status === 'responded'
                ? 'bg-[var(--secondary-color)] text-white'
                : status === 'unread'
                  ? 'bg-[var(--quaternary-color)] text-[var(--quaternary-color-dark)]'
                  : 'bg-[var(--tertiary-color)] text-white';

              return (
                <div
                  key={id}
                  className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
                    <div className="w-12 h-12 bg-[var(--quaternary-color)] rounded-full flex items-center justify-center text-lg font-semibold text-[var(--primary-color)]">
                      {initials}
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 flex-1">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {first_name} {last_name}
                      </h2>
                      <p className="text-sm text-gray-600">{subject}</p>
                      <p className="text-sm text-[var(--quaternary-color-dark)] break-words">{email}</p>
                    </div>
                    <span className={`mt-3 sm:mt-0 ml-auto px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                      {status}
                    </span>
                  </div>

                  <p className="mb-4 text-gray-700 leading-relaxed break-words">{message}</p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto">
                    <p className="text-xs text-gray-400">{formatDate(created_at)}</p>
                    <button
                      className="mt-3 sm:mt-0 text-sm font-medium text-[var(--secondary-color)] hover:text-[var(--primary-color)] transition-colors"
                      onClick={() => handleToggleReply(id)}
                    >
                      {rs.show ? 'Cancel' : 'Reply'}
                    </button>
                  </div>

                  {rs.show && (
                    <div className="mt-4">
                      <textarea
                        className="w-full p-3 border border-[var(--quaternary-color-dark)] rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
                        rows={3}
                        value={rs.message}
                        onChange={e => handleReplyChange(id, e.target.value)}
                        placeholder="Type your reply here..."
                      />
                      <button
                        className="w-full py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--secondary-color)] transition-colors disabled:opacity-50"
                        disabled={rs.submitting}
                        onClick={() => handleSubmitReply(id)}
                      >
                        {rs.submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderInquiries;

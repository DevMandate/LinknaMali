import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLogin } from '../../../../context/IsLoggedIn';

// Point to the API endpoint for enquiries
const BASE_URL = 'https://api.linknamali.ke';

export default function AdEnquiryModal({ adId, onClose }) {
  const { isLoggedIn, userData } = useLogin();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Immediately use passed adId or fallback to localStorage
  const [effectiveAdId] = useState(() => adId ?? localStorage.getItem('inquiryAdId'));

  // Pre-fill form fields if user is logged in
  useEffect(() => {
    if (userData) {
      setForm(f => ({ ...f, name: userData.first_name || '', email: userData.email || '' }));
    }
  }, [userData]);

  // Open modal on mount
  useEffect(() => setIsOpen(true), []);

  const closeModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.message.trim()) {
      return setError('Enquiry message is required.');
    }
    if (!effectiveAdId) {
      return setError('Unable to determine which ad you are enquiring about.');
    }

    setLoading(true);
    try {
      const payload = {
        user_id: isLoggedIn ? userData.id : null,
        ...(!isLoggedIn && { name: form.name.trim() }),
        ...(!isLoggedIn && { email: form.email.trim() }),
        phone: form.phone.trim() || undefined,
        message: form.message.trim()
      };

      await axios.post(
        `${BASE_URL}/ads/${effectiveAdId}/enquiries`,
        payload,
        { withCredentials: true }
      );

      setSuccess('Enquiry submitted successfully!');
      setTimeout(closeModal, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={closeModal} />
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <h2 className="text-xl font-semibold mb-4">Submit Your Enquiry</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}
        <form onSubmit={handleSubmit}>
          {/* guest-only fields */}
          {!isLoggedIn && (
            <>
              <input
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                className="w-full mb-3 p-2 border rounded"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                className="w-full mb-3 p-2 border rounded"
              />
            </>
          )}
          <input
            type="tel"
            name="phone"
            placeholder="Your Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full mb-3 p-2 border rounded"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={form.message}
            onChange={handleChange}
            required
            className="w-full mb-4 p-2 border rounded h-24"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

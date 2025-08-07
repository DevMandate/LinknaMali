import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAppContext } from '../../context/AdminAppContext';

const API_BASE_URL = 'https://api.linknamali.ke';

const ServiceProviderProfiles = () => {
  const { adminData } = useAdminAppContext();
  const adminId = adminData?.id;

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionState, setActionState] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProfile, setModalProfile] = useState(null);
  const [modalType, setModalType] = useState(''); // 'reject' or 'edit'
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (!adminId) return;
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/allserviceproviders`);
        setProfiles(res.data || []);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [adminId]);

  const httpPost = (url, payload) => {
    // include explicit JSON header and return promise
    return axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
  };

  const handleApprove = async (profileId) => {
    setActionState(s => ({ ...s, [profileId]: { loading: true } }));
    try {
      const payload = { profile_id: profileId, admin_id: adminId, status: 'approved' };
      const res = await httpPost(`${API_BASE_URL}/approveserviceprofile`, payload);
      alert(res.data.message);
      setProfiles(prev => prev.map(p => p.profile_id === profileId ? { ...p, status: 'approved' } : p));
    } catch (err) {
      console.error('Approve error:', err.response?.data || err.message);
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionState(s => ({ ...s, [profileId]: { loading: false } }));
    }
  };

  const handleReject = async (profileId, message) => {
    setActionState(s => ({ ...s, [profileId]: { loading: true } }));
    try {
      const payload = { profile_id: profileId, admin_id: adminId, status: 'rejected', rejection_message: message };
      const res = await httpPost(`${API_BASE_URL}/approveserviceprofile`, payload);
      alert(res.data.message);
      setProfiles(prev => prev.map(p => p.profile_id === profileId ? { ...p, status: 'rejected' } : p));
    } catch (err) {
      console.error('Reject error:', err.response?.data || err.message);
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionState(s => ({ ...s, [profileId]: { loading: false } }));
      closeModal();
    }
  };

  const handleRequestEdits = async (profileId, message) => {
    setActionState(s => ({ ...s, [profileId]: { loading: true } }));
    try {
      const payload = { profile_id: profileId, admin_id: adminId, message };
      const res = await httpPost(`${API_BASE_URL}/requestserviceprofileedits`, payload);
      alert(res.data.message);
    } catch (err) {
      console.error('Edit request error:', err.response?.data || err.message);
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionState(s => ({ ...s, [profileId]: { loading: false } }));
      closeModal();
    }
  };

  const openModal = (profileId, type) => {
    setModalProfile(profileId);
    setModalType(type);
    setModalMessage('');
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  if (!adminId) return <p className="p-6 text-center text-[var(--primary-color)]">No admin data found.</p>;
  if (loading) return <p className="p-6 text-center">Loading service providers...</p>;
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-8 text-3xl font-bold text-[var(--primary-color)] text-center sm:text-left">Service Providers</h1>
        {profiles.length === 0 ? (
          <p className="text-center text-[var(--tertiary-color)]">No service providers found.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map(p => {
              const { profile_id, business_name, category, description, location, phone_number, email, created_at, status='pending' } = p;
              const as = actionState[profile_id] || {};
              const initials = business_name?.[0]?.toUpperCase() || '';
              const badgeClasses =
                status==='approved' ? 'bg-[var(--secondary-color)] text-white' :
                status==='pending'  ? 'bg-[var(--quaternary-color)] text-[var(--quaternary-color-dark)]' :
                                      'bg-red-500 text-white';

              return (
                <div key={profile_id} className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[var(--quaternary-color)] rounded-full flex items-center justify-center text-lg font-semibold text-[var(--primary-color)]">{initials}</div>
                    <div className="ml-4 flex-1"><h2 className="text-xl font-semibold text-gray-800">{business_name}</h2><p className="text-sm text-gray-600 capitalize">{category}</p><p className="text-sm text-[var(--quaternary-color-dark)] break-words">{location}</p></div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>{status}</span>
                  </div>
                  <p className="text-gray-700 mb-4 break-words">{description}</p>
                  <p className="text-sm text-gray-500 mb-2">Email: {email}</p>
                  <p className="text-sm text-gray-500 mb-4">Phone: {phone_number}</p>
                  <p className="text-xs text-gray-400 mb-4">Added: {new Date(created_at).toLocaleString()}</p>

                  {status==='pending' && (
                    <div className="mt-auto flex space-x-2">
                      <button className="flex-1 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" onClick={() => handleApprove(profile_id)} disabled={as.loading}>{as.loading ? 'Processing...' : 'Approve'}</button>
                      <button className="flex-1 py-2 bg-[var(--secondary-color)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" onClick={() => openModal(profile_id,'reject')} disabled={as.loading}>Reject</button>
                      <button className="flex-1 py-2 bg-[var(--tertiary-color)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" onClick={() => openModal(profile_id,'edit')} disabled={as.loading}>Request Edits</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">{modalType==='reject' ? 'Reject Profile' : 'Request Edits'}</h3>
            <textarea className="w-full h-24 p-2 border rounded mb-4" value={modalMessage} onChange={e => setModalMessage(e.target.value)} placeholder="Enter your message..." />
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={closeModal}>Cancel</button>
              <button className="px-4 py-2 bg-[var(--secondary-color)] text-white rounded hover:opacity-90 disabled:opacity-50" disabled={!modalMessage} onClick={() => modalType==='reject' ? handleReject(modalProfile, modalMessage) : handleRequestEdits(modalProfile, modalMessage)}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderProfiles;

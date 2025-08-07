import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import { useAdminAppContext } from '../context/AdminAppContext';

const MediaSlideshow = ({ mediaUrls, interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (mediaUrls.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaUrls.length);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [mediaUrls, interval]);

  return (
    <img
      src={mediaUrls[currentIndex]}
      alt={`Slide ${currentIndex + 1}`}
      className="w-full h-48 object-cover rounded-md"
      onError={(e) => {
        e.target.src = '/default-placeholder.jpg';
      }}
    />
  );
};

const AdminAdsCenter = () => {
  const { adminId } = useAdminAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ads, setAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedAd, setExpandedAd] = useState(null);
  const [totalActiveAds, setTotalActiveAds] = useState(0);
  const [totalRejectedAds, setTotalRejectedAds] = useState(0);
  const [pendingAds, setPendingAds] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAdForRejection, setSelectedAdForRejection] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get('https://api.linknamali.ke/all-ads');
        if (response.data && Array.isArray(response.data.all_ads)) {
          const fetchedAds = response.data.all_ads;
          setAds(fetchedAds);

          const active = fetchedAds.filter(
            (ad) => ad.status?.toLowerCase() === 'approved'
          );
          const rejected = fetchedAds.filter(
            (ad) => ad.status?.toLowerCase() === 'rejected'
          );
          const pending = fetchedAds.filter(
            (ad) => ad.status?.toLowerCase() === 'pending'
          );

          setTotalActiveAds(active.length);
          setTotalRejectedAds(rejected.length);
          setPendingAds(pending);
        } else {
          console.error('Unexpected response format:', response.data);
          setAds([]);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const toggleDescription = (adId) => {
    setExpandedAd(expandedAd === adId ? null : adId);
  };

  const approveAd = async (adId) => {
    if (!adminId) {
      alert('Admin ID is missing!');
      return;
    }
    try {
      const payload = { admin_id: adminId };
      await axios.post(
        `https://api.linknamali.ke/approveAd/${adId}/approve`,
        payload
      );
      setAds(
        ads.map((ad) =>
          ad.ad_id === adId ? { ...ad, status: 'Approved' } : ad
        )
      );
      setPendingAds(pendingAds.filter((ad) => ad.ad_id !== adId));
      alert('Ad approved successfully.');
    } catch (error) {
      console.error(`Error approving ad ${adId}:`, error);
      alert('Failed to approve ad.');
    }
  };

  const openRejectModal = (adId) => {
    setSelectedAdForRejection(adId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedAdForRejection(null);
    setRejectReason('');
  };

  const submitRejection = async () => {
    if (!adminId) {
      alert('Admin ID is missing!');
      return;
    }
    if (!rejectReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    try {
      const payload = { admin_id: adminId, reason: rejectReason };
      await axios.post(
        `https://api.linknamali.ke/rejectAd/${selectedAdForRejection}/reject`,
        payload
      );
      setAds(
        ads.map((ad) =>
          ad.ad_id === selectedAdForRejection
            ? { ...ad, status: 'Rejected' }
            : ad
        )
      );
      setPendingAds(
        pendingAds.filter((ad) => ad.ad_id !== selectedAdForRejection)
      );
      alert('Ad rejection message sent successfully.');
      closeRejectModal();
    } catch (error) {
      console.error(`Error rejecting ad ${selectedAdForRejection}:`, error);
      alert('Failed to reject ad.');
    }
  };

  const filteredAds = ads.filter((ad) => {
    const matchesQuery = ad.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || ad.status?.toLowerCase() === filterStatus;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="flex">
      {/* now passes onToggle so click or touch outside closes the sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 p-6 pt-12">
            {/* ← Back to Dashboard button */}
        <div className="pt-14 mb-14">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
      </div>
        <Header
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <h2 className="text-2xl font-bold mb-4">Ads Management</h2>

        {/* Stats Panel */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded shadow">
            <h4 className="text-lg font-semibold">Total Active Ads</h4>
            <p className="text-xl">{totalActiveAds}</p>
          </div>
          <div className="p-4 rounded shadow">
            <h4 className="text-lg font-semibold">Total Rejected Ads</h4>
            <p className="text-xl">{totalRejectedAds}</p>
          </div>
          <div className="p-4 rounded shadow">
            <h4 className="text-lg font-semibold">Total Pending Ads</h4>
            <p className="text-xl">{pendingAds.length}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-4 mb-4">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded ${
                filterStatus === status ? 'text-white' : 'text-black'
              }`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search ads..."
          className="w-full p-2 mb-4 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Ads Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center">Loading...</div>
          ) : (
            filteredAds.map((ad) => (
              <div key={ad.ad_id} className="p-4 rounded shadow">
                <h5 className="text-lg font-bold">{ad.title}</h5>
                <p className="text-sm text-gray-600">
                  User:{' '}
                  {ad.user
                    ? `${ad.user.first_name} ${ad.user.last_name}`
                    : 'Unknown'}{' '}
                  | Email: {ad.user?.email || 'Not Provided'}
                </p>
                <p className="mt-2 text-sm">
                  {expandedAd === ad.ad_id
                    ? ad.description
                    : ad.description.length > 100
                    ? `${ad.description.slice(0, 100)}...`
                    : ad.description}
                  {ad.description.length > 100 && (
                    <button
                      className="ml-2"
                      onClick={() => toggleDescription(ad.ad_id)}
                    >
                      {expandedAd === ad.ad_id ? 'View Less' : 'View More'}
                    </button>
                  )}
                </p>
                <div className="mt-2">
                  <p>Budget: {ad.budget}</p>
                  <p>Total Paid: {ad.total_paid}</p>
                  <p>Balance: {ad.balance}</p>
                </div>
                <div className="mt-4">
                  {ad.media_urls?.length > 0 ? (
                    <MediaSlideshow mediaUrls={ad.media_urls} />
                  ) : (
                    <img
                      src="/default-placeholder.jpg"
                      alt="Default placeholder"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    className="px-4 py-2 text-white rounded"
                    onClick={() => approveAd(ad.ad_id)}
                  >
                    Approve
                  </button>
                  <button
                    className="px-4 py-2 text-white rounded"
                    onClick={() => openRejectModal(ad.ad_id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow w-96">
              <h3 className="text-lg font-bold mb-4">Reject Ad</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Type your rejection reason here..."
                rows="4"
                className="w-full p-2 border rounded"
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={closeRejectModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-white rounded"
                  onClick={submitRejection}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdsCenter;

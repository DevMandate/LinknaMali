import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaChevronLeft,
  FaChevronRight,
  FaFile,
  FaFileDownload,
  FaFilePdf,
  FaDownload,
    FaEye, 
    FaComments, 
    FaArrowLeft 
} from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import { useAdminAppContext } from '../context/AdminAppContext';
import { Box, Typography, Button as MuiButton, Divider, Container } from "@mui/material"; 
import { EventAvailable, QuestionAnswer } from '@mui/icons-material'; 
import Swiper from '../components/previewlisting/carousel'; 
import ReviewsModal from './Reviews'; 
const API_BASE = 'https://api.linknamali.ke';
const CATEGORIES = ['all', 'apartments', 'land', 'commercial', 'houses'];
function Card({ children }) {
    return (
        <div className="bg-white rounded-2xl shadow-card hover:shadow-cardHover transition-shadow duration-300 overflow-hidden">
            {children}
        </div>
    );
}
function Button({ children, variant = 'primary', ...props }) {
    const base = 'w-full py-2 rounded-lg font-medium transition-colors duration-200';
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        neutral: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    };
    return (
        <button className={`${base} ${variants[variant]}`} {...props}>
            {children}
        </button>
    );
}
const DocumentDisplay = ({ documents }) => {
  if (!documents?.length) return null;

  const getFileIcon = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="text-red-500" />;
    return <FaFile className="text-blue-500" />;
  };
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <h4 className="font-medium mb-2 flex items-center text-gray-700">
        <FaFile className="mr-2" />
        Property Documents
      </h4>
      <div className="space-y-2">
        {documents.map((doc, idx) => (
          <a
            key={idx}
            href={doc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-2 bg-white rounded hover:bg-gray-100 transition-colors group"
          >
            {getFileIcon(doc)}
            <span className="ml-2 text-gray-600 group-hover:text-blue-600">Document {idx + 1}</span>
            <FaDownload className="ml-auto text-gray-400 group-hover:text-blue-500" />
          </a>
        ))}
      </div>
    </div>
  );
};
function PreviewModal({ open, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto relative mt-16">
                {children}
            </div>
        </div>
    );
}
function ViewListing({ detailsDisplay, onClose }) {
    const navigate = useNavigate(); 
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (detailsDisplay) setDetails(detailsDisplay);
    }, [detailsDisplay]); 
    function formatKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const excludedKeys = [
        'images', 'videos', 'id', 'title', 'location', 'price', 'purpose',
        'size', 'description', 'property_type', 'house_type',
        'amenities', 'likes', 'user_name', 'ownerImage', 'documents',
        'availability_status', 'deleted', 'is_approved', 'user_id', 'created_at', 'updated_at', 'edit_details', 'under_review', 'edit_closed', 'status' // Added keys from NewListings
    ];
    const handleBooking = (d) => console.log('Booking:', d);
    const handleEnquiry = (d) => console.log('Enquiry:', d);
    if (!details) return null;
    const media = [];
    if (details.images?.length > 0) {
        details.images.forEach((src) => media.push({ type: 'image', src }));
    }
    if (details.videos?.length > 0) {
        details.videos.forEach((src) => media.push({ type: 'video', src }));
    }
    return (
        <Container maxWidth="lg" sx={{ p: 0 }}> 
            <Box sx={{
                p: 2,
                pt: onClose ? 10 : 2,
                boxShadow: 3,
                borderRadius: 1,
                backgroundColor: 'var(--hamburger)',
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                position: 'relative'
            }}>
                {onClose && (
                    <MuiButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            minWidth: 'unset',
                            padding: '4px',
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <Typography variant="h6" component="span" sx={{ lineHeight: 1, fontWeight: 'bold' }}>
                            &times;
                        </Typography>
                    </MuiButton>
                )}
                <Typography variant="h6" sx={{ mb: 1, color: 'var(--primary-color)' }}>
                    {details.title} in {details.location}, {details.town}, priced at {details.price} Ksh {details.purpose === 'Short Stay' ? 'per night' : ''}
                </Typography>

                {media.length > 0 && (
                    <Box sx={{ mb: 2, width: '100%', mt: 2 }}>
                        <Swiper media={media} />
                    </Box>
                )}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    minWidth: 400,
                    '@media (max-width:500px)': { minWidth: 'unset' }
                }}>
                    {(details.purpose === 'Sale' || details.purpose === 'Short Stay') && (
                        <MuiButton
                            variant="contained"
                            sx={{ backgroundColor: 'var(--secondary-color)' }}
                            endIcon={<EventAvailable />}
                            onClick={() => handleBooking(details)}
                        >
                            {details.property_type === 'land' ? 'Reserve' : 'Book'}
                        </MuiButton>
                    )}
                    <MuiButton
                        variant="contained"
                        sx={{ backgroundColor: 'var(--primary-color)' }}
                        endIcon={<QuestionAnswer />}
                        onClick={() => handleEnquiry(details)}
                    >
                        Make an Enquiry
                    </MuiButton>
                </Box>

                <Divider sx={{ mb: 2 }} />
                <Typography sx={{ mb: 2 }}>{details.description}</Typography>

                {Object.entries(details).map(([key, value]) => {
                    if (excludedKeys.includes(key)) return null;
                    return (
                        <Typography key={key} sx={{ mb: 1, color: '#333' }}>
                            <strong>{formatKey(key)}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Typography>
                    );
                })}
                 <DocumentDisplay documents={details.documents} /> {/* Include DocumentDisplay here for the preview */}
            </Box>
        </Container>
    );
}
function PropertyCard({
    listing,
    expanded,
    currentMediaIndex,
    onExpand,
    onPrevMedia,
    onNextMedia,
    onShowReviews, 
    onPreviewListing,
    handleApprove,
    openEditModal,
    handleMarkClosed
}) {
    const isVideo = (url) => {
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'flv'];
        const ext = url.split('.').pop().toLowerCase();
        return videoExtensions.includes(ext);
    };
    const allMedia = [...(listing.images || []), ...(listing.videos || [])];
    const currentMedia = allMedia[currentMediaIndex];
    const type = (listing.type || listing.property_type || '').toLowerCase();
    return (
        <Card>
            <div className="p-6 flex flex-col h-full">
                <h2 className="text-2xl font-semibold text-primary mb-4 line-clamp-2">
                    {listing.title}
                </h2>
                {allMedia.length > 0 && (
                    <div className="relative group mb-4 rounded-lg overflow-hidden">
                        <button
                            onClick={onPrevMedia}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <FaChevronLeft />
                        </button>
                        {isVideo(currentMedia) ? (
                            <video src={currentMedia} controls className="w-full h-48 object-cover"></video>
                        ) : (
                            <img
                                src={currentMedia}
                                alt={listing.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <button
                            onClick={onNextMedia}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
                <div className="flex-1 text-gray-700 space-y-1 mb-4">
                    <p className="line-clamp-2">
                        <strong>Description:</strong> {listing.description}
                    </p>
                    <p><strong>Location:</strong> {listing.location}</p>
                    <p><strong>Price:</strong> {listing.price}</p>
                    <p><strong>Size:</strong> {listing.size}</p>
                    <p><strong>Listed By:</strong> {listing.user_name}</p>
                </div>
                <DocumentDisplay documents={listing.documents} />
                {expanded && (
                    <div className="mt-4 space-y-2 text-sm text-gray-500 border-t pt-4">
                        <p><strong>Property Type:</strong> {listing.property_type}</p>
                        <p><strong>User ID:</strong> {listing.user_id}</p>
                        <p><strong>Status:</strong> {listing.status}</p>
                        <p><strong>Bedrooms:</strong> {listing.bedrooms}</p>
                        <p><strong>Bathrooms:</strong> {listing.bathrooms}</p>
                        <p><strong>Posted:</strong> {new Date(listing.created_at).toLocaleDateString()}</p>
                    </div>
                )}
                <div className="mt-6 space-y-2">
                    <Button onClick={onExpand} variant="outline">
                        {expanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Button onClick={() => onPreviewListing(listing)} variant="neutral">
                        <div className="flex items-center justify-center space-x-2">
                            <FaEye /> <span>Preview Listing</span>
                        </div>
                    </Button>
                    <Button onClick={() => handleApprove(type, listing.id)} variant="primary">Approve</Button>
                    <Button onClick={() => openEditModal(listing)} variant="secondary">Send for Edits</Button> {/* Changed variant to secondary for distinct look */}
                    <Button onClick={() => handleMarkClosed(type, listing.id)} variant="danger">Mark Closed</Button> {/* Changed variant to danger for distinct look */}
                </div>
            </div>
        </Card>
    );
}
function ConfirmationModal({ open, onClose, onConfirm, title, message }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-red-600 mb-4">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Confirm Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}
const NewListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [mediaIndices, setMediaIndices] = useState({});
    const [mainFilter, setMainFilter] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedListings, setExpandedListings] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedFields, setSelectedFields] = useState([]);
    const [additionalSpecs, setAdditionalSpecs] = useState('');
    const [currentListing, setCurrentListing] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewListingData, setPreviewListingData] = useState(null);
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const [reviewsModalData, setReviewsModalData] = useState({ title: '', reviews: [] });
    const [reviewsModalLoading, setReviewsModalLoading] = useState(false);
    const [reviewsModalError, setReviewsModalError] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const highlightListing = searchParams.get('highlightListing');
    const { adminData } = useAdminAppContext();
    useEffect(() => {
        console.log('Admin Data:', adminData);
    }, [adminData]);
    const fetchListings = async () => {
        try {
            const res = await axios.get(`${API_BASE}/property/getallunapprovedproperty`);
            setListings(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchListings();
    }, []);
    useEffect(() => {
        if (highlightListing && listings.length) {
            const el = document.getElementById(`listing-${highlightListing}`);
            if (el) {
                el.classList.add('highlight-animation');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightListing, listings]);

    const showMessage = msg => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleExpand = id =>
        setExpandedListings(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    const isVideo = (url) => {
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'flv'];
        const ext = url.split('.').pop().toLowerCase();
        return videoExtensions.includes(ext);
    };
    const prevMedia = (id, total) =>
        setMediaIndices(prev => ({
            ...prev,
            [id]: ((prev[id] || 0) - 1 + total) % total
        }));
    const nextMedia = (id, total) =>
        setMediaIndices(prev => ({
            ...prev,
            [id]: ((prev[id] || 0) + 1) % total
        }));
    const handleApprove = async (propertyType, propertyId) => {
        try {
            const map = { house: 'houses', apartment: 'apartments', land: 'land', commercial: 'commercial' };
            const type = map[propertyType.toLowerCase().trim()] || propertyType.toLowerCase().trim();
            if (!['apartments', 'houses', 'land', 'commercial'].includes(type)) {
                showMessage('❌ Approval failed!');
                return;
            }
            const payload = { property_type: type, id: propertyId };
            const resp = await axios.put(`${API_BASE}/adminapproveproperty`, payload);
            showMessage(resp.status === 200 ? '✅ Approval successful!' : '❌ Approval failed!');
            fetchListings();
        } catch (err) {
            console.error('Approve error:', err.response?.data || err.message);
            showMessage('❌ Approval failed!');
        }
    };
    const handleMarkClosed = async (propertyType, propertyId) => {
        try {
            const map = { house: 'houses', apartment: 'apartments', land: 'land', commercial: 'commercial' };
            const type = map[propertyType.toLowerCase().trim()] || propertyType.toLowerCase().trim();
            const admin_id = adminData?.id;
            const payload = { property_type: type, id: propertyId, admin_id };
            const resp = await axios.post(`${API_BASE}/approveedits`, payload);
            showMessage(resp.status === 200 ? '✅ Edit closed successfully!' : '❌ Closing edit failed!');
            fetchListings();
        } catch (err) {
            console.error('Close error:', err.response?.data || err.message);
            showMessage('❌ Closing edit failed!');
        }
    };
    const openEditModal = listing => {
        setCurrentListing(listing);
        setSelectedFields([]);
        setAdditionalSpecs('');
        setEditModalOpen(true);
    };
    const closeEditModal = () => {
        setEditModalOpen(false);
        setCurrentListing(null);
        setSelectedFields([]);
        setAdditionalSpecs('');
    };
    const handleCheckboxChange = e => {
        const { value, checked } = e.target;
        setSelectedFields(prev => checked ? [...prev, value] : prev.filter(f => f !== value));
    };
    const handleAdditionalSpecsChange = e => setAdditionalSpecs(e.target.value);
    const handleSubmitEditRequest = async e => {
        e.preventDefault();
        if (!currentListing) return;
        const admin_id = adminData?.id;
        const user_id = currentListing.user_id;
        const opts = { apartment: 'apartments', apartments: 'apartments', house: 'houses', houses: 'houses', commercial: 'commercial', commercials: 'commercial', land: 'land', lands: 'land' };
        const listingType = (currentListing.type || currentListing.property_type || '').toLowerCase().trim();
        const type = opts[listingType] || listingType;
        let details = additionalSpecs || 'Please update the selected fields.';
        if (selectedFields.length) details = `Please update the following fields: ${selectedFields.join(', ')}. ${details}`;
        const payload = { id: currentListing.id, property_type: type, user_id, edit_details: details, admin_id };
        try {
            const resp = await axios.post(`${API_BASE}/editrequests`, payload, { withCredentials: true });
            showMessage(resp.status === 200 ? '✅ Edit request sent successfully!' : '❌ Edit request failed!');
        } catch (err) {
            console.error('Edit request error:', err.response?.data || err.message);
            showMessage('❌ Edit request failed!');
        } finally {
            fetchListings();
            closeEditModal();
        }
    };
    const handlePreviewListing = (listing) => {
        setPreviewListingData(listing);
        setPreviewModalOpen(true);
    };
    const fetchAndOpenReviews = async (listing) => {
        setReviewsModalLoading(true);
        setReviewsModalError(null);
        try {
            const resp = await axios.get(`${API_BASE}/reviews/list`, {
                params: { property_id: listing.id, property_type: listing.property_type },
            });
            setReviewsModalData({ title: listing.title, reviews: resp.data.reviews || [] });
        } catch (err) {
            console.error(err);
            setReviewsModalError('Failed to load reviews');
            setReviewsModalData({ title: listing.title, reviews: [] });
        } finally {
            setReviewsModalLoading(false);
            setReviewsModalOpen(true);
        }
    };


    const filtered = activeCategory === 'all' ? listings : listings.filter(l => ((l.type || l.property_type) || '').toLowerCase().trim() === activeCategory);
    const finalListings = mainFilter === 'under_review' ? filtered.filter(l => l.under_review && !l.edit_closed) : filtered;

    if (loading) return <p>Loading...</p>;

    return (
        <div className="min-h-screen flex" id="pageRef">
            <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
            <div className="flex-1 flex flex-col">
                
                <Header onSidebarToggle={toggleSidebar} />
                {successMessage && <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[var(--primary-color)] text-white px-6 py-3 rounded-lg shadow-lg z-50">{successMessage}</div>}
                <div className="flex-1 p-6 pt-28 bg-gray-50">
                            {/* ← Back to Dashboard button */}
        <div className="pt-6 mb-6">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
      </div>
                    <h1 className="text-3xl font-bold mb-6">New Listings</h1>
                    <div className="flex justify-center gap-4 mb-6">
                        {['all', 'under_review', 'approved'].map(view =>
                            <button key={view} onClick={() => view === 'approved' ? navigate('/admin-dashboard/adminallproperties') : setMainFilter(view)}
                                className={`px-5 py-2 rounded transition ${mainFilter === view ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--quaternary-color)] text-black hover:bg-[var(--quaternary-color-dark)]'}`}>{view.replace('_', ' ').replace(/\b\w/g, m => m.toUpperCase())}</button>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {CATEGORIES.map(c =>
                            <button key={c} onClick={() => setActiveCategory(c)}
                                className={`px-4 py-2 rounded-lg transition ${activeCategory === c ? 'bg-[var(--primary-color)] text-white shadow-md' : 'bg-[var(--quaternary-color)] text-black hover:bg-[var(--quaternary-color-dark)]'}`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {finalListings.map(listing => {
                            const expanded = expandedListings.includes(listing.id);
                            const allMedia = [...(listing.images || []), ...(listing.videos || [])];
                            const currentMediaIndex = mediaIndices[listing.id] || 0;

                            return (
                                <PropertyCard
                                    key={listing.id}
                                    listing={listing}
                                    expanded={expanded}
                                    currentMediaIndex={currentMediaIndex}
                                    onExpand={() => toggleExpand(listing.id)}
                                    onPrevMedia={() => prevMedia(listing.id, allMedia.length)}
                                    onNextMedia={() => nextMedia(listing.id, allMedia.length)}
                                    onShowReviews={() => fetchAndOpenReviews(listing)}  are for approved listings
                                    onPreviewListing={handlePreviewListing} 
                                    handleApprove={handleApprove}
                                    openEditModal={openEditModal}
                                    handleMarkClosed={handleMarkClosed}
                                />
                            );
                        })}
                    </div>
                </div>
                {editModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                            <h3 className="text-xl font-semibold mb-4">Select Fields to Edit</h3>
                            <form onSubmit={handleSubmitEditRequest} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {['price', 'availability_status', 'description', 'documents', 'photos', 'amenities'].map(field =>
                                        <label key={field} className="flex items-center space-x-2">
                                            <input type="checkbox" value={field} onChange={handleCheckboxChange} className="h-5 w-5" />
                                            <span className="capitalize">{field.replace('_', ' ')}</span>
                                        </label>
                                    )}
                                </div>
                                <textarea value={additionalSpecs} onChange={handleAdditionalSpecsChange} placeholder="Additional instructions..." className="w-full border p-2 rounded" />
                                <div className="flex justify-end space-x-4">
                                    <button type="submit" className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:opacity-90">Submit</button>
                                    <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-[var(--quaternary-color)] text-black rounded hover:bg-[var(--quaternary-color-dark)]">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <PreviewModal
                    open={previewModalOpen}
                    onClose={() => setPreviewModalOpen(false)}
                >
                    {previewListingData && (
                        <ViewListing
                            detailsDisplay={previewListingData}
                            onClose={() => setPreviewModalOpen(false)}
                        />
                    )}
                </PreviewModal>
                <ReviewsModal
                    open={reviewsModalOpen}
                    onClose={() => setReviewsModalOpen(false)}
                    title={reviewsModalData.title}
                    loading={reviewsModalLoading}
                    error={reviewsModalError}
                    reviews={reviewsModalData.reviews}
                />
            </div>
        </div>
    );
};

export default NewListings;
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    FaArrowLeft,
    FaChevronLeft,
    FaChevronRight,
    FaFile,
    FaFilePdf,
    FaDownload,
    FaComments,
    FaEye
} from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import ReviewsModal from './Reviews';
import { Box, Typography, Button as MuiButton, Divider, Container } from "@mui/material";
import { EventAvailable, QuestionAnswer } from '@mui/icons-material';
import Swiper from '../components/previewlisting/carousel';

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
function DocumentDisplay({ documents }) {
    if (!documents || documents.length === 0) return null;
    const getIcon = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        return ext === 'pdf' ? <FaFilePdf className="text-red-500" /> : <FaFile className="text-blue-500" />;
    };
    return (
        <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-medium mb-2 flex items-center text-gray-700">
                <FaFile className="mr-2" /> Property Documents
            </h4>
            <div className="space-y-2">
                {documents.map((doc, idx) => (
                    <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 bg-white rounded hover:bg-gray-100 group"
                    >
                        {getIcon(doc)}
                        <span className="ml-2 text-gray-600 group-hover:text-blue-600 truncate">
                            Document {idx + 1}
                        </span>
                        <FaDownload className="ml-auto text-gray-400 group-hover:text-blue-500" />
                    </a>
                ))}
            </div>
        </div>
    );
}
function PropertyCard({
    listing,
    expanded,
    currentMediaIndex,
    onExpand,
    onDelete,
    onPrevMedia,
    onNextMedia,
    onShowReviews,
    onPreviewListing,
    onUnapprove,
    onManualVerify,
}) {

    const isVideo = (url) => {
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'flv'];
        const ext = url.split('.').pop().toLowerCase();
        return videoExtensions.includes(ext);
    };

    const allMedia = [...(listing.images || []), ...(listing.videos || [])];
    const currentMedia = allMedia[currentMediaIndex];

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
                        <p><strong>Posted:</strong> {new Date(listing.created_at).toLocaleDateString()}</p>
                    </div>
                )}
                <div className="mt-6 space-y-2">
                    <Button
                        onClick={onExpand}
                        style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                    >
                        {expanded ? 'Hide Details' : 'Show Details'}
                    </Button>

                    <Button
                        onClick={() => onPreviewListing(listing)}
                        style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <FaEye /> <span>Preview Listing</span>
                        </div>
                    </Button>

                    <Button
                        onClick={onShowReviews}
                        style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <FaComments /> <span>Reviews</span>
                        </div>
                    </Button>
                    <Button
                        onClick={onManualVerify}
                        style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                    >
                        {listing.manually_verified === 1
                            ? 'Disable Verification'
                            : 'Enable Verification'}
                    </Button>
                    {listing.is_approved && (
                        <Button
                            onClick={onUnapprove}
                            style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                        >
                            Unapprove
                        </Button>
                    )}
                    <Button
                        onClick={onDelete}
                        style={{ backgroundColor: '#35BEBD', color: '#fff' }}
                    >
                        Delete Listing
                    </Button>
                </div>
            </div>
        </Card>
    );
}
function PreviewModal({ open, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto relative mt-16">
                { }
                {children}
            </div>
        </div>
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
function ViewListing({ detailsDisplay, onClose }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (detailsDisplay) setDetails(detailsDisplay);
    }, [detailsDisplay, id]);

    function formatKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const excludedKeys = [
        'images', 'videos', 'id', 'title', 'location', 'price', 'purpose',
        'size', 'description', 'property_type', 'house_type',
        'amenities', 'likes', 'user_name', 'ownerImage', 'documents',
        'availability_status', 'deleted', 'is_approved', 'user_id', 'created_at', 'updated_at'
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
        <Container maxWidth="lg" sx={{ p: id ? 2 : 0 }}>
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
                    {details.title} in {details.location}, {details.town}, priced at {details.price} Ksh per night
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
            </Box>
        </Container>
    );
}
export default function AdminAllProperties() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [expanded, setExpanded] = useState([]);
    const [mediaIndices, setMediaIndices] = useState({});
    const [message, setMessage] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', reviews: [] });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewListingData, setPreviewListingData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/property/get-all-approved-properties`);
                setListings(data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };
    const handleDelete = (listing) => {
        setListingToDelete(listing);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = async () => {
        if (!listingToDelete) return;
        const { property_type, user_id, id } = listingToDelete;
        setDeleteConfirmOpen(false);
        try {
            await axios.delete(`${API_BASE}/listings/deletelisting/${property_type}/${user_id}/${id}`);
            setListings(prev => prev.filter(item => item.id !== id));
            showMessage('✅ Listing deleted successfully!');
        } catch (err) {
            console.error(err);
            showMessage('❌ Failed to delete listing');
        } finally {
            setListingToDelete(null);
        }
    };
    const fetchAndOpenReviews = async (listing) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const resp = await axios.get(`${API_BASE}/reviews/list`, {
                params: { property_id: listing.id, property_type: listing.property_type },
            });
            setModalData({ title: listing.title, reviews: resp.data.reviews || [] });
        } catch (err) {
            console.error(err);
            setModalError('Failed to load reviews');
            setModalData({ title: listing.title, reviews: [] });
        } finally {
            setModalLoading(false);
            setModalOpen(true);
        }
    };

    const toggleExpand = (id) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const prevMedia = (id, total) => {
        setMediaIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }));
    };
    const nextMedia = (id, total) => {
        setMediaIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }));
    };
    const handlePreviewListing = (listing) => {
        setPreviewListingData(listing);
        setPreviewModalOpen(true);
    }
    const filtered = category === 'all'
        ? listings
        : listings.filter(l => (l.type || l.property_type || '').toLowerCase() === category);
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto" />
                <p className="mt-4 text-gray-600">Loading properties...</p>
            </div>
        </div>
    );
    const handleUnapprove = async (listing) => {
        const formattedType = listing.property_type?.toLowerCase().replace(/s$/, ''); // Convert 'apartments' → 'apartment'

        const payload = {
            property_type: formattedType,
            property_id: listing.id,
            new_status: 'pending'
        };

        console.log('📤 Sending unapproval request with payload:', payload);

        try {
            await axios.put(
                `${API_BASE}/property/update-approval`,
                payload,
                { headers: { "Content-Type": "application/json" } }
            );

            setListings((prev) => prev.filter((l) => l.id !== listing.id));
            showMessage('✅ Listing unapproved successfully!');
        } catch (err) {
            console.error('❌ Unapprove failed:', err);
            showMessage('❌ Failed to unapprove listing.');
        }
    };
    const handleManualVerify = async (listing) => {
        const type = listing.property_type.toLowerCase();
        const id = listing.id;
        const newVal = listing.manually_verified === 1 ? 0 : 1;

        try {
            await axios.put(
                `${API_BASE}/listings/manual-verify/${type}/${id}`,
                { manually_verified: newVal },
                { headers: { 'Content-Type': 'application/json' } }
            );
            setListings((prev) =>
                prev.map(l =>
                    l.id === id ? { ...l, manually_verified: newVal } : l
                )
            );
            showMessage(`✅ Manual verification ${newVal ? 'enabled' : 'disabled'}!`);
        } catch (err) {
            console.error('Manual verify error:', err);
            showMessage('❌ Failed to toggle manual verification.');
        }
    };



    return (
        <div className="min-h-screen flex bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
                <Header onSidebarToggle={() => { }} />
                <main className="p-6 pt-24 md:pt-28 lg:pt-32 max-w-7xl mx-auto">
                    {/* ← Back to Dashboard button */}
                    <div className="pt-6 mb-6">
                        <button
                            onClick={() => navigate('/admin-dashboard')}
                            className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                    {message && (
                        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50">
                            {message}
                        </div>
                    )}
                    <div className="flex items-center mb-8 space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-secondary hover:text-secondary/90 flex items-center"
                        >
                            <FaArrowLeft className="mr-2" /> Back
                        </button>
                        <h1 className="text-3xl font-bold text-primary">Approved Listings</h1>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-8">
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={
                                    `px-5 py-2 rounded-full font-medium transition ${category === c
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                            </button>
                        ))}
                    </div>
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl shadow-card">
                            <p className="text-gray-500 text-lg">No approved listings available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map(listing => {
                                const allMedia = [...(listing.images || []), ...(listing.videos || [])];
                                const currentMediaIndex = mediaIndices[listing.id] || 0;

                                return (
                                    <PropertyCard
                                        key={listing.id}
                                        listing={listing}
                                        expanded={expanded.includes(listing.id)}
                                        currentMediaIndex={currentMediaIndex}
                                        onExpand={() => toggleExpand(listing.id)}
                                        onDelete={() => handleDelete(listing)}
                                        onPrevMedia={() => prevMedia(listing.id, allMedia.length)}
                                        onNextMedia={() => nextMedia(listing.id, allMedia.length)}
                                        onShowReviews={() => fetchAndOpenReviews(listing)}
                                        onPreviewListing={handlePreviewListing}
                                        onUnapprove={() => handleUnapprove(listing)}
                                        onManualVerify={() => handleManualVerify(listing)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
            <ReviewsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalData.title}
                loading={modalLoading}
                error={modalError}
                reviews={modalData.reviews}
            />

            <ConfirmationModal
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this property listing? This action is irreversible."
            />

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
        </div>
    );
}
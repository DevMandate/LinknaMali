import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import DropdownMenu from './DropdownMenu';
import PreviewAd from './PreviewAd';
import EditAd from './EditAd';
import Share from './Share';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ClickAwayListener
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'https://api.linknamali.ke';
const PRIMARY_COLOR = '#29327E';

export default function ManageAds() {
  const { userData } = useAppContext();
  const [ads, setAds] = useState([]);
  const [showDesc, setShowDesc] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [previewAd, setPreviewAd] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [shareAd, setShareAd] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      const userId = userData?.user_id;
      const res = await fetch(`${API_BASE}/user-ads/${userId}`, { credentials: 'include' });
      const { user_ads = [] } = await res.json();
      setAds(user_ads);
    } catch (e) {
      console.error('Failed to fetch ads:', e);
      toast.error('Could not load ads.');
    }
  }

  const handleDeleteClick = async ad => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      const res = await fetch(`${API_BASE}/ads/${ad.ad_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      setAds(prev => prev.filter(a => a.ad_id !== ad.ad_id));
      toast.success('Ad deleted.');
      setDropdownOpen(null);
    } catch (e) {
      console.error('Failed to delete ad:', e);
      toast.error('Could not delete ad.');
    }
  };

  const toggleDesc = id => setShowDesc(prev => ({ ...prev, [id]: !prev[id] }));

  const handleArchiveClick = async ad => {
    const shouldArchive = ad.is_archived !== 1;
    try {
      const res = await fetch(`${API_BASE}/ads/${ad.ad_id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_archived: shouldArchive ? 1 : 0 })
      });
      if (!res.ok) throw new Error('Archive toggle failed');
      setAds(prev =>
        prev.map(a =>
          a.ad_id === ad.ad_id ? { ...a, is_archived: shouldArchive ? 1 : 0 } : a
        )
      );
      toast.success(shouldArchive ? 'Ad archived.' : 'Ad unarchived.');
      setDropdownOpen(null);
    } catch (e) {
      console.error('Failed to toggle archive:', e);
      toast.error('Could not update archive status.');
    }
  };

  const handleEditClick = ad => {
    setEditingAd(ad);
    setIsEditOpen(true);
    setDropdownOpen(null);
  };
  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingAd(null);
  };
  const handlePreviewClick = ad => {
    setPreviewAd(ad);
    setIsPreviewOpen(true);
    setDropdownOpen(null);
  };
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewAd(null);
  };

  const transparentBtn = `
    bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent
    focus:outline-none focus:ring-0
  `;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(ad => (
          <div
            key={ad.ad_id}
            className="relative bg-white border rounded-xl shadow hover:shadow-lg overflow-visible transition-shadow duration-200"
          >
            {/* Header: title + toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h5 className="text-lg font-semibold text-gray-900 truncate">{ad.title}</h5>
              <button
                onClick={() =>
                  setDropdownOpen(open => (open === ad.ad_id ? null : ad.ad_id))
                }
                className={`p-1 ${transparentBtn}`}
              >
                <MoreVertical size={20} color={PRIMARY_COLOR} />
              </button>
            </div>

            {/* DropdownMenu positioned right under toggle, within this card */}
            {dropdownOpen === ad.ad_id && (
              <ClickAwayListener
                mouseEvent="onClick"
                touchEvent="onTouchEnd"
                onClickAway={() => setDropdownOpen(null)}
              >
                <div className="absolute top-12 right-4 z-20">
                  <DropdownMenu
                    property={ad}
                    handleArchiveClick={handleArchiveClick}
                    handleDelete={() => handleDeleteClick(ad)}
                    editProperty={handleEditClick}
                    PreviewAd={handlePreviewClick}
                  />
                </div>
              </ClickAwayListener>
            )}

            {/* Image */}
            <div className="h-48 overflow-hidden">
              {ad.media_urls?.[0] ? (
                <img
                  src={ad.media_urls[0]}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* Description + Share */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => toggleDesc(ad.ad_id)}
                className={`flex items-center text-sm hover:underline ${transparentBtn}`}
                style={{ color: PRIMARY_COLOR }}
              >
                {showDesc[ad.ad_id] ? (
                  <EyeOff size={16} className="mr-1" />
                ) : (
                  <Eye size={16} className="mr-1" />
                )}
                {showDesc[ad.ad_id] ? 'Hide Description' : 'View Description'}
              </button>

              <button
                onClick={() => setShareAd(ad)}
                className={`p-1 ${transparentBtn}`}
                style={{ color: PRIMARY_COLOR }}
                aria-label="Share Ad"
              >
                <Share2 size={18} />
              </button>
            </div>

            {showDesc[ad.ad_id] && (
              <div className="px-4 pb-3 text-gray-700 text-sm">
                {ad.description}
              </div>
            )}

            {/* Archive */}
            <div className="flex items-center justify-center px-4 py-3 border-t">
              <button
                onClick={() => handleArchiveClick(ad)}
                className={`inline-flex items-center text-sm hover:underline ${transparentBtn}`}
                style={{ color: PRIMARY_COLOR }}
              >
                {ad.is_archived === 1 ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Share Dialog */}
      {shareAd && (
        <Dialog open fullWidth maxWidth="sm" onClose={() => setShareAd(null)}>
          <DialogTitle>
            Share Ad: {shareAd.title}
            <IconButton
              onClick={() => setShareAd(null)}
              sx={{
                position: 'absolute', right: 8, top: 8,
                backgroundColor: 'transparent', '&:hover': { backgroundColor: 'transparent' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Share details={shareAd} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      <EditAd open={isEditOpen} ad={editingAd} onClose={handleCloseEdit} onUpdated={fetchAds} />

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} fullWidth maxWidth="lg" onClose={handleClosePreview}>
        <DialogTitle>
          Preview Ad
          <IconButton
            onClick={handleClosePreview}
            sx={{
              position: 'absolute', right: 8, top: 8,
              backgroundColor: 'transparent', '&:hover': { backgroundColor: 'transparent' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewAd && <PreviewAd detailsDisplay={previewAd} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

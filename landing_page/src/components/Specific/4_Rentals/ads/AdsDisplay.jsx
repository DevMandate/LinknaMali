import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { keyframes } from '@emotion/react';
import { useMediaQuery } from '@mui/material';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import AdEnquiryModal from './Inquiries'; // import enquiry modal

// Blinking animation
const blink = keyframes`
  0%,100% { box-shadow: 0 0 4px var(--secondary-color); }
  50%    { box-shadow: 0 0 12px var(--secondary-color); }
`;
const blinkText = keyframes`
  0%,100% { opacity: 1; }
  50%     { opacity: 0.6; }
`;

const shared = {
  ads: [],
  leftIndex: 0,
  rightIndex: 1,
  subscribers: [],
  interval: null
};

function startRotation(interval) {
  if (shared.interval) return;
  shared.interval = setInterval(() => {
    if (shared.ads.length < 2) return;
    shared.leftIndex = (shared.leftIndex + 1) % shared.ads.length;
    let nextR = (shared.rightIndex + 1) % shared.ads.length;
    if (nextR === shared.leftIndex) nextR = (nextR + 1) % shared.ads.length;
    shared.rightIndex = nextR;
    shared.subscribers.forEach(fn => fn());
  }, interval);
}

export default function AdsDisplay({ interval = 30000, variant = 'normal' }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [ad, setAd] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [prevAd, setPrevAd] = useState(null);
  const isHighlight = variant === 'highlight';
  const positionRef = useRef(null);

  useEffect(() => {
    axios.get('https://api.linknamali.ke/all-ads')
      .then(({ data }) => {
        const normalized = Array.isArray(data.all_ads) ? data.all_ads.map(a => ({
          id: a.ad_id,
          title: a.title,
          description: a.description,
          media_urls: a.media_urls,
          start_date: a.start_date,
          end_date: a.end_date,
          budget: a.budget,
          payment_method: a.payment_method,
          payment_status: a.payment_status,
          status: a.status,
          user: a.user
        })) : [];
        shared.ads = normalized.filter(a => a.status?.toLowerCase() === 'approved');
        shared.leftIndex = 0;
        shared.rightIndex = shared.ads.length > 1 ? 1 : 0;
        positionRef.current = shared.subscribers.length;
        setAd(shared.ads[positionRef.current === 0 ? shared.leftIndex : shared.rightIndex] || null);
        startRotation(interval);
        const subscriber = () => {
          const idx = positionRef.current === 0 ? shared.leftIndex : shared.rightIndex;
          setAd(shared.ads[idx] || null);
        };
        shared.subscribers.push(subscriber);

        return () => {
          shared.subscribers = shared.subscribers.filter(fn => fn !== subscriber);
          if (!shared.subscribers.length && shared.interval) {
            clearInterval(shared.interval);
            shared.interval = null;
          }
        };
      })
      .catch(console.error);
  }, [interval]);

  if (!ad) return <Typography>No ads available.</Typography>;

  const cardStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    p: 2,
    borderRadius: 2,
    border: `2px solid ${isHighlight ? 'var(--secondary-color)' : 'var(--primary-color)'}`,
    backgroundColor: isHighlight ? 'rgba(53,190,189,0.1)' : 'rgba(41,50,126,0.1)',
    animation: isHighlight ? `${blink} 2s infinite` : 'none',
    cursor: 'pointer'
  };

  const openEnquiry = () => {
    const currentAd = selectedAd || ad;
    console.log('Inquiring on Ad ID:', currentAd.id);
    localStorage.setItem('inquiryAdId', currentAd.id);
    setPrevAd(currentAd);
    setShowEnquiry(true);
    setSelectedAd(null);
  };

  const handleEnquiryClose = () => {
    setShowEnquiry(false);
    setSelectedAd(prevAd);
    setPrevAd(null);
  };

  return (
    <>
      <Box
        sx={{
          width: 220,
          height: 280,
          mb: 2,
          display: { xs: 'none', sm: 'block' } // Hides on mobile only
        }}
      >
        <Card sx={cardStyles} onClick={() => setSelectedAd(ad)}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ color: 'var(--primary-color)', fontWeight: 700, mb: 1, animation: `${blinkText} 3s infinite` }}
          >
            {ad.title}
          </Typography>
          {ad.media_urls?.[0] ? (
            <CardMedia
              component="img"
              height="130"
              image={ad.media_urls[0]}
              alt={ad.title}
              sx={{ objectFit: 'cover', borderRadius: 1, mb: 1 }}
              onError={e => { e.target.src = '/default-placeholder.jpg'; }}
            />
          ) : (
            <Box height={130} display="flex" alignItems="center" justifyContent="center" bgcolor="grey.200" mb={1}>
              <Typography variant="caption">No Image</Typography>
            </Box>
          )}
          <Typography
            variant="body2"
            noWrap
            sx={{ color: 'var(--secondary-color)', fontStyle: 'italic', animation: `${blinkText} 4s infinite` }}
          >
            {ad.user?.email}
          </Typography>
        </Card>
      </Box>

      {selectedAd && !showEnquiry && (
        <Dialog open onClose={() => setSelectedAd(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}>{selectedAd.title}</DialogTitle>
          <DialogContent dividers>
            {selectedAd.media_urls?.[0] && (
              <Box textAlign="center" mb={2}>
                <CardMedia
                  component="img"
                  height="200"
                  image={selectedAd.media_urls[0]}
                  alt={selectedAd.title}
                  onError={e => { e.target.src = '/default-placeholder.jpg'; }}
                />
              </Box>
            )}
            <Typography variant="body1" gutterBottom>{selectedAd.description}</Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Advertiser: {selectedAd.user?.first_name} {selectedAd.user?.last_name} ({selectedAd.user?.email})
            </Typography>
            <Box mt={2}>
              <Typography><strong>Start:</strong> {new Date(selectedAd.start_date).toLocaleDateString()}</Typography>
              <Typography><strong>End:</strong> {new Date(selectedAd.end_date).toLocaleDateString()}</Typography>
              <Typography><strong>Budget:</strong> {selectedAd.budget}</Typography>
              <Typography><strong>Payment:</strong> {selectedAd.payment_method} ({selectedAd.payment_status})</Typography>
              <Typography><strong>Status:</strong> {selectedAd.status}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedAd(null)}>Close</Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#fff',
                color: 'var(--secondary-color)',
                border: '1px solid var(--secondary-color)',
                '&:hover': {
                  backgroundColor: 'var(--secondary-color)',
                  color: '#fff'
                }
              }}
              onClick={openEnquiry}
            >Inquire</Button>
          </DialogActions>
        </Dialog>
      )}

      {showEnquiry && (
        <AdEnquiryModal adId={prevAd?.id} onClose={handleEnquiryClose} />
      )}
    </>
  );
}

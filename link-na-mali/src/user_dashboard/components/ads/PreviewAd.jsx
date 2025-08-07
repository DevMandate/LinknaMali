import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Divider, Container } from '@mui/material';
import { EventAvailable, QuestionAnswer } from '@mui/icons-material';
import ImageCarousel from './carousel';

function Details({ detailsDisplay }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (detailsDisplay) setDetails(detailsDisplay);
  }, [detailsDisplay]);

  function formatKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const excludedKeys = [
    'media_urls', 'videos', 'id', 'title', 'location', 'price', 'purpose',
    'size', 'description', 'property_type', 'house_type',
    'amenities', 'likes', 'user_name', 'ownerImage', 'documents',
    'availability_status', 'deleted', 'is_approved', 'user_id', 'created_at', 'updated_at'
  ];

  const handleBooking = (d) => console.log('Booking:', d);
  const handleEnquiry = (d) => console.log('Enquiry:', d);

  if (!open || !details) return null;

  return (
    // Narrower card centered
    <Container maxWidth="md" sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>

      {/* Image carousel with margin and full width */}
      {details.media_urls?.length > 0 && (
        <Box sx={{ mb: 3, '& .swiper-container': { height: 300 } }}>
          <ImageCarousel images={details.media_urls} />
        </Box>
      )}

      {/* Videos grid */}
      {details.videos?.length > 0 && (
        <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {details.videos.map((src, i) => (
            <Box key={i} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
              <video src={src} controls style={{ width: '100%', display: 'block' }} />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ p: 3, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
          {details.title}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
          {details.location}, {details.town} • {details.price} Ksh/night
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {(details.purpose === 'Sale' || details.purpose === 'Short Stay') && (
            <Button variant="contained" endIcon={<EventAvailable />} onClick={() => handleBooking(details)}>
              {details.property_type === 'land' ? 'Reserve' : 'Book'}
            </Button>
          )}
          <Button variant="outlined" endIcon={<QuestionAnswer />} onClick={() => handleEnquiry(details)}>
            Enquire
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ mb: 2 }}>{details.description}</Typography>

        {Object.entries(details).map(([key, val]) => {
          if (excludedKeys.includes(key)) return null;
          return (
            <Typography key={key} sx={{ mb: 1 }}>
              <strong>{formatKey(key)}:</strong> {typeof val === 'object' ? JSON.stringify(val) : val}
            </Typography>
          );
        })}
      </Box>
    </Container>
  );
}

export default Details;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, Divider, Container } from "@mui/material";
import { EventAvailable, QuestionAnswer } from '@mui/icons-material';
import Swiper from './carousel'; // unified media carousel

/**
 * Details renders the ad preview layout (no Dialog wrapper).
 */
function Details({ detailsDisplay }) {
  const navigate = useNavigate();
  const { id, property_type } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (detailsDisplay) setDetails(detailsDisplay);
  }, [detailsDisplay]);

  function formatKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const excludedKeys = [
    'images','videos','id','title','location','price','purpose',
    'size','description','property_type','house_type',
    'amenities','likes','user_name','ownerImage','documents',
    'availability_status','deleted','is_approved','user_id','created_at','updated_at'
  ];

  const handleBooking = (d) => console.log('Booking:', d);
  const handleEnquiry = (d) => console.log('Enquiry:', d);

  if (!details) return null;

  // Combine images and videos into one media array
  const media = [];
  if (details.images?.length > 0) {
    details.images.forEach((src) => media.push({ type: 'image', src }));
  }
  if (details.videos?.length > 0) {
    details.videos.forEach((src) => media.push({ type: 'video', src }));
  }

  return (
    <Container maxWidth="lg" sx={{ p: id ? 2 : 0 }}>
      {/* Unified Media Carousel */}
      {media.length > 0 && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <Swiper media={media} />
        </Box>
      )}

      <Box sx={{
        p: 2,
        boxShadow: 3,
        borderRadius: 1,
        backgroundColor: 'var(--hamburger)',
        width: '100%',
        maxWidth: 600,
        mx: 'auto'
      }}>
        <Typography variant="h6" sx={{ mb: 1, color: 'var(--primary-color)' }}>
          {details.title} in {details.location}, {details.town}, priced at {details.price} Ksh per night
        </Typography>

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
            <Button
              variant="contained"
              sx={{ backgroundColor: 'var(--secondary-color)' }}
              endIcon={<EventAvailable />}
              onClick={() => handleBooking(details)}
            >
              {details.property_type === 'land' ? 'Reserve' : 'Book'}
            </Button>
          )}
          <Button
            variant="contained"
            sx={{ backgroundColor: 'var(--primary-color)' }}
            endIcon={<QuestionAnswer />}
            onClick={() => handleEnquiry(details)}
          >
            Make an Enquiry
          </Button>
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

export default Details;

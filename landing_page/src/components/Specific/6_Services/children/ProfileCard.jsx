import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button
} from '@mui/material';
import { CalendarMonth, ChatBubbleOutline, Star } from '@mui/icons-material';
import { useTheme } from '../../../../context/Theme';
import { useLogin } from '../../../../context/IsLoggedIn';
import ReviewModal from '../ReviewsModal';

const API_BASE_URL = 'https://api.linknamali.ke';

const ProfileCard = ({ profile }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { userData } = useLogin();

  const [openReview, setOpenReview] = useState(false);

  const imageUrl = profile.media?.[0]?.media_url || 'https://via.placeholder.com/300x200';

  const handleEnquiryClick = () => {
    navigate(`/service-enquiries/${profile.profile_id}`);
  };

  const handleBookClick = () => {
    navigate(`/service-bookings/${profile.profile_id}/create`);
  };

  const handleReviewClick = () => {
    setOpenReview(true);
  };

  const handleCloseModal = () => {
    setOpenReview(false);
  };

  return (
    <>
     <Card
        className="profile-card"
        sx={{
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
          color: theme === 'dark' ? '#fff' : '#000',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: 345,
          margin: 'auto',
          minHeight: 380, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >

        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={profile.business_name}
          onClick={() => navigate(`/service-providers/view/${profile.profile_id}`)}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.95,
            },
          }}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Typography variant="h6">{profile.business_name}</Typography>
          <Typography variant="body2" color={theme === 'dark' ? 'gray' : 'textSecondary'}>
            {profile.description}
          </Typography>

          <Box
              className="contact-buttons"
              mt="auto"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
              sx={{
                flexWrap: 'nowrap',
                marginTop: 1,
              }}
            >
              <Button
                  variant="contained"
                  startIcon={<CalendarMonth />}
                  onClick={handleBookClick}
                  sx={{
                    backgroundColor: '#29327E',
                    '&:hover': { backgroundColor: '#1f265f' },
                    color: '#fff',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    flex: 1,
                  }}
                >
                  BOOK
                </Button>


              <Button
                  variant="contained"
                  startIcon={<ChatBubbleOutline />}
                  onClick={handleEnquiryClick}
                  sx={{
                    backgroundColor: '#29327E',
                    '&:hover': { backgroundColor: '#1f265f' },
                    color: '#fff',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    flex: 1,
                  }}
                >
                  ENQUIRY
                </Button>


              <Button
                  variant="contained"
                  startIcon={<Star />}
                  onClick={handleReviewClick}
                  sx={{
                    backgroundColor: '#29327E',
                    '&:hover': { backgroundColor: '#1f265f' },
                    color: '#fff',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    flex: 1,
                  }}
                >
                  Reviews
                </Button>

            </Box>
        </CardContent>
      </Card>

      <ReviewModal
        open={openReview}
        onClose={handleCloseModal}
        propertyId={profile.profile_id}
        propertyType="service"
      />
    </>
  );
};

export default ProfileCard;

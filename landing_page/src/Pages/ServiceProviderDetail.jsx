import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';

const ServiceProviderDetail = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`https://api.linknamali.ke/getprofilebyprofileid/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError('Failed to load service provider.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4, px: 2 }}>
      <Card>
        <CardMedia
          component="img"
          height="300"
          image={profile.media?.[0]?.media_url || 'https://via.placeholder.com/800x300'}
          alt={profile.business_name}
        />
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {profile.business_name}
          </Typography>
          <Typography variant="body1" paragraph>
            {profile.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Location: {profile.location || 'N/A'}
          </Typography>
        </CardContent>
      </Card>

      {/* Add additional sections here */}
      {/* Services, Reviews, Ratings, Location Map, etc. */}
    </Box>
  );
};

export default ServiceProviderDetail;

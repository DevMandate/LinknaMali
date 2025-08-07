import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';

const BASE_URL = 'https://linknamali.ke';

/**
 * Fetches and displays enquiries for a given ad.
 *
 * Props:
 * - adId: string or number of the ad to fetch enquiries for
 */
export default function AdInquiriesList({ adId }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!adId) return;
    setLoading(true);
    setError('');

    axios.get(`${BASE_URL}/ads/${adId}/enquiries`)
      .then(({ data }) => {
        setEnquiries(data.enquiries || []);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load enquiries';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [adId]);

  if (!adId) {
    return <Typography variant="body2" color="textSecondary">No ad selected.</Typography>;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (enquiries.length === 0) {
    return <Typography>No enquiries found for ad {adId}.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Enquiries for Ad #{adId}
      </Typography>
      <List>
        {enquiries.map(({ id, name, email, phone, message, created_at }) => (
          <ListItem key={id} alignItems="flex-start">
            <ListItemText
              primary={`${name || 'Guest'} (${email || 'no email'})`}
              secondary={
                <>
                  <Typography variant="body2" component="span">
                    {message}
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    {phone && `Phone: ${phone} • `}
                    {new Date(created_at).toLocaleString()}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

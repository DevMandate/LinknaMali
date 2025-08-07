import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Rating,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Divider,
  Stack
} from '@mui/material';
import { useLogin } from '../../../context/IsLoggedIn';

const API_BASE_URL = 'https://api.linknamali.ke';

export default function ReviewModal({ open, onClose, propertyId, propertyType }) {
  const { userData } = useLogin();
  const [reviewsData, setReviewsData] = useState({ property: null, reviews: [] });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) fetchReviews();
  }, [open]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/reviews/list?property_id=${propertyId}&property_type=${propertyType}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load reviews.');
        setReviewsData({ property: null, reviews: [] });
      } else {
        setReviewsData(data);
      }
    } catch (e) {
      console.error('Failed loading reviews', e);
      setError('Network error while loading reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const userId = userData?.user_id || userData?.id;
    if (!userId) return alert('Please log in to submit a review.');

    try {
      const res = await fetch(`${API_BASE_URL}/reviews/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          property_id: propertyId,
          property_type: propertyType,
          rating,
          comment
        })
      });

      if (res.status !== 200) {
        const { error } = await res.json();
        return alert(error || 'Failed to submit review.');
      }

      setRating(0);
      setComment('');
      fetchReviews();
    } catch (e) {
      console.error('Submit error', e);
      alert('Network error while submitting review.');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString();

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Reviews</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mb={3}>
          <Typography variant="subtitle1">Add Your Review</Typography>
          <Rating value={rating} onChange={(_, v) => setRating(v)} />
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Stack>

        <Button
          onClick={handleSubmit}
          disabled={!rating || !comment.trim()}
          variant="contained"
        >
          Submit
        </Button>

        <Divider sx={{ my: 3 }} />

        {loading ? (
          <Typography align="center" sx={{ my: 2 }}>
            Loading...
          </Typography>
        ) : error ? (
          <Typography color="error" align="center" sx={{ my: 2 }}>
            {error}
          </Typography>
        ) : !reviewsData.reviews.filter((r) => r.review.is_visible === 1).length ? (
          <Typography align="center" sx={{ my: 2 }}>
            No visible reviews yet.
          </Typography>
        ) : (
          <Stack spacing={2} mt={2}>
            {reviewsData.reviews
              .filter((r) => r.review.is_visible === 1)
              .map(({ review, reviewer }) => (
                <Card key={review.id} variant="outlined">
                  <CardHeader
                    avatar={<Avatar><Typography>{reviewer.first_name.charAt(0)}</Typography></Avatar>}
                    title={<Rating value={review.rating} readOnly size="small" />}
                    subheader={`${reviewer.first_name} ${reviewer.last_name} • ${formatDate(
                      review.created_at
                    )}`}
                  />
                  <CardContent>
                    <Typography variant="body2">{review.comment}</Typography>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

ReviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  propertyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  propertyType: PropTypes.string.isRequired
};

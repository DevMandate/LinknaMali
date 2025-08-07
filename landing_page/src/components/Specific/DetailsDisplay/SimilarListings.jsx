// Landing_page/src/components/Specific/DetailsDisplay/SimilarListings.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardMedia, Button, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SimilarListings({ propertyType, propertyId }) {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!propertyType || !propertyId) return;
    axios
      .get(`https://api.linknamali.ke/property/similarlistings/${propertyType}/${propertyId}`)
      .then((response) => {
        console.log("✅ Similar listings response:", response.data);
        setListings(response.data.similar_listings || []);
      })
      .catch((error) => {
        console.error("Error fetching similar listings:", error);
      });
  }, [propertyType, propertyId]);

  if (listings.length === 0) return null;

  return (
    <Box mt={5}>
     <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#29327E' }}
        >
        Similar Listings
        </Typography>

        <Grid container spacing={3}>
        {listings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={listing.id}>
            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    }
                }}
                onClick={() => navigate(`/property/${propertyType}/${listing.id}`)}
                >
                <CardMedia
                    component="img"
                    height="180"
                    image={listing.images?.[0] || "/placeholder.jpg"}
                    alt={listing.title}
                    sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {listing.title || 'Untitled Property'}
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                    Location: <span style={{ color: '#35BEBD', fontWeight: 'normal' }}>
                        {listing.town || 'Unknown'}, {listing.locality || listing.location || 'Unknown'}
                    </span>
                    </Typography>

                    {listing.purpose && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                        Purpose: <span style={{ color: '#35BEBD', fontWeight: 'normal' }}>
                        {listing.purpose}
                        </span>
                    </Typography>
                    )}

                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                    Price: <span style={{ color: '#35BEBD', fontWeight: 'normal' }}>
                        KSh {listing.price?.toLocaleString() || 'N/A'}
                    </span>
                    </Typography>

                    <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        mt: 2,
                        textTransform: "none",
                        backgroundColor: '#29327E',
                        '&:hover': { backgroundColor: '#1f2860' }
                    }}
                    >
                    View Details
                    </Button>
                </CardContent>
                </Card>

            </Grid>
        ))}
        </Grid>
    </Box>
  );
}

export default SimilarListings;

import React,{useState, useEffect} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import { useLogin } from '../../../../context/IsLoggedIn';
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import CircularProgress from '../../../Common/circularProgress';
import axios from 'axios';

const BookingDetails = ({ Action=[] }) => {
  //Action is using in cancelBooking to hide 3dotted button
  const { 
      isLoggedIn,
      authLoading,
      setPendingAction,
      setActionSuccess,
  } = useLogin();
  const navigate = useNavigate();
  const {setPriorityDisplay} = usePriorityDisplay();
  const [item, setItem] = useState(null);
  //The card has a maxwidth of 600px
  const isMobile = useMediaQuery("(max-width: 620px)");
  
  /**Internal Object setting */
  const booking = item?.booking || {};  
  const property = item?.property || {}; 

  /**External links */ 
  const { id } = useParams();

  useEffect(() => {
    axios.get(`https://api.linknamali.ke/bookings/getbookingbyid/${id}`)
        .then(response => {
            setItem(response.data.data);
        })
        .catch(error => {
            //console.error(error);
        });
  }, []);

  /**Handle url access without login */
  useEffect(() => {
    if(isLoggedIn || authLoading) return;
    if (!isLoggedIn && item) {
      setPendingAction(true)
      const pendingPath = `/bookings/${id}`;
      sessionStorage.setItem("pendingPath", pendingPath);
      navigate(`/login`); 
    }
  }, [isLoggedIn, item, authLoading]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  function handleEdit() {
    navigate(`/bookings/hub/${item.booking.property_type}/${item.booking.id}/edit`);
  }

  function handleDelete() {
    navigate(`/bookings/cancel/${item.booking.id}`);
  }

  return (
    isLoggedIn && item ?(
    <Card 
      sx={{ 
        maxWidth: 600,
        mx: isMobile && id ? 1 : "auto",
        p: 2, 
        my: id ? 1 : 0,
        borderRadius: 1,
        backgroundColor:'var(--hamburger)', color:'var(--text)',
    }}>
      <CardContent>
        {/* Header with Three-Dot Menu */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Booking Details
          </Typography>
          {Action[0]!=='cancelBooking' && booking?.status!=='rejected' &&(
          <IconButton sx={{color:'var(--text)'}} onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>)}
          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem onClick={()=>{handleMenuClose(); handleEdit()}}>Edit</MenuItem>
            <MenuItem onClick={()=>{handleMenuClose(); handleDelete()}}>Cancel Booking</MenuItem>
          </Menu>
        </Box>

        <Divider sx={{ my: 2 }} />
        {booking?.status && booking.status==='rejected' && (
          <>
          <h3>We regret to inform you that your booking has been canceled.</h3>
          <h3 className="mb-2">The property owner of {property.title} gives the following reason:</h3>
          <h3>{booking?.rejection_message}</h3>
          <h3 className="mt-2">Please feel free to contact us if you have any questions or require assistance with alternative arrangements.</h3>
          <Divider sx={{ my: 2 }} />
          </>
        )}
        {/* Booking Info (if available) */}
        {Object.keys(booking).length > 0 ? (
          <Grid container spacing={2}>
            {Object.entries(booking).map(([key, value]) => (
              !['property_type', 'property_id','user_id','id'].includes(key) && value && (
                <Grid item="true" xs={6} key={key}>
                  <Typography variant="body2" color="#6B6B6B">
                    {key.replace(/_/g, " ").toUpperCase()}:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {typeof value === 'string' ? value.replace(/_/g, " ") : value}
                  </Typography>
                </Grid>
              )
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="#6B6B6B" textAlign="center">
            No booking details available.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Property Details */}
        {Object.keys(property).length > 0 ?(<><Typography variant="h6" fontWeight={600} gutterBottom>
          Property Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item="true" xs={12}>
          <Typography variant="body2" color="#6B6B6B">
              NAME:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {property.title}
            </Typography>
          </Grid>
          <Grid item="true" xs={6}>
            <Typography variant="body2" color="#6B6B6B">
              PROPERTY TYPE:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {property.property_type}
            </Typography>
          </Grid>
          <Grid item="true" xs={6}>
            <Typography variant="body2" color="#6B6B6B">
              PURPOSE:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {property.purpose}
            </Typography>
          </Grid>
          <Grid item="true" xs={12}>
            <Typography variant="body2" color="#6B6B6B">
              LOCATION:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {property.location}
            </Typography>
          </Grid>
          <Grid item="true" xs={6}>
            <Typography variant="body2" color="#6B6B6B">
              SIZE:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {property.size}
            </Typography>
          </Grid>
          <Grid item="true" xs={6}>
            <Typography variant="body2" color="#6B6B6B">
              PRICE:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              Ksh {property.price}
            </Typography>
          </Grid>
          {property?.amenities && (
            <Grid item="true" xs={12}>
              <Typography variant="body2" color="#6B6B6B">
                AMENITIES:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {property.amenities}
              </Typography>
            </Grid>
          )}

          {property?.number_of_bedrooms && (
            <Grid item="true" xs={6}>
              <Typography variant="body2" color="#6B6B6B">
                BEDROOMS:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {property.number_of_bedrooms}
              </Typography>
            </Grid>
          )}

          {property?.number_of_bathrooms && (
            <Grid item="true" xs={6}>
              <Typography variant="body2" color="#6B6B6B">
                BATHROOMS:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {property.number_of_bathrooms}
              </Typography>
            </Grid>
          )}

          {property?.description && (
            <Grid item="true" xs={12}>
              <Typography variant="body2" color="#6B6B6B">
                DESCRIPTION:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {property.description}
              </Typography>
            </Grid>
          )}
        </Grid></>):(
          <Typography variant="body1" color="#6B6B6B" textAlign="center">
            No property details available.
          </Typography>
        )}
      </CardContent>
    </Card>
    ):(<CircularProgress/>)
  );
};

export default BookingDetails;

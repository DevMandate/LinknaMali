import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, Typography, Card, CardContent, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSearchEngine } from '../../../../../context/SearchEngine';
import { useLogin } from '../../../../../context/IsLoggedIn';
import NoBookings from './NoBookings';
import Swiper from '../../carousel'

const HomeBookings = () => {
    const { userData } = useLogin();
    const navigate = useNavigate();
    const { setSearchEngine } = useSearchEngine();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState({ anchorEl: null, bookingId: null });

    const handleClick = (event, bookingId) => {
        setMenuAnchor({ anchorEl: event.currentTarget, bookingId });
    };

    const handleClose = () => {
        setMenuAnchor({ anchorEl: null, bookingId: null });
    };

    const fetchBookings = async () => {
        if (!userData?.user_id) return;
        try {
            setSearchEngine(true);
            const response = await fetch(`https://api.linknamali.ke/bookings/getbookings?user_id=${userData.user_id}`);
            if (!response.ok) {
                setSearchEngine(false);
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.response === "Success") {
                setBookings(data.data);
                setSearchEngine(false);
            } else {
                setError(data.response);
                setSearchEngine(false);
            }
        } catch (err) {
            setError(err.message);
            setSearchEngine(false);
        }
    };
    useEffect(() => {
        fetchBookings();
    }, [userData?.user_id]);

    function handleViewMore(item) {
        navigate(`/bookings/${item.booking.id}`);
    }
    function handleDelete(item) {
        navigate(`/bookings/cancel/${item.booking.id}`);
    }

return(
    <Box
        id='my-bookings'
        sx={{
            display: 'grid',
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 500px))",
            gap: "20px",
            marginTop: "20px",
            "@media (max-width: 670px)": {
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            },
        }}
    >
        {bookings.length > 0 ? (
            bookings.map((item) => (
                <Card
                    key={item.booking.id}
                    sx={{
                        padding: "5px",
                        backgroundColor: "var(--hamburger)",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        borderRadius: "5px",
                    }}
                >
                    <CardContent sx={{ position: "relative", color: "var(--text)" }}>
                        {item.property &&(<>
                        <Typography variant="h6" sx={{ width: "90%" }}>
                            {item.property?.title} in {item.property?.location}
                        </Typography>
                        {item?.property?.images &&(<Swiper images={item?.property?.images} height='100'/>)}
                        </>)}
                        <Typography variant="body2" sx={{ color: "gray", mt:1 }}>
                            Booking made on {item.booking.created_at} by{" "}
                            {item.booking.user_name}
                        </Typography>
                        <Typography>
                            Status:{" "}
                            {item.booking.status==='pending' &&(
                                <span style={{color:'var(--merime-theme)'}}>Waiting for confirmation</span>
                            )}
                            {item.booking.status==='confirmed' &&(
                                <span style={{color:'green'}}>Confirmed</span>
                            )}
                            {item.booking.status==='rejected' &&(
                                <span style={{color:'red'}}>Action Required</span>
                            )}
                        </Typography>
                        <Box sx={{ position: "absolute", top: "5px", right: "5px" }}>
                            <IconButton sx={{color:'var(--text)'}} onClick={(event) => handleClick(event, item.booking.id)}>
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={menuAnchor.anchorEl}
                                open={Boolean(menuAnchor.anchorEl && menuAnchor.bookingId === item.booking.id)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => { handleViewMore(item); handleClose(); }}>
                                    View more details
                                </MenuItem>
                                <MenuItem onClick={() => { handleDelete(item); handleClose(); }}>
                                    Cancel Booking
                                </MenuItem>
                            </Menu>
                        </Box>
                    </CardContent>
                </Card>
            ))):(
                <NoBookings/>
            )}
    </Box>
);
};

export default HomeBookings;

import React from "react";
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, useMediaQuery } from "@mui/material";
import { usePriorityDisplay } from '../../../../context/PriorityDisplay';
import { useLogin } from '../../../../context/IsLoggedIn';
import { scrollIntoView } from '../../../../utils/scrollIntoView';

function Heading() {
  const navigate = useNavigate();
  const { isLoggedIn } = useLogin();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const isMobile = useMediaQuery("(max-width:1260px)");

  function handleSignup() {
    navigate('/signup');
    setPriorityDisplay('signup');
    scrollIntoView('signup');
  }

  return (
    <Box
      id='hero heading'
      sx={{
        position: 'relative',
        display: isLoggedIn ? 'none' : (priorityDisplay === null || priorityDisplay === 'about us' ? 'flex' : 'none'),
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 2,
        minHeight: '40vh',
        background: 'transparent', // ✅ Ensure no background
        marginTop: { xs: '100px', sm: 0 },
        '@media (max-width:768px)': {
          marginTop: '100px', // ✅ Adds space under header for mobile
        },
        '@media (max-width:350px)': {
          minHeight: '80vh'
        },
      }}
    >
      <Typography
        variant="h3"
        color="white"
        sx={{
          wordWrap: 'break-word',
          whiteSpace: 'normal',
          '@media (max-width:750px)': {
            fontSize: '2.5rem',
          },
        }}
      >
        Find Your Dream Property with Ease
      </Typography>

      <Typography
        sx={{
          fontSize: '2rem',
          color: "white",
          marginTop: '50px',
          '@media (max-width:350px)': { marginTop: '30px' },
        }}
      >
        Welcome to Linknamali
      </Typography>

      <Typography
        variant="h5"
        color="white"
        sx={{
          maxWidth: '800px',
          '@media (max-width:1260px)': {
            fontSize: '1.2rem',
          },
        }}
      >
        Searching for a home, investment, or vacation rental along the Kenyan coast? Linknamali simplifies property discovery and acquisition.
      </Typography>

      {isMobile && (
        <Button
          onClick={handleSignup}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            mt: 3
          }}
        >
          Get Started
        </Button>
      )}
    </Box>
  );
}

export default Heading;

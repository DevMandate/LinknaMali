import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import { usePriorityDisplay } from '../../../../context/PriorityDisplay';
import { useLogin } from "../../../../context/IsLoggedIn";
import { gridSize } from '../../../../utils/gridSize';
import { useMediaQuery, Typography, Box, Container } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';

function Options() {
  const navigate = useNavigate();
  const { isLoggedIn } = useLogin();
  const [hoveredCity, setHoveredCity] = useState(null);
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 910px)");

  const [fetchedCities, setFetchedCities] = useState([]);
  const CitiesResponsive = isLoggedIn
    ? fetchedCities
    : (fetchedCities?.length ? gridSize(isSmallScreen, priorityDisplay, 'properties', fetchedCities, 3, 6) : []);

  useEffect(() => {
    fetch('https://api.linknamali.ke/property/getlocations')
      .then((response) => response.json())
      .then((data) => {
        setFetchedCities(data.data || []);

      })
      .catch(error => {
        //console.error(error);
      });
  }, []);

  const handleProperty = (city) => {
    const queryParams = new URLSearchParams();
    queryParams.append("location", city.name);
    const query = queryParams.toString();
    navigate(`/search?${query}`);
  };


  return (
    CitiesResponsive.length > 0 ? (
      <Container maxWidth="xl">
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {CitiesResponsive.map((city) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={city.id}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 360,
                  height: 270,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  }
                }}
                onClick={() => handleProperty(city)}
              >
                <img
                  src={city.image_url}
                  alt={city.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.35)',
                    color: 'white',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '10px',
                  }}
                >
                  <Box>
                    <Typography fontWeight="bold">{city.name}</Typography>
                    <Typography fontSize="0.875rem">{city.listings} listings</Typography>
                  </Box>
                  <LocationOnIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    ) : (
      <Container sx={{ minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={50} />
      </Container>
    )
  );
}

export default Options;

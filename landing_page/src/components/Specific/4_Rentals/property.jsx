import React, { useEffect, useState } from "react";
import { Box, Container, Typography, useMediaQuery } from "@mui/material";
import CircularProgress from '../../Common/circularProgress';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import { useLogin } from "../../../context/IsLoggedIn";
import { useSearchEngine } from '../../../context/SearchEngine';
import Heading from '../../Common/heading';
import SearchResults from '../0_Search/searchResults';
import Options from '../0_Search/Standard/select/Options';
import axios from 'axios';

function Property() {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const { activeButton, purpose } = useSearchEngine();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const isMobile = useMediaQuery("(max-width: 813px)");

  const Title = 'Featured Rentals & Short Stays';
  const Subtitle = 'Find your perfect home away from home.';

  useEffect(() => {
    axios.get('https://api.linknamali.ke/property/getaccomodation')
      .then(response => {
        const filteredData = response.data.data.map((item) => {
          return Object.fromEntries(
            Object.entries(item).filter(([key]) => key !== "user_id" && key !== "created_at" && key !== "updated_at")
          );
        });
        setProperties(filteredData);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (activeButton === null) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter((property) => property.purpose === purpose);
      setFilteredProperties(filtered);
    }
  }, [activeButton, properties, purpose]);

  useEffect(() => {
    if (priorityDisplay === 'rentals') {
      const scrollY = sessionStorage.getItem('rentalsScrollY');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        sessionStorage.removeItem('rentalsScrollY');
      }
    }
  }, [priorityDisplay]);

  const handleViewMore = () => {
    sessionStorage.setItem('rentalsScrollY', window.scrollY.toString());
    setPriorityDisplay('rentals');
  };

  const handleBack = () => {
    setPriorityDisplay(null);
    const scrollY = sessionStorage.getItem('rentalsScrollY');
    if (scrollY) {
      setTimeout(() => window.scrollTo(0, parseInt(scrollY)), 100);
    }
  };

  return (
    <Box
      id='rentals'
      sx={{
        display: priorityDisplay === 'rentals' || (isLoggedIn === false && priorityDisplay === null) ? 'block' : 'none',
        minHeight: '300px',
        marginTop: priorityDisplay === 'rentals' ? '40px' : '0px',
      }}
    >
      


      <Heading title={Title} subtitle={Subtitle} />

      <Container
        maxWidth='md'
        sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'space-between',
          '@media (max-width:813px)': {
            flexDirection: 'column',
            paddingRight: 2,
            paddingLeft: 2,
          },
        }}
      >
        <Options />
      </Container>

      {filteredProperties.length > 0 ? (
        <SearchResults properties={filteredProperties} />
      ) : (
        <CircularProgress />
      )}

      {!isMobile && (
        <Box mt={3} display="flex" justifyContent="flex-end" px={2}>
          <PriorityDisplayControl
            display='rentals'
            text='View more'
            justify='justify-end'
            onClick={handleViewMore}
          />
        </Box>
      )}

      {isMobile && (
        <Box mt={3} textAlign="center">
          <PriorityDisplayControl
            display='rentals'
            text='View more'
            justify='justify-center'
            onClick={handleViewMore}
          />
        </Box>
      )}
    </Box>
  );
}

export default Property;

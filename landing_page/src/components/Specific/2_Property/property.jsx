import React, { useState, useEffect } from "react";
import { Box, useMediaQuery, Typography } from "@mui/material";
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useLogin } from "../../../context/IsLoggedIn";
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import Heading from '../../Common/heading';
import Options from './children/options';

function Property() {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [scrollYBeforeExpand, setScrollYBeforeExpand] = useState(0);

  const Title = 'Properties By Location';
  const Subtitle = 'Finding your dream spot made easy';

  useEffect(() => {
    if (priorityDisplay === 'properties') {
      const savedScroll = sessionStorage.getItem('propertiesScrollY');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('propertiesScrollY');
      }
    }
  }, [priorityDisplay]);

  const handleViewMore = () => {
    sessionStorage.setItem('propertiesScrollY', window.scrollY.toString());
    setPriorityDisplay('properties');
  };

  const handleBack = () => {
    setPriorityDisplay(null);
    const savedScroll = sessionStorage.getItem('propertiesScrollY');
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
      }, 100);
    }
  };

  return (
    <Box
      id='properties'
      sx={{
        display: priorityDisplay === 'properties' || priorityDisplay === null ? 'block' : 'none',
        minHeight: '300px',
        mt: '50px',
      }}
    >
      {/* Back button styled like service/search pages */}
      {(priorityDisplay === 'properties' && sessionStorage.getItem('propertiesScrollY')) && (
        <Typography
          variant="body1"
          onClick={handleBack}
          sx={{
            color: 'var(--merime-theme)',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '20px',
            display: 'inline-block',
          }}
        >
          ← Back to Listings
        </Typography>
      )}

      <Heading title={Title} subtitle={Subtitle} />
      <Options />

      {isMobile ? (
        <Box mt={3} textAlign="center">
          <PriorityDisplayControl
            display='properties'
            text='View more property'
            justify='justify-center'
            onClick={handleViewMore}
          />
        </Box>
      ) : (
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <PriorityDisplayControl
            display="properties"
            text="View more property"
            justify="justify-end"
            onClick={handleViewMore}
          />
        </Box>
      )}
    </Box>
  );
}

export default Property;

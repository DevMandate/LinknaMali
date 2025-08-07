import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useLogin } from "../../../context/IsLoggedIn";
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import Heading from '../../Common/heading';
import Options from './children/options';

const Services = () => {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay } = usePriorityDisplay();
  const isMobile = useMediaQuery('(max-width:768px)');

  const Title = 'Explore Our Service Providers Market';
  const Subtitle = 'From Discovery to Management, We’re Here for Every Step of Your Journey';

  return (
    <Box
      id='service providers'
      sx={{
        display:
          priorityDisplay === 'service providers' ||
          (isLoggedIn === false && priorityDisplay === null)
            ? 'block'
            : 'none',
        paddingTop: '20px',
      }}
    >
      <Heading title={Title} subtitle={Subtitle} />

      

      <Options />

      {/* Desktop view link */}
      {!isMobile && (
        <Box display="flex" justifyContent="flex-end" mt={3}>
        <PriorityDisplayControl
          display='service providers'
          text='Get more services'
          justify='justify-end'
        />
        </Box>
      )}

      {/* Mobile view link */}
      {isMobile && (
        <Box mt={3} textAlign="center">
          <PriorityDisplayControl
            display='service providers'
            text='Get more services'
            justify='justify-center'
          />
        </Box>
      )}
    </Box>
  );
};

export default Services;

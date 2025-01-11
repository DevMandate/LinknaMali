import React from 'react';
import { Box, Container, Typography } from '@mui/material';

import Heading from '../../../Common/heading';
const Main = () => {
  const title = 'About Us';
  const details =[
    {Heading:'Who are we',
    Content: 'We’re a passionate team dedicated to connecting people with their dream properties. Whether you’re looking for a new home, a rental, or a great investment opportunity, we’re here to make the journey seamless and enjoyable.'
    },
    {
      Heading:'Our Mission',
      Content: 'To simplify property search and empower our clients with reliable information, personalized service, and expert guidance. We believe in creating long-lasting relationships built on trust and transparency'
    }
  ]
  return (
    <Container maxWidth='md' className=''>
      <Heading title={title}/>
      {details.map((detail, index) => (
        <Box key={index} sx={{padding:2,marginTop:'10px',borderRadius:'5px', backgroundColor: 'var(--hamburger)'}}>
          <Typography variant='h6' sx={{marginBottom: 1}}>{detail.Heading}</Typography>
          <p style={{marginBottom:'20px'}}>{detail.Content}</p>
        </Box>
      ))}
    </Container>
  );
};

export default Main;

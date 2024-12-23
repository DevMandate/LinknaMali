import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import { Container, Typography } from "@mui/material";
const Features = () => {
  const Features =[ 'View Portal', 'Create Listing', 'Search Property', 'Find Agent', ];
  return (
    <Container maxWidth='xs' className='div'>
      <Typography variant='h5' sx={{marginBottom:2,}}>Quick Links <LinkIcon sx={{ color: 'var(--text)', fontSize: 24 }} /></Typography>
      {Features.map((feature, index) => (
        <Typography key={index} sx={{marginBottom:'10px', cursor:'pointer'}} variant='body2'>{feature}</Typography>
      ))}
    </Container>
  );
};

export default Features;

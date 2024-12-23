import React from 'react';
import { Box, Button, Container } from "@mui/material";
import Contact from './children/contact';
import Features from './children/features';
import Company from './children/company';
import Legals from './children/legals';
const Footer = () => {
  return (
    <Box
        sx={{
            minHeight: '300px',
            padding: '20px',
        }}
        className='flex'
    >
        <Contact />
        <Features />
        <Company />
        <Legals />
    </Box>
  );
};

export default Footer;

import React from 'react';
import { Box } from "@mui/material";
import Contact from './children/contact';
import QuickLinks from './children/quickLinks';
import Company from './children/company';
import Legals from './children/legals';
const Footer = () => {
  return (
    <Box
        sx={{
            minHeight: '300px',
            padding: '20px',
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "10px",
            justifyContent: "center",
            "@media (max-width: 400px)": {
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            },
        }}
    >
        <Contact />
        <QuickLinks />
        <Company />
        <Legals /> 
    </Box>
  );
};

export default Footer;

import React from 'react';
import { Box } from "@mui/material";
import Contact from './children/contact';
import QuickLinks from './children/quickLinks';
import Company from './children/company';
import Legals from './children/legals';
import { MerimeDevelopment } from '../../../assets/images'
import { useLogin } from "../../../context/IsLoggedIn";
import { usePriorityDisplay } from '../../../context/PriorityDisplay'
const Footer = () => {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay } = usePriorityDisplay();

  if(isLoggedIn) return null;
  return (
    <>
      <Box
        sx={{
          marginTop: priorityDisplay !== null ? '20vh' : undefined,
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
      <Box sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        mb: 5,
        "@media (max-width: 450px)": {
          flexDirection: 'column',
        },
      }}>
        <h2 style={{ fontSize: '1.2rem' }}>A product of</h2><img src={MerimeDevelopment} width='300px' />
      </Box>
    </>
  );
};

export default Footer;

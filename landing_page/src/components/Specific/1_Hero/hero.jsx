import React from "react";
import { Box } from "@mui/material";
import LinearProgress from '@mui/material/LinearProgress';
import { useSearchEngine } from '../../../context/SearchEngine';
import Header from '../../Layout/Header/header';
import Heading from './children/heading';
import './css/hero.css';

function Hero() {
  const { searchEngine } = useSearchEngine();

  return (
    <Box 
      className='Hero'
      sx={{
        paddingTop: {
          xs: '0',    
          sm: '100px'     
        }
      }}
    >

      {searchEngine && (
        <LinearProgress 
          sx={{ position: 'fixed', top: 0, width: '100%', zIndex: 4 }} 
        />
      )}
      <Header />
      <Heading />
    </Box>
  );
}

export default Hero;

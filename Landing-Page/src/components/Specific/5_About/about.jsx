import React from 'react';
import { Box, Container, useMediaQuery } from '@mui/material';
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import {Merime} from '../../../assets/images'
import Main from './children/main'
const About = () => {
  const {priorityDisplay} = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 1000px)");
  return (
    <Box
      id="about us"
      sx={{
        display: priorityDisplay === null ? 'flex' : 'none',
        minHeight: '400px',
        paddingTop: '50px',
      }}
    >
      {!isSmallScreen? (<Container maxWidth='xs' sx={{padding:'0px !important'}}>
        <img src={Merime} style={{objectFit:'cover', width:'100%', height:'100%',borderRadius:'10px'}} alt='Merime'/>
      </Container>):null}
      <Main/>
    </Box>
  );
};

export default About;

import React from 'react';
import { useNavigate } from "react-router-dom";
import { Container,Box, Button} from '@mui/material';
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import {scrollIntoView} from '../../../utils/scrollIntoView'
import {useLogin} from '../../../context/IsLoggedIn'
import Content from '../../Common/content';
import HowItWorks from './data'

const GetStarted = () => {
  const navigate = useNavigate();
  const { isLoggedIn} = useLogin();
  const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
  const Title = 'How It Works';
  const Subtitle = 'Effortless property discovery in just three simple steps.';
  function handleSignUp(){
      navigate('/signup');
      setPriorityDisplay('signup');
      scrollIntoView('signup')
  }
  return (
    <Box sx={{
      display: isLoggedIn ? 'none' : (priorityDisplay === null ? 'block' : 'none'),
    }}>
    <Content Title={Title} Subtitle={Subtitle} minimax='200px' data={HowItWorks}/>
    <Container maxWidth='lg' className='' sx={{display:'flex',justifyContent:'center', marginTop: '10px', marginBottom: '10px' }}>
      <Button onClick={() => handleSignUp()} 
      variant='contained' className='bounce' sx={{backgroundColor: 'var(--merime-theme)'}}>Get Started Today</Button>
    </Container>
    </Box>
  );
};

export default GetStarted;

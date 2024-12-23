import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Heading from '../../Common/heading'
import Options from './children/options'

const Services = () => {
    const Title = 'Explore Our Services';
    const Subtitle = 'From Discovery to Management, We’re Here for Every Step of Your Journey';
    const variant="h6"
    const handleServices = () => {
        alert(`View more services`);
    };

    return (
        <Box 
        id='services'
        className=''
        sx={{
            minHeight:'300px',
            marginTop:'50px',
            paddingTop:'20px',
        }}>
            <Heading title={Title} subtitle={Subtitle} variant={variant}/>
            <Container 
                maxWidth='lg'
                sx={{padding:'0px 20px'}}
                className='flex justify-end'>
                <Typography 
                    onClick={handleServices}
                    sx={{cursor:'pointer', color:'#1976d2'}}
                >Get more services <FontAwesomeIcon icon={faArrowRight} />
                </Typography>
            </Container>
            <Options/>
        </Box>
    );
};

export default Services;

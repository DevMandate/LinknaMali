import React from "react";
import { Container,Box, Typography } from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Heading from '../../Common/heading'
import Options from './children/options'
function Property() {
    const Title = 'Featured Rentals & Airbnbs';
    const Subtitle = 'Find your perfect home away from home.';
    const handleProperty = () => {
        alert(`View more rentals`);
    };
    return(
        <Box
            className=''
            sx={{
                minHeight:'300px',
                paddingTop:'50px',
            }}
        >
            <Heading title={Title} subtitle={Subtitle}/>
            <Container 
                maxWidth='lg'
                sx={{padding:'0px 20px'}}
                className='flex justify-end mt-[10px] mb-[20px]'>
                <Typography 
                    onClick={handleProperty}
                    sx={{cursor:'pointer', color:'#1976d2'}}
                >View more <FontAwesomeIcon icon={faArrowRight} />
                </Typography>
            </Container>    
            <Options/>
        </Box>
    );
}

export default Property;

import React from "react";
import { Box,Container, Typography } from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Heading from '../../Common/heading'
import Options from './children/options'
function Property() {
    const Title = 'Properties By Location';
    const Subtitle = 'Finding your dream spot made easy';
    const handleProperty = () => {
        alert(`View more property`);
    };
    return(
        <Box
            id='property'
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
                className='flex justify-end mt-[40px]'>
                <Typography 
                    onClick={handleProperty}
                    sx={{cursor:'pointer', color:'#1976d2'}}
                >View more property <FontAwesomeIcon icon={faArrowRight} />
                </Typography>
            </Container>
            <Options/>   
        </Box>
    );
}

export default Property;

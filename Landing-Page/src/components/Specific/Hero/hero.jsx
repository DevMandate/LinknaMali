import React from "react";
import { Box, Button, Container } from "@mui/material";
import Header from '../../Layout/header';
import Heading from './children/heading'
import Search from './children/search'
import './css/hero.css'
function Hero() {

    return(
        <Box
            className='Hero'
            sx={{
                minHeight:'500px'
            }}
        >
            <Header />
            <Heading/>
            <Search/>
        </Box>
    );
}

export default Hero;

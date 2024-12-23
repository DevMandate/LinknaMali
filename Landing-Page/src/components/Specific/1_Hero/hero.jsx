import React from "react";
import { Box } from "@mui/material";
import Header from '../../Layout/Header/header';
import Heading from './children/heading'
import Search from './children/search'
import './css/hero.css'
function Hero() {

    return(
        <Box
            className='Hero'
        >
            <Header />
            <Heading/>
            <Search/>
        </Box>
    );
}

export default Hero;

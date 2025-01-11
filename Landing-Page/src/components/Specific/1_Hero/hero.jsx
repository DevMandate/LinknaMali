import React from "react";
import { Box } from "@mui/material";
import Search from '../../../components/Common/Search/search'
import Header from '../../Layout/Header/header';
import Heading from './children/heading'
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

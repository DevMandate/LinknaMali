import React from "react";
import { Box, Button, Container } from "@mui/material";
import Header from '../../Layout/header';
import Heading from './children/heading'
import Search from './children/search'

function Hero() {

    return(
        <Box
            className=''
            sx={{
                minHeight:'300px'
            }}
        >
            <Header />
            <Heading/>
            <Search/>
        </Box>
    );
}

export default Hero;

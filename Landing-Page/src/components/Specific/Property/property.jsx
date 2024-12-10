import React from "react";
import { Box } from "@mui/material";
import Heading from './children/heading'
import Options from './children/options'
function Hero() {

    return(
        <Box
            className=''
            sx={{
                minHeight:'300px',
                paddingTop:'50px',
                backgroundColor:'var(--color-merime)'
            }}
        >
            <Heading/>
            <Options/>
           
        </Box>
    );
}

export default Hero;

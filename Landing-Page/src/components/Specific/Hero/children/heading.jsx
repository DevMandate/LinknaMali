import React from "react";
import { Box, Typography, Container } from "@mui/material";

function Heading() {

    return(
        <Box
            sx={{padding:2}}
        >
            <Typography variant="h2" fontWeight={400}>
                Transforming Real Estate in Kenya
            </Typography>
            <Typography variant="h3">
                Seamless, secure and Smart
            </Typography>
        </Box>
    );
}

export default Heading;

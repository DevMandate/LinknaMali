import React from "react";
import { Box, Typography } from "@mui/material";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
function Heading() {
    const {priorityDisplay} = usePriorityDisplay();
    return(
        <Box
            sx={{
                display: priorityDisplay === null ? 'block' : 'none',
                padding:2
            }}
        >
            <Typography 
                variant="h2" 
                fontWeight={400}
                color="white"
                sx={{
                    wordWrap: 'break-word', 
                    whiteSpace: 'normal', 
                    '@media (max-width:750px)': {
                        fontSize: '2.5rem',
                    }, 
                }}
            >
                Transforming Real Estate in Kenya
            </Typography>
            <Typography 
                variant="h3"
                color="white"
                sx={{
                    '@media (max-width:750px)': {
                        fontSize: '2rem',
                    },
                }}
            >
                Seamless, secure and Smart
            </Typography>
        </Box>
    );
}

export default Heading;

import React from "react";
import { Container, Typography, useMediaQuery } from "@mui/material";

function Heading({title,variant,subtitle,subVariant}) {
    const isSmallScreen = useMediaQuery("(max-width: 1000px)");
    return(
        <Container
            maxWidth={isSmallScreen ? 'lg' : 'md'}
            className=''
        >
            <Typography
                variant={variant ? variant : "h3"}
                sx={{
                    '@media (max-width:750px)': {
                        fontSize: '2rem',
                    },
                }}
            >{title}</Typography>
            <Typography
                variant={subVariant ? subVariant : "h5"}
                sx={{
                    '@media (max-width:750px)': {
                        fontSize: '1.5rem',
                    },
                }}
            >{subtitle}</Typography>
           
        </Container>
    );
}

export default Heading;

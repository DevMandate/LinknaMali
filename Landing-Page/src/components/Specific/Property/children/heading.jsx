import React from "react";
import { Container, Typography } from "@mui/material";

function Heading() {

    return(
        <Container
            maxWidth='sm'
            className=''
            sx={{
                marginBottom:'50px'
            }}
        >
            <Typography
                variant="h3"
            >
                Properties By Location
            </Typography>
            <Typography
                variant="h5"
            >
                Finding your dream spot made easy
            </Typography>
           
        </Container>
    );
}

export default Heading;

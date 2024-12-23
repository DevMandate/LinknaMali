import React from "react";
import { Container, Typography } from "@mui/material";

function Heading({title, subtitle, variant}) {

    return(
        <Container
            maxWidth='sm'
            className=''
        >
            <Typography
                variant="h3"
            >{title}</Typography>
            <Typography
                variant={variant ? variant : "h5"}
            >{subtitle}</Typography>
           
        </Container>
    );
}

export default Heading;

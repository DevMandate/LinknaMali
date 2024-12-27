import React from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Container} from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import DetailsDisplay from './Details'
import SearchResults from '../../Common/Search/searchResults'
import {room1, room2, room3, room4, room5, room6} from '../../../assets/images'
import Service from "./service";

function Main() {
    const location = useLocation();
    console.log(location.state);
    const {priorityDisplay} = usePriorityDisplay();
    //Instead of specifying location.state?.service to make it receive data from all components;
    const detailsDisplay = location.state 
        ? Object.values(location.state)[0]
        : null;
    const Action = location.state 
    ? Object.values(location.state)[1]
    : null;

    const Extra = location.state 
    ? Object.values(location.state)[2]
    : null;

    const images = [room1, room2, room3, room4, room5, room6];
    return(
        <Box
            id='propertyDetails'
            sx={{
                display: priorityDisplay === 'propertyDetails' ? 'block' : 'none',
                minHeight: "300px",
                padding: "20px",
            }}
            className=''
        >   
        {Action === 'details' &&(
            <DetailsDisplay detailsDisplay={detailsDisplay} images={images}/>
        )}
        {Action === 'grid' &&(
            <>
                <Container maxWidth='lg'><Typography variant="h4">Results for {Extra.name} </Typography></Container>
                <SearchResults properties={detailsDisplay} gridSizeOverride={true} append={true}/>
            </>
        )}
        {Action === 'service' &&(
            <Service service={detailsDisplay}/>
        )}
        </Box>

    );
}

export default Main;

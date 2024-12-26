import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'

function Render(){
    const location = useLocation();
    const { type, name } = useParams();
    console.log(location);

    //Instead of specifying location.state?.service to make it receive data from all components;
    const detailsDisplay = location.state 
        ? Object.values(location.state)[0]
        : null;
    return (  
        <>
            {detailsDisplay ? (
                Object.entries(detailsDisplay).map(([key, value]) => (
                    <Box key={key}>
                        <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Box>
                ))
            ) : (
                <Box>No details available for {type}: {name}.</Box>
            )}
        </>
    ) 
}
function DetailsDisplay() {
    const {priorityDisplay} = usePriorityDisplay();
    return(
        <Box
            id='propertyDetails'
            className='div'
            sx={{
                display: priorityDisplay === 'propertyDetails' ? 'block' : 'none',
                minHeight: "300px",
                padding: "20px",
            }}
        >
            <Render />
        </Box>

    );
}

export default DetailsDisplay;

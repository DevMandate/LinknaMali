import React from "react";
import { Box } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
function PropertyDetails() {
    const {priorityDisplay, detailsDisplay} = usePriorityDisplay();

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
            {detailsDisplay && Object.entries(detailsDisplay).map(([key, value]) => (
                <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                </div>
            ))}
        </Box>

    );
}

export default PropertyDetails;

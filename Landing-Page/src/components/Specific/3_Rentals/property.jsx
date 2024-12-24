import React from "react";
import { Box} from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import Heading from '../../Common/heading'
import Options from './children/options'
function Property() {
    const {priorityDisplay} = usePriorityDisplay();
    const Title = 'Featured Rentals & Airbnbs';
    const Subtitle = 'Find your perfect home away from home.';

    return(
        <Box
            id='rentals'
            className=''
            sx={{
                display: priorityDisplay === 'rentals' || priorityDisplay === null ? 'block' : 'none',
                minHeight:'300px',
                paddingTop:'50px',
            }}
        >
            <Heading title={Title} subtitle={Subtitle}/>
            <PriorityDisplayControl display='rentals' text='View more'/>    
            <Options/>
        </Box>
    );
}

export default Property;

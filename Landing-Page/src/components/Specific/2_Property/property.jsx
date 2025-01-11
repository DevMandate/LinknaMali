import React from "react";
import { Box } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import Heading from '../../Common/heading'
import Options from './children/options'
function Property() {
    const {priorityDisplay} = usePriorityDisplay();
    const Title = 'Properties By Location';
    const Subtitle = 'Finding your dream spot made easy';

    return(
        <Box
            id='property'
            className=''
            sx={{
                display: priorityDisplay === 'property' || priorityDisplay === null ? 'block' : 'none',
                minHeight:'300px',
                paddingTop:'20px',
            }}
        >
            <Heading title={Title} subtitle={Subtitle}/>
            <PriorityDisplayControl display='property' text='View more property'/>
            <Options/>   
        </Box>
    );
}

export default Property;

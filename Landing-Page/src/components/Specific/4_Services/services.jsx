import React from 'react';
import { Box } from '@mui/material';
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import PriorityDisplayControl from '../../Common/PriorityDisplayControl';
import Heading from '../../Common/heading'
import Options from './children/options'

const Services = () => {
    const {priorityDisplay} = usePriorityDisplay();
    const Title = 'Explore Our Services';
    const Subtitle = 'From Discovery to Management, We’re Here for Every Step of Your Journey';
    const subVariant="h6"

    return (
        <Box 
        id='services'
        className=''
        sx={{
            display: priorityDisplay === 'services' || priorityDisplay === null ? 'block' : 'none',
            minHeight:'300px',
            marginTop:'50px',
            paddingTop:'20px',
        }}>
            <Heading title={Title} subtitle={Subtitle} subVariant={subVariant}/>
            <PriorityDisplayControl display='services' text='Get more services'/>
            <Options/>
        </Box>
    );
};

export default Services;

import React from 'react';
import { Container} from '@mui/material';
import { usePriorityDisplay } from '../../../../../context/PriorityDisplay';
import MyBookings from './myBookings';
const Main = () => {
    const { priorityDisplay } = usePriorityDisplay();

    return (
        <Container 
            id='home'
            maxWidth={false}
            sx={{
                display: priorityDisplay === 'my-bookings' ?'block' : 'none',
                padding: '20px',
            }}
        >  
        <MyBookings/>
        </Container>
    );
};

export default Main;

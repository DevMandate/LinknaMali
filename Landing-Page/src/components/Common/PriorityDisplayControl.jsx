import React from 'react';
import { Container, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import {usePriorityDisplay} from '../../context/PriorityDisplay'

const PriorityDisplayControl = ({display, text}) => {
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
    const handleViewMore = () => {
        console.log(display)
        setPriorityDisplay(display);
    };
    const handleViewLess = () => {
        setPriorityDisplay(null);
    }

    return (
        <Container 
            maxWidth='lg'
            sx={{padding:'0px 20px'}}
            className='flex justify-end'>
            <Typography 
                onClick={ priorityDisplay === display ? handleViewLess : handleViewMore}
                sx={{ 
                    color: priorityDisplay===display? 'white': '#1976d2' ,
                    backgroundColor: priorityDisplay === display? 'red' : 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    zIndex: 2,
                    cursor: 'pointer', 
                }}
            >
                {priorityDisplay === display ? (
                <>View less <FontAwesomeIcon icon={faArrowRight} /></>
                ) : (
                <>{text}<FontAwesomeIcon icon={faArrowRight} /></>
                )}
            </Typography>
        </Container>
    );
};

export default PriorityDisplayControl;

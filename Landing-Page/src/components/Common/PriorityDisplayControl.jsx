import React from 'react';
import { Container, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import {usePriorityDisplay} from '../../context/PriorityDisplay'
import {scrollIntoView} from '../../utils/scrollIntoView'
const PriorityDisplayControl = ({display, text}) => {
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
    const handleViewMore = () => {
        setPriorityDisplay(display);
    };
    const handleViewLess = () => {
        setPriorityDisplay(null);
        scrollIntoView(display);
    }

    return (
        <Container 
            maxWidth='lg'
            sx={{padding:'0px 20px'}}
            className='flex justify-end'>
            <Typography 
                className={`${priorityDisplay === display ? 'bounce': ''}`}
                onClick={ priorityDisplay === display ? handleViewLess : handleViewMore}
                sx={{ 
                    color: priorityDisplay===display? 'white': '#1976d2' ,
                    backgroundColor: priorityDisplay === display? 'red' : 'none',
                    padding: '15px 15px',
                    borderRadius: '5px',
                    zIndex: 2,
                    cursor: 'pointer', 
                    position: priorityDisplay === display? 'fixed' : 'unset',
                    right: '100px',
                    top: '300px',
                    '@media (max-width:700px)': {
                        top: 'unset',
                        right: '30px',
                        bottom: '30px',
                    },
                }}
            >
                {priorityDisplay === display ? (
                <>View less <FontAwesomeIcon icon={faArrowRight} /></>
                ) : (
                <>{text} <FontAwesomeIcon icon={faArrowRight} /></>
                )}
            </Typography>
        </Container>
    );
};

export default PriorityDisplayControl;

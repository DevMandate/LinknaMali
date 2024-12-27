import React from 'react';
import { useNavigate } from "react-router-dom";
import { omit } from 'lodash';
import { Container, Box, Typography, useMediaQuery } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {gridSize} from '../../../../utils/gridSize'
import Services from './data/services';
const Options = () => {
    const navigate = useNavigate();
    const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();
    const isSmallScreen = useMediaQuery("(max-width: 560px)");
    const ServicesResponsive = gridSize(isSmallScreen,priorityDisplay,'services', Services, 3,6);

    const handleServiceClick = (service) => {
        setPriorityDisplay('propertyDetails');
        console.log(`i clicked ${service.name}`);
        const encodedName = encodeURIComponent(service.name.replace(/ /g, "-"));
        const serviceWithoutIcon = omit(service, 'icon');
        navigate(`/services/${encodedName}`, {
            state: {
                serviceWithoutIcon,
                action: 'service',
            }
        });
    }  
    return (
        <Container
            className=''
            maxWidth='lg'
            sx={{
                padding:'30px 20px',
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                justifyContent: "center",
                "@media (max-width: 670px)": {
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                },
            }}
        >
        {ServicesResponsive.map((service) => (
            <Box
            key={service.id}
            onClick={() => handleServiceClick(service)}
            className='flex flex-col column justify-evenly'
            sx={{
                padding: 2,
                minHeight: "200px",
                borderRadius: "5px",
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                backgroundColor: "var(--hamburger)",
                '&:hover .arrow': {
                transform: 'translateX(5px)',
                },
            }}>   
                {<service.icon style={{fontSize: '70px'}}/>}
                <Box className=''>
                    <Typography variant='h5' sx={{marginBottom:1}}>{service.name}</Typography>
                    <Typography>{service.description}</Typography>
                </Box>
                <Typography
                    sx={{
                        color: '#1976d2',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out',
                    }}
                >Read more <FontAwesomeIcon icon={faArrowRight} className="arrow" />
                </Typography>
            </Box>
        ))}
        </Container>
  );
};

export default Options;

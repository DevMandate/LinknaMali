import React from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, useMediaQuery } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import { useLogin } from "../../../../context/IsLoggedIn";
import {gridSize} from '../../../../utils/gridSize'
import ServicesData from './services';
const Options = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useLogin();
    const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();
    const isSmallScreen = useMediaQuery("(max-width: 560px)");
    const ServicesResponsive = gridSize(isSmallScreen,priorityDisplay,'service providers', ServicesData, 3,6);

    const handleServiceClick = (service) => {
        setPriorityDisplay('propertyDetails');
        
        const Action = ['service'];
        const encodedName = encodeURIComponent(service.name.replace(/ /g, "-"));
        navigate(`/hub/services/${encodedName}`, {
            state: {
                id: service.id,
                action: Action,
            }
        });
    }  
    return (
        <Container
            className=''
            maxWidth={isLoggedIn ? false : "lg"} 
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
                <img src={service.image} alt={service.name} style={{width: '70px', height: '70px'}}/>
                <Box className=''>
                    <Typography variant='h5' sx={{marginBottom:1}}>{service.name}</Typography>
                    <Typography>{service.description}</Typography>
                </Box>
                <Typography
                    sx={{
                        color: 'var(--merime-theme)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out',
                    }}
                >Check out <FontAwesomeIcon icon={faArrowRight} className="arrow" />
                </Typography>
            </Box>
        ))}
        </Container>
  );
};

export default Options;

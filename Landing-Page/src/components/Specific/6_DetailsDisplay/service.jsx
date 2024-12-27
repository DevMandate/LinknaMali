import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CampaignIcon from '@mui/icons-material/Campaign';
import BuildIcon from '@mui/icons-material/Build'; 
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import MapIcon from '@mui/icons-material/Map'; 
import AssessmentIcon from '@mui/icons-material/Assessment';

const Service = ({ service }) => {
    const IconMap = {
        HomeWorkIcon,
        BusinessIcon,
        SearchIcon,
        AccountBalanceIcon,
        GavelIcon,
        AttachMoneyIcon,
        PhotoCameraIcon,
        CampaignIcon,
        BuildIcon,
        EventAvailableIcon,
        MapIcon,
        AssessmentIcon,
    };

    const IconComponent = IconMap[service.iconName];

    function handleServiceClick(){
        alert(`Feature under build. Please check back later.`);
    }
    return (
        <Box 
            sx={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
            }}
            className=''
        >
            <Typography variant="h4" sx={{ marginBottom: '16px', fontWeight: 'bold' }}>
            <IconComponent sx={{ fontSize: '50px'}}/> {service.name}
            </Typography>
            <Typography sx={{ fontSize: '18px', marginBottom: '20px' }}>
                {service.description}
            </Typography>
            <Typography
                sx={{
                    textAlign: 'left',
                    padding: '0 20px',
                }}
            >
                {service.paragraph || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Fusce nec facilisis nulla. Sed id mauris eu justo dictum fermentum. Vestibulum id orci urna. Aliquam erat volutpat. Vivamus euismod, odio eu mollis volutpat, sapien sapien sollicitudin ligula, eu porttitor urna quam vitae urna. Aliquam erat volutpat. Nulla facilisi. ."}
            </Typography>
            <Button variant='contained' color='secondary' onClick={handleServiceClick} >Need {service.name}?</Button>

        </Box>
    );
};

export default Service;

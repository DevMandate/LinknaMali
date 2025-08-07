import React from 'react';
import { Typography, Button,Container } from '@mui/material';
import Services from '../6_Services/children/services';

const Service = ({ id }) => {
    
    const service = Services.find(item => item.id === id);
    function handleServiceClick() {
        alert(`Feature under build. Please check back later.`);
    }

    return (
        service && (
            <Container maxWidth='lg' sx={{minHeight: '500px',marginTop:3}}>
                <Typography variant="h4" sx={{ marginBottom: '16px', display:'flex', alignItems:'center', gap:2}}>
                <img src={service.image} alt={service.name} style={{width: '70px', height: '70px'}}/> {service.name}
                </Typography>
                <Typography sx={{ fontSize: '18px', marginBottom: '20px' }}>
                    {service.description}
                </Typography>
                <Typography>{service.paragraph || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Fusce nec facilisis nulla. Sed id mauris eu justo dictum fermentum. Vestibulum id orci urna. Aliquam erat volutpat. Vivamus euismod, odio eu mollis volutpat, sapien sapien sollicitudin ligula, eu porttitor urna quam vitae urna. Aliquam erat volutpat. Nulla facilisi. ."}
                </Typography>
                <Button variant='contained' sx={{marginTop:2,backgroundColor: 'var(--merime-theme)'}} onClick={handleServiceClick}>Need {service.name}?</Button>
            </Container>
        )
    );
};

export default Service;

import React from 'react';
import { Container, Typography, Box } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Contact = () => {
    const handleAddressClick = (event) => {
        event.preventDefault();
        const userConfirmed = window.confirm('View address in Google Maps?');
        if (userConfirmed) {
            window.open(
                'https://maps.app.goo.gl/hzdmhPPigb2N1kW8A',
                '_blank',
                'noopener noreferrer'
            );
        }
    };

    const handleEmailClick = (event) => {
        event.preventDefault();
        const userConfirmed = window.confirm('Confirm request to send an email to LinknaMali?');
        if (userConfirmed) {
            window.location.href = 'mailto:support@merimedevelopment.co.ke';
        }
    };

    return (
        <Container maxWidth='xs' className=''>
            <Typography variant='h5' sx={{marginBottom:2,}}>Contact Us </Typography>
            <Box className='flex' sx={{cursor:'pointer', mb:'10px'}} onClick={handleEmailClick}><EmailIcon /><span>support@merimedevelopment.co.ke</span></Box>
            <address onClick={handleAddressClick} style={{cursor:'pointer', marginBottom: '20px'}} className='flex'>
            <LocationOnIcon /> Mkoroshoni, 100m from Kichinjioni gate<br />
                P.O Box 726-80108, Kilifi county, Kenya
            </address>
            <SocialIcons />
        </Container>
    );
};

export default Contact;

function SocialIcons () {
    const fill='var(--text)';
    const size='24';
  return (
    <div style={{ display: 'flex', gap:'15px' }}>
      {/* Facebook */}
      <a href="https://www.facebook.com/share/1Fg57X3c1C/" target="_blank" rel="noopener noreferrer">
        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Facebook_f_logo_%282021%29.svg/512px-Facebook_f_logo_%282021%29.svg.png?20210818083032" alt="Facebook" width={size} height={size} style={{ cursor: 'pointer' }} />
      </a>

      {/* LinkedIn */}
      <a href="https://www.linkedin.com/posts/merime-development_linknamalilaunch-realestatereimagined-communitygrowth-activity-7309888074518286336-yaTX?utm_source=share&utm_medium=member_android&rcm=ACoAAEPlWZ4B8sGKkhLydIgzwz2Ji40t9C4JXqg" target="_blank" rel="noopener noreferrer">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/1024px-LinkedIn_icon.svg.png" alt="Linkedin" width={size} height={size} style={{ cursor: 'pointer' }} />
      </a>

       
      {/* Instagram (Colorful Icon via Image) */}
      <a href="https://www.instagram.com/linknamali?igsh=MXUxdnZzNWo0M3U0dg%3D%3D" target="_blank" rel="noopener noreferrer">
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" width={size} height={size} style={{ cursor: 'pointer' }} />
      </a>
        {/* Youtube (Colorful Icon via Image) */}
      <a href="https://youtube.com/@merimerealestate?si=IgHvW8SqX_TQCR81" target="_blank" rel="noopener noreferrer">
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png?20220706172052" alt="YouTube" width={size} height={size} style={{ cursor: 'pointer' }} />
      </a>
    </div>
  );
};
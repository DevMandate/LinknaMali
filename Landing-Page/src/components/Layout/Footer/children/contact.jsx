import React from 'react';
import { Container, Typography } from "@mui/material";
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
        const userConfirmed = window.confirm('Send an email to us?');
        if (userConfirmed) {
            window.location.href = 'mailto:someone@example.com';
        }
    };

    return (
        <Container maxWidth='xs' className=''>
            <Typography variant='h5' sx={{marginBottom:2,}}>Contact Us </Typography>
            <Typography variant='body2'>+254 700 112 233</Typography>
            <Typography variant='body2'>+254 700 112 233</Typography>
            <Typography style={{cursor:'pointer', marginBottom:'10px'}} onClick={handleEmailClick}><EmailIcon /> merime@gmail.com</Typography>
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill={fill}
        viewBox="0 0 24 24"
        style={{ cursor: 'pointer' }}
      >
        <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82V14.708h-3.111v-3.632h3.111V8.413c0-3.066 1.872-4.738 4.607-4.738 1.31 0 2.436.097 2.761.141v3.201l-1.896.001c-1.486 0-1.774.706-1.774 1.742v2.285h3.548l-.463 3.632h-3.085V24h6.054c.73 0 1.325-.593 1.325-1.324V1.325C24 .593 23.407 0 22.675 0z" />
      </svg>

      {/* LinkedIn */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill={fill}
        viewBox="0 0 24 24"
        style={{ cursor: 'pointer' }}
      >
        <path d="M22.23 0H1.77C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.77 24h20.459C23.208 24 24 23.226 24 22.271V1.729C24 .774 23.208 0 22.23 0zM7.08 20.452H3.557V9.033H7.08v11.419zM5.32 7.673a2.01 2.01 0 11-.002-4.021 2.01 2.01 0 01.002 4.021zM20.452 20.452h-3.522v-5.799c0-1.383-.025-3.165-1.93-3.165-1.93 0-2.227 1.507-2.227 3.067v5.897h-3.522V9.033h3.387v1.561h.048c.472-.897 1.623-1.843 3.34-1.843 3.57 0 4.226 2.348 4.226 5.399v6.302z" />
      </svg>

      {/* Twitter */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill={fill}
        viewBox="0 0 24 24"
        style={{ cursor: 'pointer' }}
      >
        <path d="M24 4.557a9.848 9.848 0 01-2.828.775 4.935 4.935 0 002.165-2.723c-.943.556-1.986.959-3.095 1.184a4.92 4.92 0 00-8.384 4.482A13.956 13.956 0 011.671 3.149a4.917 4.917 0 001.523 6.573 4.897 4.897 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 01-2.224.085 4.928 4.928 0 004.604 3.419 9.868 9.868 0 01-6.102 2.105c-.395 0-.779-.023-1.161-.067a13.94 13.94 0 007.548 2.212c9.057 0 14.002-7.514 14.002-14.034 0-.213-.005-.425-.014-.637A10.012 10.012 0 0024 4.557z" />
      </svg>

      {/* WhatsApp */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill={fill}
        viewBox="0 0 24 24"
        style={{ cursor: 'pointer' }}
      >
        <path d="M20.52 3.48A11.925 11.925 0 0012 .78C5.47.78.75 5.69.75 12.11c0 2.07.54 4.1 1.56 5.9l-1.64 5.37 5.48-1.5a11.86 11.86 0 005.95 1.57h.05c6.53 0 11.28-4.91 11.28-11.33 0-2.99-1.05-5.79-3.05-7.71zM12 21.42a10.48 10.48 0 01-5.5-1.54l-.4-.23-3.26.89.88-3.17-.25-.4a10.33 10.33 0 01-1.45-5.37c0-5.69 4.65-10.34 10.38-10.34a10.42 10.42 0 017.32 3.02 10.4 10.4 0 013.06 7.3c0 5.7-4.66 10.34-10.38 10.34zm5.61-7.82c-.31-.16-1.85-.91-2.14-1.01-.29-.11-.5-.16-.7.16-.21.32-.81 1.01-.99 1.22-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.63.15-.15.31-.37.47-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.7-1.68-.96-2.3-.25-.6-.5-.51-.68-.52h-.58c-.2 0-.52.08-.79.4-.27.32-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.23 3.08.16.21 2.11 3.22 5.11 4.52.71.31 1.27.5 1.7.64.71.23 1.35.2 1.85.12.56-.08 1.85-.76 2.11-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.6-.37z" />
      </svg>
    </div>
  );
};



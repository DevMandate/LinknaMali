import React from 'react';
import { Container, Typography } from '@mui/material';

const Master = ({ data, Heading, Icon }) => {
  const handleClick = (link) => {
    if (link) {
      alert(`You clicked on ${link}`);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ padding: 2 }} className=''>
      <Typography 
        variant="h5" 
        sx={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}
      >{Heading}{Icon}
      </Typography>
      {data && (
        data.map((item, index) => (
          <Typography
            key={index}
            sx={{ marginBottom: '10px', cursor: 'pointer' }}
            variant="body2"
            onClick={() => handleClick(item.link)}
          >
            {item.name}
          </Typography>
        ))
      )}
    </Container>
  );
};

export default Master;

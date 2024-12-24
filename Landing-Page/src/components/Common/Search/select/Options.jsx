import React, { useState } from 'react';
import { Button, Box } from '@mui/material';

export default function Options() {
  const [activeButton, setActiveButton] = useState(null);

  const buttons = [
    { id: 1, name: 'For Sale' },
    { id: 2, name: 'For Rent' },
    { id: 3, name: 'Short Stay' },
  ];

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={2} className=''>
      {buttons.map((button) => (
        <Button
          key={button.id}
          variant={activeButton === button.id ? 'contained' : 'outlined'}

          onClick={() => handleButtonClick(button.id)}
        >
          {button.name}
        </Button>
      ))}
    </Box>
  );
}

import React from 'react';
import { Button, Box } from '@mui/material';
import { useSearchEngine } from '../../../../../context/SearchEngine';

export default function Options() {
  const { activeButton, setActiveButton,resetManager } = useSearchEngine();

  const buttons = [
    { id: 1, name: 'For Sale' },
    { id: 2, name: 'For Rent' },
    { id: 3, name: 'Short Stay' },
    { id: 4, name: 'Reset' },
  ];

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={2} className=''
      sx={{
        minWidth:'400px',
        '@media (max-width: 450px)': {
          minWidth:'unset'
        }
      }}
    >
      {buttons.map((button) => (
        (button.id === 4 ? resetManager : true) && (
          <Button
            key={button.id}
            variant={activeButton === button.id ? 'contained' : 'outlined'}
            color={button.id === 4 ? 'error' : ''}
            sx={{
              borderColor: button.id !== 4 ? 'var(--merime-theme)' : undefined,
              backgroundColor: button.id === activeButton ? 'var(--merime-theme)': undefined,
              color: button.id === activeButton ? 'var(--color-white)': undefined,
            }}
            onClick={() => handleButtonClick(button.id)}
          >
            {button.name}
          </Button>
        )
      ))}
    </Box>
  );
}

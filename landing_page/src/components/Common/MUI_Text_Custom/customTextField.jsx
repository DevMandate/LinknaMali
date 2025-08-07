import React from 'react';
import TextField from '@mui/material/TextField';

const CustomTextField = ({ sx, editMode = true, ...props }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderWidth: editMode ? '1px' : '0px',
            borderColor: 'var(--merime-theme)', // Border color
          },
          '&:hover fieldset': {
            borderColor: 'var(--merime-theme)', // Border color on hover
          },
          '&.Mui-focused fieldset': {
            borderColor: 'var(--merime-theme)', // Border color when focused
          },
        },
        '& input[type="date"]': {
          color: 'var(--text)', //Date input 
        },
        '& .MuiInputLabel-root': {
          color: 'gray', //Universal Label
        },
        ...sx, // Allow additional custom styling via sx prop
      }}
      slotProps={{
        inputLabel: {
          style: {
            color: 'gray', // Color for label
          },
        },
        input: {
          style: {
            color: 'var(--text)', // Color for input text
          },
        },
      }}
      {...props} // Spread other props like label, value, etc.
    />
  );
};

export default CustomTextField;

// BasicSelect.js
import React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import locations from './Filters/locations';

export default function BasicSelect() {
  const [location, setLocation] = React.useState('');

  const handleChange = (event) => {
    setLocation(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth
        sx={{
          '& .MuiInputLabel-root': {
            color: 'var(--MUI-input)',
          },
          '& .MuiSvgIcon-root' :{
            fill: 'var(--MUI-input)',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '',
            }
          }
        }}>
        <InputLabel>Locations</InputLabel>
        <Select
          value={location}
          label="Locations"
          onChange={handleChange}
        >
          {locations.map((loc) => (
            <MenuItem key={loc.id} value={loc.name}>
              {loc.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

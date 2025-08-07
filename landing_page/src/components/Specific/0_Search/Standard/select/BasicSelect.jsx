// BasicSelect.js
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import locations from './Filters/locations';
import { useSearchEngine } from '../../../../../context/SearchEngine';

export default function BasicSelect() {
  const { 
    location,
    setLocation,
  } = useSearchEngine();

  const [fetchedLocations, setFetchedLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('https://api.linknamali.ke/property/getlocations');
        setFetchedLocations(response.data.data);
      } catch (error) {
        setFetchedLocations(locations);
      }
    };
    fetchLocations();
  }, []);



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
          '& .MuiOutlinedInput-input ,': {
            color: 'var(--MUI-input)',
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
          {fetchedLocations && fetchedLocations.map((loc) => (
            <MenuItem key={loc.id} value={loc.name}>
              {loc.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

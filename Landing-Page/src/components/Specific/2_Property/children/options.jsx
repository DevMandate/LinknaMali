import React from 'react';
import { useNavigate } from "react-router-dom";
import Grid from '@mui/material/Grid2';
import cities from "./data/cities";
import properties from '../../3_Rentals/data/properties';
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {gridSize} from '../../../../utils/gridSize'
import { useMediaQuery, Typography, Box } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';

function Options() {
  const navigate = useNavigate();
  const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 910px)");
  const CitiesResponsive = gridSize(isSmallScreen,priorityDisplay,'property', cities, 2,5);
  const handleProperty = (city) => {
    setPriorityDisplay('propertyDetails');
    const encodedName = encodeURIComponent(city.name.replace(/ /g, "-"));
    navigate(`/cities/${encodedName}`, { state: { properties, action: 'grid', Extra: city  } });
  };
  return (
    <Grid container spacing={2} className=''
        sx={{
            justifyContent: "center",
            padding: "20px",
        }}>
      {CitiesResponsive.map((city) => (
        <Grid item
         key={city.id}
         sx={{position: 'relative', height:'auto'}}
         ><img src={city.image} 
            alt={city.name}
            style={{ 
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                borderRadius:'10px',
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
            }}
            onClick={() => handleProperty(city)}
        />
        <Box sx={{position:'absolute', top:'10px', left:'10px', padding:2 ,color: 'var(--color-white)'}}>
            <Typography>{city.name}</Typography>
            <Typography>{city.listings} listings</Typography>
        </Box>
        <LocationOnIcon sx={{ position:'absolute', bottom:'10px',left:'10px', fontSize: 30, color: 'white' }} />
        </Grid>
      ))}
    </Grid>
  );
}

export default Options;

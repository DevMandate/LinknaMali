import React from 'react';
import Grid from '@mui/material/Grid2';
import properties from "./data/properties";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {gridSize} from '../../../../utils/gridSize'
import { useMediaQuery, Typography, Box } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';

function Options() {
  const {priorityDisplay} = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 910px)");
  const PropertiesResponsive = gridSize(isSmallScreen,priorityDisplay,'property', properties, 2,5);
  const handleProperty = (property) => {
    alert(`View ${property.name} ?`); 
};
  return (
    <Grid container spacing={2} className=''
        sx={{
            justifyContent: "center",
            padding: "20px",
        }}>
      {PropertiesResponsive.map((property) => (
        <Grid item
         key={property.id}
         sx={{position: 'relative', height:'auto'}}
         ><img src={property.image} 
            alt={property.name}
            style={{ 
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                borderRadius:'10px',
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
            }}
            onClick={() => handleProperty(property)}
        />
        <Box sx={{position:'absolute', top:'10px', left:'10px', padding:2 ,color: 'var(--color-white)'}}>
            <Typography>{property.name}</Typography>
            <Typography>{property.listings} listings</Typography>
        </Box>
        <LocationOnIcon sx={{ position:'absolute', bottom:'10px',left:'10px', fontSize: 30, color: 'white' }} />
        </Grid>
      ))}
    </Grid>
  );
}

export default Options;

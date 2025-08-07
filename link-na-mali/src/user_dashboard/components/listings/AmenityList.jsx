import { Grid2 as Grid, Box, Typography } from "@mui/material";
import './amenities.css'
const amenityBaseURL = "https://files.linknamali.ke/assets/frontend/icons/";

const AmenityList = ({ amenities }) => {
  const amenityArray = amenities ? amenities.split(",") : [];

  return (
    <Grid container spacing={2}>
      {amenityArray.map((amenity, index) => (
        <Grid item='true' xs={6} sm={4} md={3} key={index}> 
          <Box className='Amenities'>
            <img
              src={`${amenityBaseURL}${encodeURIComponent(amenity.replace("/", "-"))}.png`}
              width={20}
              height={20}
            />
            <Typography sx={{ mt: 1 , fontSize: 12}}>
              {amenity}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default AmenityList;

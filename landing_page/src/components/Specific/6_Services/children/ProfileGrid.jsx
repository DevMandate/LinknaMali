// ProfileGrid.jsx

import React from 'react';
import { Grid, Container } from '@mui/material';
import ProfileCard from './ProfileCard'; // Import the ProfileCard component

const ProfileGrid = ({ profiles }) => {
  return (
    <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
      <Grid container spacing={1.5} sx={{ justifyContent: 'center' }}>
        {profiles.map((profile) => (
          <Grid item xs={12} sm={6} md={4} key={profile.id} sx={{ display: 'flex' }}>
            <ProfileCard profile={profile} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProfileGrid;

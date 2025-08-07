import React from "react";
import { Box } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import {useLogin} from '../../../context/IsLoggedIn'
import Content from '../../Common/content'
import OurFeaturesData from './data'
function OurFeatures() {
    const { isLoggedIn} = useLogin();
    const {priorityDisplay} = usePriorityDisplay();
    const Title = '';
    const Subtitle = 'Your trusted partner for finding, buying, and renting with confidence.';
    return(
      <Box 
        id='our features'
        sx={{
          display: isLoggedIn ? 'none' : (priorityDisplay === 'our features' || priorityDisplay === null ? 'block' : 'none'),
        }}>
        <Content Title={Title} Subtitle={Subtitle} minimax='200px' data={OurFeaturesData} displayID='our features'/>
      </Box>
    );
}

export default OurFeatures;

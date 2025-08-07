import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useLogin } from '../../../context/IsLoggedIn';
import Content from '../../Common/content';
import WhyUsData from './data';

function WhyUs() {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const [scrollBeforeExpand, setScrollBeforeExpand] = useState(0);

  const Title = 'Why Linknamali?';
  const Subtitle = 'Discover, invest, and settle with confidence';

  useEffect(() => {
    if (priorityDisplay === 'why us') {
      const y = sessionStorage.getItem('whyUsScrollY');
      if (y) {
        window.scrollTo(0, parseInt(y));
        sessionStorage.removeItem('whyUsScrollY');
      }
    }
  }, [priorityDisplay]);

  const handleBack = () => {
    setPriorityDisplay(null);
    const y = sessionStorage.getItem('whyUsScrollY');
    if (y) {
      setTimeout(() => window.scrollTo(0, parseInt(y)), 100);
    }
  };

  return (
    <Box
      id='why us'
      sx={{
        display: isLoggedIn
          ? 'none'
          : (priorityDisplay === 'why us' || priorityDisplay === null ? 'block' : 'none'),
        minHeight: '300px',
      }}
    >

      <Content
        Title={Title}
        Subtitle={Subtitle}
        minimax='300px'
        data={WhyUsData}
        displayID='why us'
        onClickViewMore={() => {
          sessionStorage.setItem('whyUsScrollY', window.scrollY.toString());
          setPriorityDisplay('why us');
        }}
      />
    </Box>
  );
}

export default WhyUs;

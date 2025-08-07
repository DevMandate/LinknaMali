import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { scrollIntoView } from '../../../utils/scrollIntoView';
import Service from "./service";
import BlogReader from './Blogs/BlogReader';

function Main() {
  const location = useLocation();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const [detailsDisplay, setdetailsDisplay] = useState(null);

  const endpoint = location.state ? Object.values(location.state)[0] : null;
  const Action = location.state ? Object.values(location.state)[1] : null;

  useEffect(() => {
    scrollIntoView('propertyDetails');
    setdetailsDisplay(endpoint);
    setPriorityDisplay('propertyDetails');
    sessionStorage.setItem('detailsScrollY', window.scrollY.toString());
  }, [endpoint]);

  const handleBack = () => {
    setPriorityDisplay(null);
    const y = sessionStorage.getItem('detailsScrollY');
    if (y) {
      setTimeout(() => window.scrollTo(0, parseInt(y)), 100);
      sessionStorage.removeItem('detailsScrollY');
    }
  };

  return (
    <Box
      id='propertyDetails'
      sx={{
        display: priorityDisplay === 'propertyDetails' ? 'block' : 'none',
        minHeight: "300px",
        padding: "10px",
      }}
    >
      {/* ✅ Visible Back Button */}
      {priorityDisplay === 'propertyDetails' && (
        <Typography
          variant="body1"
          onClick={handleBack}
          sx={{
            color: 'var(--merime-theme)',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '20px',
            marginLeft: '20px',
            marginBottom: '20px',
            display: 'inline-block',
          }}
        >
          ← Back
        </Typography>
      )}

      {Action?.[0] === 'service' && (
        <Service id={detailsDisplay} />
      )}

      {/* Add other Action checks here if needed */}
    </Box>
  );
}

export default Main;

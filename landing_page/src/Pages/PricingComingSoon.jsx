import React from "react";
import { Box, Typography } from "@mui/material";

const PricingComingSoon = () => {
  return (
    <Box
      minHeight="80vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
    >
      <Typography variant="h3" gutterBottom>
        🚧 Pricing Page Coming Soon
      </Typography>
      <Typography variant="body1">
        We're working hard to bring you updated pricing information. Please check back later!
      </Typography>
    </Box>
  );
};

export default PricingComingSoon;

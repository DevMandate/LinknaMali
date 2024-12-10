import React from "react";
import { Container,Box, Typography } from "@mui/material";
import properties from "./data/properties";

export default function PropertyGrid() {
  return (
    <Container
      className=''
      maxWidth='lg'
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        justifyContent: "center",
        "@media (max-width: 1000px)": {
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        },
      }}
    >
      {properties.map((property) => (
        <Box
          key={property.id}
          sx={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <img
            src={property.image}
            alt={property.name}
            style={{
              width: "100px",
              height: "auto",
            }}
          />
          <Box sx={{ padding: "16px" }}>
            <Typography variant="h6" gutterBottom>
              {property.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Location: {property.location}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Price: {property.price}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Size: {property.size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Owner: {property.owner}
            </Typography>
          </Box>
        </Box>
      ))}
    </Container>
  );
}

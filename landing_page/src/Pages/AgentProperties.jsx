import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyGrid from "../components/Specific/0_Search/searchResults";
import axios from "axios";
import { Box, Container, Typography, Button } from "@mui/material";

const BASE_URL = "https://api.linknamali.ke";

export default function AgentProperties() {
  const { user_name } = useParams();
  const navigate = useNavigate();
  const [agentProperties, setAgentProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);
  const [loading, setLoading] = useState(true);

  const propertyTypes = ["apartments", "houses", "land", "commercial", "reset"];

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/property/getaccomodation`);
        const allProperties = res.data?.data || [];

        const filtered = allProperties.filter(
          (property) => property.user_name?.trim() === user_name?.trim()
        );
        setAgentProperties(filtered);
        setFilteredProperties(filtered);
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user_name]);

  const handleFilterClick = (type) => {
    if (type === "reset") {
      setSelectedPropertyType(null);
      setFilteredProperties(agentProperties);
      return;
    }

    const filtered = agentProperties.filter(
      (property) =>
        property.property_type?.toLowerCase() === type.toLowerCase()
    );
    setSelectedPropertyType(type);
    setFilteredProperties(filtered);
  };

  return (
    <Container sx={{ pt: 5 }}>
      {/* ✅ Back to Rentals Button */}
      <Box
        sx={{
          paddingBottom: '10px',
          paddingLeft: { xs: '8px', sm: '15px' },
        }}
      >
        <Typography
          onClick={() => navigate("/", { state: { scrollTo: "rentals" } })}
          sx={{
            cursor: "pointer",
            fontWeight: 500,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            color: "var(--merime-theme)",
            width: "fit-content",
            marginLeft: { xs: '4px', sm: '6px' }
          }}
        >
          ← Back to Listings
        </Typography>
      </Box>

      <Typography variant="h5" gutterBottom>
        Properties Listed by: {user_name}
      </Typography>

      {/* Updated Filter Buttons */}
      <Box sx={{ mt: 2, mb: 3 }}>
        {propertyTypes.map((type) => (
          <Button
            key={type}
            onClick={() => handleFilterClick(type)}
            variant={selectedPropertyType === type ? "contained" : "outlined"}
            color={type === "reset" ? "warning" : ""}
            sx={{
              margin: "10px",
              display:
                selectedPropertyType === null && type === "reset"
                  ? "none"
                  : "inline-flex",
              borderColor: type !== "reset" ? "var(--merime-theme)" : undefined,
              backgroundColor:
                selectedPropertyType === type ? "var(--merime-theme)" : undefined,
              color:
                selectedPropertyType === type ? "var(--color-white)" : undefined,
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Typography>Loading properties...</Typography>
      ) : filteredProperties.length > 0 ? (
        <PropertyGrid properties={filteredProperties} />
      ) : (
        <Box mt={4}>
          <Typography>No properties found for this agent.</Typography>
        </Box>
      )}
    </Container>
  );
}

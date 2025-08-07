import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, Container, Button } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useSearchEngine } from '../../../context/SearchEngine';
import { scrollIntoView } from '../../../utils/scrollIntoView';
import SearchResults from './searchResults';
import axios from 'axios';

function Engine() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const {
    searchEngine,
    setSearchEngine,
    setActiveButton,
    bedroomType,
    houseType,
    landType,
    commercialType
  } = useSearchEngine();

  const [rawData, setRawData] = useState(null);
  const [newdata, setNewData] = useState(null);
  const [detailsDisplay, setdetailsDisplay] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [hasUnmatchedResults, setHasUnmatchedResults] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  const keyword = searchParams.get("keyword");
  const purpose = searchParams.get("purpose");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const amenities = searchParams.get("amenities");

  useEffect(() => {
    if (keyword && keyword.trim() !== "") {
      setSearchEngine(false);
    }
  }, [keyword]);

  let endpoint = new URLSearchParams(searchParams);
  const location = searchParams.get("location");
  if (location) endpoint.set("location", location);
  if (bedroomType) endpoint.set("bedrooms", bedroomType);
  if (houseType) endpoint.set("house_type", houseType);
  if (landType) endpoint.set("land_type", landType);
  if (commercialType) endpoint.set("commercial_type", commercialType);
  if (purpose) endpoint.set("purpose", purpose);
  if (minPrice) endpoint.set("min_price", minPrice);
  if (maxPrice) endpoint.set("max_price", maxPrice);
  if (amenities) endpoint.set("amenities", amenities);
  endpoint = endpoint.toString();

  const filter = searchParams.get("filter");
  useEffect(() => {
    if (endpoint || keyword) setPriorityDisplay('engine');
  }, [endpoint, keyword]);

  useEffect(() => {
    if (filter) setFilterActive(true);
  }, [filter]);

  function JSONObjectHandler(rawData) {
    const filteredData = {};
    let totalResults = [];

    Object.keys(rawData).forEach((category) => {
      let items = Array.isArray(rawData[category])
        ? rawData[category].map((item) => {
            return Object.fromEntries(
              Object.entries(item).filter(([key]) =>
                !["user_id", "created_at", "updated_at"].includes(key)
              )
            );
          })
        : [];

      if (bedroomType && category === 'apartments') {
        items = items.filter(item => item.number_of_bedrooms === bedroomType);
      } else if (houseType && category === 'houses') {
        items = items.filter(item => item.house_type?.toLowerCase() === houseType.toLowerCase());
      } else if (landType && category === 'land') {
        items = items.filter(item => item.land_type?.toLowerCase() === landType.toLowerCase());
      } else if (commercialType && category === 'commercial') {
        items = items.filter(item => item.commercial_type?.toLowerCase() === commercialType.toLowerCase());
      }

      filteredData[category] = items;
      totalResults = totalResults.concat(items);
    });

    setNewData(filteredData);
    setdetailsDisplay(totalResults);
    requestAnimationFrame(() => setNotFound(totalResults.length === 0));
  }

  useEffect(() => {
    if (rawData) JSONObjectHandler(rawData);
  }, [rawData]);

  useEffect(() => {
    scrollIntoView('engine');
    const fetchData = async () => {
      if (searchEngine && !(keyword && keyword.trim() !== "")) return;

      setNewData(null);
      setNotFound(false);
      setdetailsDisplay(null);
      setSelectedProperty(null);

      try {
        setSearchEngine(true);

        let url = `https://api.linknamali.ke/engine/search?${endpoint}`;
        if (keyword && keyword !== "null" && keyword.trim() !== "") {
          url = `https://api.linknamali.ke/property/propertylocationsearch?keyword=${encodeURIComponent(keyword)}`;
        }

        const response = await axios.get(url);

        if (response.data && (response.data.data || response.data.results)) {
          const resultPayload = response.data.data || {
            apartments: response.data.results || [],
            houses: [],
            land: [],
            commercial: []
          };
          setRawData(resultPayload);
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setNotFound(true);
        }
      } finally {
        setSearchEngine(false);
      }
    };

    if (endpoint || (keyword && keyword !== "null" && keyword.trim() !== "")) {
      fetchData();
    }
  }, [endpoint, filterActive, keyword]);

  const propertyTypes = ["apartments", "houses", "land", "commercial", "reset"];

  const handleButtonClick = (category) => {
    if (category === "reset") {
      setSelectedProperty(null);
      const allData = [
        ...(Array.isArray(newdata?.apartments) ? newdata.apartments : []),
        ...(Array.isArray(newdata?.houses) ? newdata.houses : []),
        ...(Array.isArray(newdata?.land) ? newdata.land : []),
        ...(Array.isArray(newdata?.commercial) ? newdata.commercial : []),
      ];
      setdetailsDisplay(allData);
    } else {
      setSelectedProperty(category);
      setdetailsDisplay(newdata[category] || []);
    }
  };

  return (
    <Box
      id='engine'
      sx={{
        display: priorityDisplay === 'engine' ? 'block' : 'none',
        minHeight: "300px",
      }}
    >
     
      {searchParams.get("location") ? (
          <Typography
            onClick={() => navigate("/", { state: { scrollTo: "properties" } })}
            sx={{
              px: { xs: 2, sm: 4 },
              pt: { xs: 2, sm: 3 },
              cursor: "pointer",
              fontWeight: 500,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              color: "var(--merime-theme)",
              width: "fit-content",
            }}
          >
            ← Back to Listings
          </Typography>
        ) : (
         <Typography
              onClick={() => navigate(-1)}
              sx={{
                px: { xs: 2, sm: 4 },
                pt: { xs: 2, sm: 3 },
                cursor: "pointer",
                fontWeight: 500,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                color: "var(--merime-theme)",
                width: "fit-content",
              }}
            >
              ← Back to Search
            </Typography>
        )}


      <Container maxWidth='lg'>
        <Typography sx={{ mt: 2 }} variant="h4">Results for Search</Typography>

        {!filterActive && propertyTypes.map((type) => (
          <Button
            variant={selectedProperty === type ? "contained" : "outlined"}
            key={type}
            onClick={() => handleButtonClick(type)}
            color={type === "reset" ? "warning" : ""}
            sx={{
              margin: "10px",
              display: selectedProperty === null && type === 'reset' ? 'none' : 'inline-flex',
              borderColor: type !== "reset" ? 'var(--merime-theme)' : undefined,
              backgroundColor: selectedProperty === type ? 'var(--merime-theme)' : undefined,
              color: selectedProperty === type ? 'var(--color-white)' : undefined,
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}

        {detailsDisplay && detailsDisplay.length === 0 && notFound === false && (
          <Typography variant="h6" color="error">
            No {selectedProperty || 'exact matches'} found
          </Typography>
        )}
        {notFound === true && (
          <Typography variant="h6" color="error">
            We couldn’t locate any properties matching your search
          </Typography>
        )}
        {searchEngine && (
          <Container sx={{ marginTop: 5 }}><CircularProgress size={50} /></Container>
        )}
      </Container>

      {detailsDisplay && detailsDisplay.length > 0 && (
        <SearchResults properties={detailsDisplay} gridSizeOverride={true} />
      )}

      {hasUnmatchedResults && !showAllResults && (
        <Container className="mt-[50px]">
          <h2 style={{ fontSize: '1.1rem' }}>
            The rest of the results might not be what you're looking for.
            <span
              style={{ color: '#35BEBD', cursor: 'pointer' }}
              onClick={() => setShowAllResults(true)}
            > See more anyway</span>
          </h2>
        </Container>
      )}
    </Box>
  );
}

export default Engine;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography } from "@mui/material";
import { useLogin } from "../../../../context/IsLoggedIn";
import { useSearchEngine } from '../../../../context/SearchEngine';
import { usePriorityDisplay } from '../../../../context/PriorityDisplay';
import BasicSelect from './select/BasicSelect';
import CheckMarks from './select/CheckMarks';
import PriceRange from './select/PriceRange';
import Options from './select/Options';
import SearchBar from './Amenities/amenities';
import StandardButton from '../../../Common/MUI_Button_Custom/standard';
import AdsDisplay from '../../4_Rentals/ads/AdsDisplay'; // ← corrected relative path to AdsDisplay

function Search() {
  const {
    purpose,
    location,
    minPrice,
    maxPrice,
    selectedAmenities,
    resetManager,
    searchEngine,
    bedroomType,
    houseType,
    landType,
    commercialType,
    setBedroomType,
    setHouseType,
    setLandType,
    setCommercialType,
  } = useSearchEngine();

  const { isLoggedIn } = useLogin();
  const navigate = useNavigate();
  const { priorityDisplay } = usePriorityDisplay();
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [keyword, setKeyword] = useState("");

  function handleSearch() {
    try {
      if (!resetManager) return;

      // Reset inactive types
      if (bedroomType) {
        setHouseType('');
        setLandType('');
        setCommercialType('');
      } else if (houseType) {
        setBedroomType('');
        setLandType('');
        setCommercialType('');
      } else if (landType) {
        setBedroomType('');
        setHouseType('');
        setCommercialType('');
      } else if (commercialType) {
        setBedroomType('');
        setHouseType('');
        setLandType('');
      }

      const queryParams = new URLSearchParams();
      const addQueryParam = (key, value) => {
        if (value) queryParams.set(key, value);
      };

      addQueryParam("purpose", purpose);
      addQueryParam("location", location);
      addQueryParam("min_price", minPrice);
      addQueryParam("max_price", maxPrice);
      addQueryParam("keyword", keyword);

      if (bedroomType) {
        addQueryParam("property_type", "apartments");
        addQueryParam("bedrooms", bedroomType);
      } else if (houseType) {
        addQueryParam("property_type", "houses");
        addQueryParam("house_type", houseType);
      } else if (landType) {
        addQueryParam("property_type", "land");
        addQueryParam("land_type", landType);
      } else if (commercialType) {
        addQueryParam("property_type", "commercial");
        addQueryParam("commercial_type", commercialType);
      }

      if (advancedSearch) {
        addQueryParam("filter", "advanced");
        addQueryParam("sort_by", "price");
        addQueryParam("amenities", selectedAmenities.join(","));
      }

      const query = queryParams.toString();
      navigate(`/search?${query}`);
    } catch (error) {
      console.error("Failed to build query", error);
    }
  }

  const shouldDisplay =
    priorityDisplay === "search" || (isLoggedIn === false && priorityDisplay === null);

  return (
    <Box sx={{ display: shouldDisplay ? 'flex' : 'none', width: '100%', alignItems: 'flex-start', pt: 3, flexWrap: 'wrap' }}>
      {/* Left Ads */}
      <Box sx={{ flex: '0 0 200px', display: 'block', pr: 2, mb: { xs: 2, md: 0 } }}>
        <AdsDisplay />
      </Box>

      {/* Main Search Container */}
      <Container
        id="search"
        maxWidth={false}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Options />

        <div className="w-full flex justify-center px-4 mt-4">
          <div className="w-full max-w-[500px]">
            <input
              type="text"
              placeholder="Search by town or locality (e.g. Mtwapa, Kilifi)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 bg-[var(--input-bg)] text-sm text-[var(--MUI-input)] placeholder:text-[var(--MUI-input)] placeholder:font-normal placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-[var(--merime-theme)] shadow-sm"
            />
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center px-4 py-6 space-y-4">
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <BasicSelect />
            <CheckMarks />
            <PriceRange />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
            <SearchBar setAdvancedSearch={setAdvancedSearch} />
            <StandardButton
              fullWidth={false}
              onClick={handleSearch}
              isloading={searchEngine}
              text="Search"
            />
          </div>
        </div>
      </Container>

      {/* Right Ads */}
      <Box sx={{ flex: '0 0 200px', display: 'block', pl: 2, mt: { xs: 2, md: 0 } }}>
        <AdsDisplay />
      </Box>
    </Box>
  );
}

export default Search;

import React, { createContext, useState, useContext, useEffect } from 'react';

const SearchEngineContext = createContext();

export const SearchEngineProvider = ({ children }) => {
  const [searchEngine, setSearchEngine] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [resetManager, setResetManager] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [bedroomType, setBedroomType] = useState('');
  const [houseType, setHouseType] = useState('');
  const [landType, setLandType] = useState('');
  const [commercialType, setCommercialType] = useState('');



  useEffect(() => {
    //Display Reset Button if any field has value. Manages: 0_Search -> handlesearch()
    const hasNonEmptyValue = [
      purpose,
      location,
      propertyType.length > 0,
      minPrice,
      maxPrice,
      selectedAmenities.length > 0,
      houseType,
      landType,
      commercialType
    ].some(Boolean);  
    setResetManager(hasNonEmptyValue);
  }, [purpose, location, propertyType, minPrice, maxPrice, activeButton,selectedAmenities]);
  

  useEffect(() => {
      const purposeMap = {
          1: 'Sale',
          2: 'Rent',
          3: 'Short Stay',
      };
      if (activeButton === 4) {
      setPurpose('');
      setPropertyType([]);
      setLocation('');
      setMinPrice('');
      setMaxPrice('');
      setSelectedAmenities([]);
      setBedroomType('');
      setHouseType('');
      setLandType('');
      setCommercialType('');
      setResetManager(false);
      setActiveButton(null);
  }else {
        setPurpose(purposeMap[activeButton]);
      }
  }, [activeButton, purpose, location, propertyType, minPrice, maxPrice, selectedAmenities]);

  return (
    <SearchEngineContext.Provider 
      value={{ 
        activeButton, 
        setActiveButton, 
        resetManager, 
        purpose, 
        location, 
        setLocation, 
        propertyType, 
        setPropertyType, 
        minPrice, 
        setMinPrice, 
        maxPrice, 
        setMaxPrice, 
        searchEngine, 
        setSearchEngine, 
        selectedAmenities, 
        setSelectedAmenities,
        bedroomType,
        setBedroomType,
        houseType, 
        setHouseType,
        landType, 
        setLandType,
        commercialType, 
        setCommercialType,
      }}>
      {children}
    </SearchEngineContext.Provider>
  );
};

export const useSearchEngine = () => {
  return useContext(SearchEngineContext);
};
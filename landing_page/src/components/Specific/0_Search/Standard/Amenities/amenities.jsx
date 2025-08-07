import React, { useEffect } from 'react';
import { Select } from 'antd';
import { useSearchEngine } from '../../../../../context/SearchEngine';
import amenities from './amenity';
import './amenity.css';

const { Option } = Select;

const SearchableMultiSelect = ({setAdvancedSearch}) => {
    const { 
        selectedAmenities,
        setSelectedAmenities
    } = useSearchEngine();

    useEffect(() => {
        setAdvancedSearch(selectedAmenities.length > 0);
    }, [selectedAmenities]);      

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      size="large"
      placeholder="Search and select amenities..."
      className="amenity-search-bar"
      // value={selectedAmenities}
      value={Array.isArray(selectedAmenities) ? selectedAmenities : []}
      onChange={(values) => setSelectedAmenities(values)}
      filterOption={(input, option) =>
        option.children.toLowerCase().includes(input.toLowerCase())
      }
    >
      {amenities.map((amenity) => (
        <Option key={amenity} value={amenity}>
          {amenity}
        </Option>
      ))}
    </Select>
  );
};

export default SearchableMultiSelect;

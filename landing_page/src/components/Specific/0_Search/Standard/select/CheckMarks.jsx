import React, { useState } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { useSearchEngine } from '../../../../../context/SearchEngine';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// 🔁 Mapping user-friendly labels to backend values
const bedroomLabelToValue = {
  'Bedsitter': 'Bedsitter',
  'One Bedroom': '1',
  'Two Bedroom': '2',
  'Three Bedroom': '3',
  'Four Bedroom': '4',
  'Five Bedroom': '5',
};

const propertyMap = {
  Apartment: Object.keys(bedroomLabelToValue),
  House: [
    'Villa', 'Townhouse', 'Bungalow', 'Mansion', 'Duplex', 'Swahili House', 'Other'
  ],
  Land: [
    'Agricultural', 'Commercial', 'Residential', 'Industrial', 'Mixed-Use'
  ],
  Commercial: [
    'Office', 'Shop', 'Warehouse', 'Industrial'
  ],
};

export default function MultipleSelectCheckmarks() {
  const { propertyType, setPropertyType, setBedroomType, setHouseType, setLandType, setCommercialType} = useSearchEngine();
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false); 


  const handleChange = (event) => {
    const selected = typeof event.target.value === 'string'
      ? event.target.value.split(',')
      : event.target.value;

    setPropertyType(selected);

    if (category === 'Apartment' && selected.length > 0) {
      setBedroomType(bedroomLabelToValue[selected[0]] || '');
      setHouseType('');
      setLandType('');
      setCommercialType('');
    } else if (category === 'House') {
      setHouseType(selected[0] || '');
      setBedroomType('');
      setLandType('');
      setCommercialType('');
    } else if (category === 'Land') {
      setLandType(selected[0] || '');
      setBedroomType('');
      setHouseType('');
      setCommercialType('');
    } else if (category === 'Commercial') {
      setCommercialType(selected[0] || '');
      setBedroomType('');
      setHouseType('');
      setLandType('');
    }
  };

  const handleCategoryChange = (event) => {
    const selectedCategory = event.target.value;
    setCategory(selectedCategory);
    setPropertyType([]);
    setBedroomType('');
    setHouseType('');
    setLandType('');
    setCommercialType('');
  };

  return (
    <div>
      <FormControl sx={{ width: 150, '& .MuiInputLabel-root': { color: 'var(--MUI-input)' }, '& .MuiSvgIcon-root': { fill: 'var(--MUI-input)' }, '& .MuiOutlinedInput-input': { color: 'var(--MUI-input)' } }}>
        <InputLabel id="property-type-label">Property Type</InputLabel>
        <Select
          labelId="property-type-label"
          id="property-type-select"
          value={category}
          onChange={handleCategoryChange}
          input={<OutlinedInput label="Property Type" />}
          MenuProps={MenuProps}
        >
          {Object.keys(propertyMap).map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {category && (
        <FormControl sx={{ width: 250, ml: 2, '& .MuiInputLabel-root': { color: 'var(--MUI-input)' }, '& .MuiSvgIcon-root': { fill: 'var(--MUI-input)' }, '& .MuiOutlinedInput-input': { color: 'var(--MUI-input)' } }}>
          <InputLabel id="specific-property-label">Select Type</InputLabel>
          <Select
            labelId="specific-property-label"
            id="specific-property-select"
            multiple
            value={propertyType}
            // onChange={handleChange}
            onChange={(event) => {
              handleChange(event);
              setOpen(false);
            }}
            input={<OutlinedInput label="Select Type" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
            open={open}
            onOpen={() => setOpen(true)} 
            onClose={() => setOpen(false)}
          >
            {propertyMap[category].map((type) => (
              <MenuItem key={type} value={type}>
                <Checkbox checked={propertyType.includes(type)} />
                <ListItemText primary={type} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </div>
  );
}
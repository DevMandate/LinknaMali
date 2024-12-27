// MultipleSelectCheckmarks.js
import React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import propertyTypes from './Filters/propertyTypes';

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

export default function MultipleSelectCheckmarks() {
  const [selectedTypes, setSelectedTypes] = React.useState([]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedTypes(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  return (
    <div>
      <FormControl
        sx={{
          width: 150 ,
          '& .MuiInputLabel-root': {
            color: 'var(--MUI-input)',
          },
          '& .MuiSvgIcon-root' :{
            fill: 'var(--MUI-input)',
          },
          '&  .MuiOutlinedInput-input': {
            color: 'var(--MUI-input)',
          }

        }}>
        <InputLabel id="demo-multiple-checkbox-label">Property Type</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={selectedTypes}
          onChange={handleChange}
          input={<OutlinedInput label="Property Type" />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={MenuProps}
        >
          {propertyTypes.map((type) => (
            <MenuItem key={type} value={type}>
              <Checkbox checked={selectedTypes.includes(type)} />
              <ListItemText primary={type} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

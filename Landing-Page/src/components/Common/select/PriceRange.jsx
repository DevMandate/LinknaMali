import React, { useState } from 'react';
import {TextField, Container} from '@mui/material';

function PriceInput() {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const width= 130;
  return (
    <div>
      <TextField
        label="Min Price"
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        sx={{
          width:`${width}px`, 
          marginRight: 1,
          '& .MuiInputBase-input': {
            color: 'var(--text)',
          },
          '& .MuiInputLabel-root': {
            color: 'var(--MUI-input)',
          },
        }}/>
      <TextField
        sx={{width:`${width}px`,
        '& .MuiInputBase-input': {
          color: 'var(--text)',
        },
        '& .MuiInputLabel-root': {
          color: 'var(--MUI-input)',
        },
      }}
        label="Max Price"
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
    </div>
  );
}
export default PriceInput
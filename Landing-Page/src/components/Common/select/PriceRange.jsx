import React, { useState } from 'react';
import {TextField, Container} from '@mui/material';

function PriceInput() {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const width= 110;
  return (
    <div>
      <TextField
        sx={{width:`${width}px`, marginRight: 1}}
        label="Min Price"
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
      />
      <TextField
        sx={{width:`${width}px`}}
        label="Max Price"
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
    </div>
  );
}
export default PriceInput
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Typography } from '@mui/material';
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import { usePriorityDisplay } from '../../../../context/PriorityDisplay';

const Master = ({ data, Heading, Icon }) => {
  const navigate = useNavigate();
  const {priorityDisplay,setPriorityDisplay } = usePriorityDisplay();
  const handleClick = (link) => {
    if (link.external) {
      navigate(`/${link.link}`,{state: {extra: link.extra,}}); 
      setPriorityDisplay(link.link);
      scrollIntoView(link.link);
    }else{
      if (location.pathname !== `/`) navigate(`/`);
      if (priorityDisplay !== null) setPriorityDisplay(null);
      scrollIntoView(link.link);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ padding: 2 }} className=''>
      <Typography 
        variant="h5" 
        sx={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}
      >{Heading}{Icon}
      </Typography>
      {data && (
        data.map((item, index) => (
          <Typography
            key={index}
            sx={{ marginBottom: '10px', cursor: 'pointer' }}
            variant="body2"
            onClick={() => handleClick(item)}
          >
            {item.name}
          </Typography>
        ))
      )}
    </Container>
  );
};

export default Master;

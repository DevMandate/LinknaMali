import React from 'react';
import { Container, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { usePriorityDisplay } from '../../context/PriorityDisplay';
import { useLogin } from "../../context/IsLoggedIn";
import { scrollIntoView } from '../../utils/scrollIntoView';

const PriorityDisplayControl = ({ display, text, justify, onClick }) => {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();

  const handleViewMore = () => {
    if (onClick) onClick(); // custom logic from parent
    setPriorityDisplay(display);
    scrollIntoView(display);
  };

  const handleViewLess = () => {
    setPriorityDisplay(null);
    scrollIntoView(display);
  };

  if (isLoggedIn === true) return null;

  return (
    <Container
      maxWidth={justify ? 'lg' : 'xs'}
      sx={{
        padding: '0px 20px',
        margin: justify ? 'auto' : 'unset',
      }}
      className={`flex ${justify ? justify : ''}`}
    >
      <Typography
        className={`${priorityDisplay === display ? 'bounce' : ''}`}
        onClick={priorityDisplay === display ? handleViewLess : handleViewMore}
        sx={{
          color: priorityDisplay === display ? 'var(--color-white)' : 'var(--merime-theme)',
          backgroundColor: priorityDisplay === display ? 'red' : 'none',
          padding: '15px 15px',
          borderRadius: '5px',
          zIndex: 2,
          cursor: 'pointer',
          position: priorityDisplay === display ? 'fixed' : 'unset',
          right: '100px',
          top: '300px',
          '@media (max-width:700px)': {
            top: 'unset',
            right: '30px',
            bottom: '30px',
          },
        }}
      >
        {priorityDisplay === display ? (
          <>View less <FontAwesomeIcon icon={faArrowRight} /></>
        ) : (
          <>{text} <FontAwesomeIcon icon={faArrowRight} /></>
        )}
      </Typography>
    </Container>
  );
};

export default PriorityDisplayControl;

import React from "react";
import { Box, Container, Typography, useMediaQuery } from "@mui/material";
import PriorityDisplayControl from './PriorityDisplayControl';
import { usePriorityDisplay } from '../../context/PriorityDisplay';
import { gridSize } from '../../utils/gridSize';
import Heading from './heading';

function Content({ data, Title, Subtitle, minimax, displayID, onClickViewMore }) {
  const { priorityDisplay } = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 560px)");
  const dataResponsive = gridSize(isSmallScreen, priorityDisplay, displayID, data, 3, 6);

  return (
    <Container maxWidth='lg' sx={{ padding: 2 }}>

      <Heading title={Title} subtitle={Subtitle} />

      <Box
        sx={{
          marginTop: "20px", marginBottom: 3,
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${minimax}, 1fr))`,
          gap: "20px",
          justifyContent: "center",
          "@media (max-width: 670px)": {
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          },
        }}
      >
        {dataResponsive && dataResponsive.map((item, index) => (
          <Box
            key={index}
            sx={{
              overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              backgroundColor: "var(--hamburger)",
              borderRadius: "5px",
              textAlign: "center",
              padding: "20px",
              "@media (max-width: 670px)": {
                padding: '10px',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', fontSize: "40px", color: "var(--merime-theme)" }}>
              {<item.icon style={{ fontSize: '40px', marginRight: '10px' }} />}
              <Typography variant="h6">{item.title}</Typography>
            </Box>
            <Typography sx={{ color: "gray", marginTop: "10px" }}>
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ✅ Mobile only: show below cards */}
      {isSmallScreen && data.length > 3 && (
        <Box mt={2} textAlign="center">
          <PriorityDisplayControl
            display={displayID}
            text='View more'
            justify='justify-center'
            onClick={onClickViewMore}
          />
        </Box>
      )}

      {/* ✅ Desktop only: show on top-right */}
      {!isSmallScreen && data.length > 3 && (
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <PriorityDisplayControl
            display={displayID}
            text='View more'
            justify='justify-end'
            onClick={onClickViewMore}
          />
        </Box>
      )}

    </Container>
  );
}

export default Content;

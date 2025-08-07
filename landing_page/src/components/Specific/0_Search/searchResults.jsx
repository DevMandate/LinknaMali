import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
  Container,
  Box,
  useMediaQuery,
  Typography,
  Button,
  Tooltip,
  Link as MuiLink
} from "@mui/material";
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useLogin } from "../../../context/IsLoggedIn";
import ShareIcon from '../../Common/shareProperty';
import LikeIcon from '../../Common/likeProperty';
import { gridSize } from '../../../utils/gridSize';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ReviewModal from '../6_Services/ReviewsModal';

export function OptionsPanel({
  data,
  onOpenReview = () => {},
  iconSize = 25,
  iconSpace = 10
}) {
  return (
    <Box className="flex items-center" gap={1}>
      <Typography
        sx={{
          color: data.availability_status === 'Available' ? 'green' : 'red',
          marginRight: `${iconSpace}px`,
        }}
      >
        {data.availability_status}
      </Typography>
      <LikeIcon data={data} size={iconSize} margin={iconSpace} />
      <ShareIcon data={data} size={iconSize} />
      <Button
        size="small"
        variant="outlined"
        onClick={e => {
          e.stopPropagation();
          onOpenReview(data);
        }}
      >
        Reviews
      </Button>
    </Box>
  );
}

function OptionsControl({ data, onOpenReview }) {
  return (
    <Box className="flex justify-between mb-[20px]" sx={{ px: 1 }}>
      <Box className="flex items-center">
        {data.user_name && (
          <Tooltip title="View all listings by this agent">
            <MuiLink
              component={RouterLink}
              to={`/agent-properties/${encodeURIComponent(data.user_name.trim())}`}
              underline="hover"
              sx={{
                color: '#29327E',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
              aria-label={`View all properties by ${data.user_name}`}
              onClick={(e) => e.stopPropagation()}
            >
              {data.user_name}
            </MuiLink>
          </Tooltip>
        )}
      </Box>
      <OptionsPanel data={data} onOpenReview={onOpenReview} />
    </Box>
  );
}

function OptionsDisplay({ property }) {
  const renderDetail = (condition, Icon, value) => {
    if (!condition) return null;
    return (
      <Typography
        component="span"
        variant="body2"
        className="mr-[5px] flex items-center"
      >
        <Icon style={{ fontSize: 15, marginRight: 3 }} />
        {value}
      </Typography>
    );
  };

  return (
    <Box sx={{ pt: 1, px: 1 }}>
      <Typography variant="subtitle1" gutterBottom noWrap>
        {property.title}, {property.town} {property.Listed_price}
      </Typography>

      <Box className="flex mt-1" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box className="flex">
          {renderDetail(property.parking, DirectionsCarIcon, property.parking)}
          {renderDetail(property.number_of_bathrooms, BathtubIcon, property.number_of_bathrooms)}
          {renderDetail(property.size, OpenWithIcon, property.size)}
        </Box>
        {(property.manually_verified === 1 || (property.verified_by_agent && typeof property.verified_by_agent === 'object')) && (
          <img
            src="/verified-agent.png"
            alt="Verified by agent"
            title="Verified by listing agent"
            style={{
              width: 50,
              height: 50,
              marginLeft: 6,
              objectFit: 'contain',
              verticalAlign: 'middle'
            }}
          />
        )}
      </Box>

      <Box component="hr" my={1} borderColor="var(--HR)" />
    </Box>
  );
}

function PropertyGrid({ properties, gridSizeOverride }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useLogin();
  const { priorityDisplay } = usePriorityDisplay();

  const [openReview, setOpenReview] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const isSmall = useMediaQuery("(max-width:560px)");
  const items = gridSizeOverride || isLoggedIn
    ? properties
    : (properties?.length
        ? gridSize(isSmall, priorityDisplay, 'rentals', properties, 3, 6)
        : []);

  const isImgShort = useMediaQuery("(max-width:1000px)");
  const ImageHeight = isImgShort ? "100px" : "200px";

  useEffect(() => {
    if (items && items.length > 0) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          const headerOffset = 80;
          window.scrollTo({ top: 0 - headerOffset, behavior: "auto" });
        });
      }, 50);
    }
  }, [items]);

  const handlePropertyClick = (e, prop) => {
    e.stopPropagation();
    navigate(`/property/${prop.property_type}/${prop.id}`);
  };

  const handleOpenReview = prop => {
    setSelectedProperty(prop);
    setOpenReview(true);
  };

  const handleCloseReview = () => {
    setOpenReview(false);
    setSelectedProperty(null);
  };

  return (
    <>
      <Container
        maxWidth={isLoggedIn ? false : "lg"}
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 2,
          alignItems: 'stretch',
          "@media (max-width:670px)": {
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 400px))",
          },
        }}
      >
        {items.map(prop => (
          <Box
            key={prop.id}
            onClick={e => handlePropertyClick(e, prop)}
            sx={{
              overflow: "hidden",
              boxShadow: 1,
              bgcolor: "var(--hamburger)",
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
            }}
          >
            {prop.images?.length ? (
              <Box
                component="img"
                src={prop.images[0]}
                alt={prop.title}
                sx={{ width: "100%", height: ImageHeight, objectFit: 'cover' }}
              />
            ) : (
              <Typography
                sx={{
                  width: '100%',
                  height: ImageHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                No Image available
              </Typography>
            )}
            <OptionsDisplay property={prop} />
            <OptionsControl data={prop} onOpenReview={handleOpenReview} />
          </Box>
        ))}
      </Container>

      {selectedProperty && (
        <ReviewModal
          open={openReview}
          onClose={handleCloseReview}
          propertyId={selectedProperty.id}
          propertyType={selectedProperty.property_type}
        />
      )}
    </>
  );
}

export default PropertyGrid;

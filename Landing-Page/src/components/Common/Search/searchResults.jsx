import React,{useState} from "react";
import { useNavigate } from "react-router-dom";
import { Container,Box, useMediaQuery } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import {gridSize} from '../../../utils/gridSize'
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ProfilePicture from '../ProfilePicture'


export function OptionsPanel({ data, iconSize, iconSpace }) {
  const [likes, setLikes] = useState(data.likes); 
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const size = iconSize ? iconSize : 20;
  const margin = iconSpace ? iconSpace : 10;
  const toggleLike = (event) => { 
    event.stopPropagation();
    if (!isLiked) {
      setLikes((prevLikes) => prevLikes + 1); 
    } else {
      setLikes((prevLikes) => prevLikes - 1);
    }
    setIsLiked(!isLiked);
  };

  const toggleShare = (event) => {
    event.stopPropagation();
    setIsShared(!isShared);
    alert(`Property shared: ${data.name}`);
  };

  return (
    <Box className="flex items-center">
      <div className={`relative w-[25px] flex justify-center `}
        style={{marginRight: `${margin}px`}}
      >
        <FavoriteIcon
          onClick={(event) => toggleLike(event)}
          style={{
            fontSize: size,
            color: isLiked ? "red" : "gray",
          }}
        />
        {likes > 0 && (
          <span className="absolute top-[-10px] right-[-10px] bg-red-500 text-white text-xs rounded-full px-[5px]">
            {likes}
          </span>
        )}
      </div>
      <ShareIcon
        onClick={(event) => toggleShare(event)}
        style={{
          fontSize: size,
          color: 'gray',
          margin: '2px'
        }}
      />
    </Box>
  );
}

function OptionsControl({ data }) {

  return (
    <Box className="flex justify-between mb-[20px]" style={{ padding: '0px 5px 0px 10px' }}>
      <Box className='flex items-center'>
        <ProfilePicture src={data.ownerImage} size={25}/>
        <p className="text-sm ml-[5px]">{data.owner}</p>
      </Box>  
      <OptionsPanel data={data}/>
    </Box>
  );
}


function OptionsDisplay({ property }) {
  return (
    <Box sx={{ padding: "10px 5px 0px 10px" }}>
      <h4 className="text-base font-medium text-[0.9rem]">
        {property.name}, {property.location}
      </h4>
      <p className="text-sm">{property.price}</p>
      <Box className='flex'>
        <p className="text-sm mr-[5px]">
          <DirectionsCarIcon style={{ fontSize: 15 }} /> {property.parking}
        </p>
        <p className="text-sm mr-[5px]">
          <BathtubIcon style={{ fontSize: 15 }} /> {property.bathrooms}
        </p>
        <p className="text-sm">
          <OpenWithIcon style={{ fontSize: 10 }} /> {property.size}
        </p>
      </Box>
      <hr className='mt-[10px] mb-[10px] border-[var(--HR)]'/>
    </Box>
  );
}

function PropertyGrid({properties, gridSizeOverride, append}) {
  const navigate = useNavigate();
  const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
  const isSmallScreen = useMediaQuery("(max-width: 560px)");
  const propertiesResponsive = gridSizeOverride ? properties : gridSize(isSmallScreen,priorityDisplay,'rentals', properties, 3,6);
  
  const isImageHeight = useMediaQuery("(max-width: 1000px)");
  const ImageHeight = isImageHeight ? "100px" : "200px";

  function handlePropertyClick(property, append = false) {
    setPriorityDisplay('propertyDetails');
    const encodedName = encodeURIComponent(property.name.replace(/ /g, "-"));
    const currentPath = window.location.pathname;
  
    const newPath = append 
      ? `${currentPath}/properties/${encodedName}` 
      : `/property/${encodedName}`;
  
    navigate(newPath, { state: { property, action: 'details' } });
  }  
  return (
    <Container
      className=''
      maxWidth='lg'
      sx={{
        marginTop: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        justifyContent: "center",
        "@media (max-width: 670px)": {
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        },
      }}
    >
      {propertiesResponsive.map((property) => (
        <Box
          key={property.id}
          onClick={() => handlePropertyClick(property, append)}
          sx={{
            borderRadius: "5px",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            backgroundColor: "var(--hamburger)",
          }}
        >
          <img
            src={property.image}
            alt={property.name}
            style={{
              width: "100%",
              height: ImageHeight,
              objectFit: 'cover',
            }}
          />
          <OptionsDisplay property={property}/>
          <OptionsControl data={property}/>
        </Box>
      ))}
    </Container>
  );
}

export default PropertyGrid

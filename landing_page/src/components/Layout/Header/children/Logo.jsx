import React from "react";
import { useNavigate } from "react-router-dom";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {LinknaMali} from '../../../../assets/images'

function Logo({size}){
    const navigate = useNavigate();
    const {setPriorityDisplay} = usePriorityDisplay();
    const handleClick = () => {
        navigate("/");
        setPriorityDisplay(null);
      };
    return(
        // <img onClick={handleClick}  style={{width:`${size}px`}} src={LinknaMali} title="Link na Mali" alt="LinknaMali Logo"/>
        <img
  onClick={handleClick}
  style={{
    width: `${size}px`,
    display: 'block',          // ✅ Remove inline spacing
    margin: 0,                 // ✅ Remove default margin
    padding: 0,                // ✅ Remove default padding
    lineHeight: 0,             // ✅ Prevent baseline spacing
  }}
  src={LinknaMali}
  title="Link na Mali"
  alt="LinknaMali Logo"
/>

    )
}

export default Logo;

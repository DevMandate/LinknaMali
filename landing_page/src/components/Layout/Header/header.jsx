import React from "react";
import { Box, useMediaQuery, IconButton } from "@mui/material";
import { useLocation } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import Buttons from './children/buttons';
import Nav from './children/Nav';
import Logo from './children/Logo';
import './css/header.css';
import './css/hamburger.css';
import './css/dropdown.css';
import { useLogin } from "../../../context/IsLoggedIn";
import { usePriorityDisplay } from '../../../context/PriorityDisplay';

function AdminNav({ isLoggedIn }) {
  const { drawerOpen, setDrawerOpen } = usePriorityDisplay();

  if (!isLoggedIn) return null;

  return (
    <IconButton
      onClick={() => setDrawerOpen(!drawerOpen)}
      sx={{ color: 'white', ml: 2 }}
    >
      <MenuIcon sx={{ fontSize: '2rem' }} />
    </IconButton>
  );
}

function Header() {
  const { isLoggedIn } = useLogin();
  const isMobile = useMediaQuery("(max-width:1260px)");
  const location = useLocation();
  const { priorityDisplay } = usePriorityDisplay();

  // ✅ Show background image ONLY when on homepage and hero is active
  const isHeroOnly =
    location.pathname === "/" &&
    !isLoggedIn &&
    (priorityDisplay === null || priorityDisplay === "hero");

  return (
    <Box
      id="header"
      className="flex justify-between items-center w-[100%] h-[100px]"
      sx={{
        position: isMobile ? 'static' : 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: isHeroOnly ? 'transparent' : '#516085',
        backgroundImage: isHeroOnly
          ? "url('https://files.linknamali.ke/assets/frontend/others/hero.png')"
          : 'none',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPositionY: isMobile ? '-300px' : '-80px',
        color: 'white',
        overflow: 'hidden',
        marginTop: 0,
        paddingTop: 0,
      }}
    >
      <div className="flex">
        <AdminNav isLoggedIn={isLoggedIn} />
        <Logo size={isLoggedIn ? 120 : 200} />
      </div>
      <Nav isMobile={isMobile} />
      {!isMobile && <Buttons />}
    </Box>
  );
}

export default Header;

import React from "react";
import { Box, Button, Container } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import {ThemeMuiSwitch} from '../Common/Switch'
import {useTheme} from '../../context/Theme'
import {LinknaMali} from '../../assets/images'
import './css/header.css'

function Buttons() {
    const { theme, toggleTheme } = useTheme();
    return(
        <Box className='flex'>
            <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
            <Button
                sx={{
                    color:'inherit',
                    transition: 'color 0.5s ease',
                    "&:hover": {
                        color: "#1976d2"
                    }
                }}
            >Log In</Button>
            <Button
                variant="contained"
                sx={{
                    marginLeft:'20px',
                    marginRight:'10px',
                    backgroundColor:'#22275E',
                    transition: 'background-color 0.5s ease',
                    "&:hover": {
                        backgroundColor: "red"
                    }
                }}
            >Sign Up</Button>
        </Box>
    );
}

function Header() {
    const isMobile = useMediaQuery("(max-width:1000px)");
    const navItems = ["Home", "Property Listing", "Rentals", "About Us"];

    return (
        <Box className='flex justify-between items-center w-[100%]'>

            {/**Link na Mali Logo */}
            <img className="w-[100px]" src={LinknaMali} title="Link na Mali" alt="Link na Mali"/>
            
            {/**Nav */}
            <div className="hamburger-menu flex-col">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
            </div>

            <Container maxWidth='sm' className="header-nav">
                <ul>
                    {navItems.map((item, index) => (
                        <li className="nav-item" key={index}>{item}</li>
                    ))}
                </ul>
            </Container>

            {/**Login and SignUp */}
            {!isMobile &&(
                <Buttons />
            )}
        </Box>
    );
}

export default Header;

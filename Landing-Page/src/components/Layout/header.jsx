import React from "react";
import { Box, Button, Container } from "@mui/material";
import {ThemeMuiSwitch} from '../Common/Switch'
import {useTheme} from '../../context/Theme'
import {LinknaMali} from '../../assets/images'
import './css/header.css'
function Header() {
    const { theme, toggleTheme } = useTheme();
    const navItems = ["Home", "Property Listing", "Rentals", "About Us"];

    return (
        <Box className='flex justify-between items-center'>

            {/**Link na Mali Logo */}
            <img className="w-[100px]" src={LinknaMali} title="Link na Mali" alt="Link na Mali"/>
            
            {/**Nav */}
            <Container maxWidth='md' className="div">
                <ul>
                    {navItems.map((item, index) => (
                        <li className="nav-item" key={index}>{item}</li>
                    ))}
                </ul>
            </Container>

            {/**Login and SignUp */}
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
        </Box>
    );
}

export default Header;

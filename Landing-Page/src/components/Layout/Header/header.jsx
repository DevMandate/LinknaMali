import React from "react";
import { Box } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import Buttons from './children/buttons';
import Nav from './children/Nav';
import Logo from './children/Logo';
import {Hero} from '../../../assets/images'
import './css/header.css';
import './css/hamburger.css';

function Header() {
    const isMobile = useMediaQuery("(max-width:1000px)");

    return (
        <Box className='flex justify-between items-center w-[100%] h-[100px]' >
            <Logo size={100}/>
            <Nav isMobile={isMobile}/>
            {!isMobile &&(
                <Buttons />
            )}
        </Box>
    );
}

export default Header;

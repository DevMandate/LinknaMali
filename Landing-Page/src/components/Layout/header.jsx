import React, {useState} from "react";
import { Link } from "react-scroll";
import { Box, Button, Container } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import {ThemeMuiSwitch} from '../Common/Switch'
import {useTheme} from '../../context/Theme'
import {LinknaMali} from '../../assets/images'
import './css/header.css'
import './css/hamburger.css'

function Buttons() {
    const { theme, toggleTheme } = useTheme();
    return(
        <Box className='flex'
            sx={{
            '@media (max-width: 550px)': {
                gap:2,
                flexDirection: 'column-reverse',
            },
          }}
        >
            <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
            <Button
                sx={{
                    color:'white',
                    transition: 'color 0.5s ease',
                    "&:hover": {
                        color: "#EDEDED"
                    },
                    '@media (max-width: 1000px)': {
                        color: 'inherit',
                    },
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
                        backgroundColor: "#343A85"
                    },
                    '@media (max-width: 380px)': {
                        marginLeft:'0px',
                        marginRight:'0px',
                    }
                }}
            >Sign Up</Button>
            <Button
                variant="contained"
                sx={{
                    marginLeft:'20px',
                    marginRight:'10px',
                    backgroundColor:'red',
                    transition: 'background-color 0.5s ease',
                    "&:hover": {
                        backgroundColor: "#FF0000"
                    },
                    '@media (max-width: 380px)': {
                        marginLeft:'0px',
                        marginRight:'0px',
                    }
                }}
            >Create Listing</Button>
        </Box>
    );
}

function Nav({isMobile}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navItems = ["Home", "Property", "Services", "About"];

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return(
        <>
            <div className={`hamburger-menu flex-col ${menuOpen ? 'cross' : ''}`} onClick={toggleMenu}
            style={{
                position: menuOpen ? 'fixed' : 'absolute',
            }}
            >
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
            </div>
            <Container maxWidth='xs' className={`nav-bar ${menuOpen ? 'active' : ''}`}>
                <ul> 
                    {isMobile &&(
                        <Logo size={100}/>
                    )}
                    {navItems.map((item, index) => (
                        <li className="nav-item" key={index}>
                            <Link 
                                to={item.toLowerCase()} 
                                smooth={true} 
                                duration={500}
                            >{item}
                            </Link>
                        </li>
                    ))}  
                    {isMobile &&(
                        <Buttons />
                    )}                  
                </ul>
            </Container>
        </>
    );
}

function Logo({size}){
    return(
        <img style={{width:`${size}px`}} src={LinknaMali} title="Link na Mali" alt="LinknaMali Logo"/>
    )
}

function Header() {
    const isMobile = useMediaQuery("(max-width:1000px)");

    return (
        <Box className='flex justify-between items-center w-[100%]'>
            <Logo size={100}/>
            <Nav isMobile={isMobile}/>
            {!isMobile &&(
                <Buttons />
            )}
        </Box>
    );
}

export default Header;

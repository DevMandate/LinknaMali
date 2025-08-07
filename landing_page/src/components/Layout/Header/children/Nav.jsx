import React, {useState} from "react";
import {useLocation, useNavigate} from 'react-router-dom'
import { Link } from "react-scroll";
import { Container, Menu, MenuItem } from "@mui/material";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import { useLogin } from "../../../../context/IsLoggedIn";
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import Profile from '../../../Common/Profile'
import Buttons from './buttons'
import Logo from './Logo'



function Select({isMobile, menuOpen, setMenuOpen, isLoggedIn}) {
    const location = useLocation();
    const navigate = useNavigate();
    const {setPriorityDisplay} = usePriorityDisplay();
    const navItems = ["Search", "Properties", "Service Providers", "Pricing", "Projects", "About us", "Blogs"];
    const blogCategories = ["Story za Mitaa", "Property Info and opportunities"];
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMouseEnter = (event) => {
        if (isMobile) {
            setAnchorEl(anchorEl ? null : event.currentTarget);
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleMouseLeave = () => {
        setAnchorEl(null);
    };
    
    function handleLoggedOut(link){
    if (link === 'about us') {
        navigate(`/about us`);
    } else if (link === 'pricing') {
        navigate(`/pricing`);
    } else if (link === 'projects') {
        navigate(`/projects`);
    } else {
        setPriorityDisplay(null);
    }
    }

    const checklist = (link) => {
        if (menuOpen) setMenuOpen(false);
        if (location.pathname !== `/`) navigate(`/`);
        handleLoggedOut(link);
        scrollIntoView(link);
    };

    const blogChecklist = (category) => {
        if (menuOpen) setMenuOpen(false);
        navigate(`/blogs/${category}`);
    }
    
    if(isLoggedIn) return null;
    return(
        <Container maxWidth='sm' 
            sx={{'@media (max-width: 1260px)': {
                overflowY: 'auto',
            },
            }}
            className={`nav-bar ${menuOpen ? 'active' : ''}`}>
            <ul> 
                {isMobile &&(
                    <Logo size={150}/>
                )}
                {navItems.map((item, index) => (
                    <li className="nav-item" key={index}>
                        {item === "Blogs" ? (
                        <div 
                            className="dropdown-wrapper"
                            onMouseLeave={!isMobile ? handleMouseLeave : null}
                            onClick={handleMouseEnter}
                        >
                            <div className={`dropdown-title`}>Blogs ▼</div>
                            <Menu 
                                anchorEl={anchorEl} 
                                open={open} 
                                onClose={handleMouseLeave} 
                                MenuListProps={{ onMouseLeave: handleMouseLeave }}
                                disableScrollLock={true} 
                            >
                                {blogCategories.map((category, i) => (
                                    <MenuItem 
                                        key={i} 
                                        onClick={() => {
                                            blogChecklist(category.toLowerCase());
                                            setAnchorEl(null);
                                        }}
                                    >
                                        {category}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </div>                        
                        ) : (
                            <Link  
                                onClick={() => checklist(item.toLowerCase())}
                                to={item.toLowerCase()} 
                                smooth={true} 
                                duration={500}
                            >
                                {item}
                            </Link>
                        )}
                    </li>
                ))}  
                {isMobile &&(
                    <Buttons isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
                )}                  
            </ul>
        </Container>
    );
}

function Hamburger({menuOpen, toggleMenu, isLoggedIn}) {
    if(isLoggedIn) return null;
    return(            
        <div className={`hamburger-menu flex-col ${menuOpen ? 'cross' : ''}`} onClick={toggleMenu}
            style={{
                position: menuOpen ? 'fixed' : 'absolute',
            }}
        >
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
        </div>
    );
}

function Nav({isMobile}) {
    const { isLoggedIn } = useLogin();
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };
    return(
        <>
            <Hamburger menuOpen={menuOpen} toggleMenu={toggleMenu} isLoggedIn={isLoggedIn}/>
            {isMobile &&(
                <Profile isMobile={isMobile}/>
            )}
            <Select isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen} isLoggedIn={isLoggedIn}/>
        </>
    );
}

export default Nav;

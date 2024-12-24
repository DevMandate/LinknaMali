import React, {useState} from "react";
import { Link } from "react-scroll";
import { Container } from "@mui/material";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import Profile from '../../../Common/Profile'
import Buttons from './buttons'
import Logo from './Logo'

function Nav({isMobile}) {
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
    const [menuOpen, setMenuOpen] = useState(false);
    const navItems = ["Search", "Property", "Services", "About Us"];

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };
    
    const checklist = ( ) => {
        setMenuOpen(false);
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
            {isMobile &&(
                <Profile isMobile={isMobile}/>
            )}
            <Container maxWidth='xs' className={`nav-bar ${menuOpen ? 'active' : ''}`}>
                <ul> 
                    {isMobile &&(
                        <Logo size={100}/>
                    )}
                    {navItems.map((item, index) => (
                        <li className="nav-item" key={index}>
                            <Link  
                                onClick={checklist}
                                to={item.toLowerCase()} 
                                smooth={true} 
                                duration={500}
                            >{item}
                            </Link>
                        </li>
                    ))}  
                    {isMobile &&(
                        <Buttons isMobile={isMobile} />
                    )}                  
                </ul>
            </Container>
        </>
    );
}

export default Nav;

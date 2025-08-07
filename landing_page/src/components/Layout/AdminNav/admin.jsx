import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../../../context/IsLoggedIn';
import { scrollIntoView } from '../../../utils/scrollIntoView';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useMediaQuery ,Drawer, List, ListItem, ListItemText, ListItemIcon, CssBaseline, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ArticleIcon from "@mui/icons-material/Article";
import GavelIcon from "@mui/icons-material/Gavel";
import ImageIcon from "@mui/icons-material/Image";
import EventIcon from "@mui/icons-material/Event";

const drawerWidth = 300; // Adjust width as needed

const AdminNav = () => {
    const { 
        drawerOpen,
        setDrawerOpen,
        setPriorityDisplay 
    } = usePriorityDisplay();
    const { userData,isLoggedIn } = useLogin();
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:1260px)");
    const [isadmin, setIsAdmin] = useState(false);

    function handlePriorityDisplay(link){
        if (link === 'settings') {
            navigate('/settings');
        } else {
            setPriorityDisplay(link);
        }
    }

    const checklist = (link) => {
        if(isMobile) setDrawerOpen(false);
        if (location.pathname !== `/`) navigate(`/`);
        handlePriorityDisplay(link);
        scrollIntoView('header');
    };

    useEffect(() => {
        setDrawerOpen(isLoggedIn && !isMobile);
    }, [isMobile, isLoggedIn]);

    const navItems = [
        { label: "Home", icon: <HomeIcon />, path: "properties" },
        { label: "Search", icon: <SearchIcon />, path: "search" },
        { label: "My Bookings", icon: <EventIcon />, path: "my-bookings" }, 
        { label: "Featured Properties", icon: <BusinessIcon />, path: "rentals" },
        { label: "Service Providers", icon: <PeopleIcon />, path: "service providers" },
        { label: "Settings", icon: <SettingsIcon />, path: "settings" },
    ];
    
    const AdminCenter = [
        { label: "Blog Manager", icon: <ArticleIcon />, path: "blog-manager" },
        { label: "Policy Center", icon: <GavelIcon />, path: "policy-center" },
        { label: "Landing Page Editor", icon: <ImageIcon />, path: "landing-page-editor" },
    ];

    useEffect(() => {
        setIsAdmin(false);
        if(userData?.role=='super_admin' || userData?.role=='admin' ){
            setIsAdmin(true);
        }
    }, [userData, isLoggedIn]);

    return (
        <>
            <CssBaseline />
            <Drawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                sx={{
                    width: drawerOpen ? drawerWidth : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        top: '100px',
                        transition: 'width 0.3s ease',
                        color: 'var(--text)',
                        backgroundColor: 'var(--hamburger)',
                        paddingTop: '10px',
                        zIndex:5,
                        paddingBottom: '100px',
                    },
                }}
            >
                {isadmin &&(<List>
                    <ListItem sx={{fontSize:'1.3rem'}}>Admin Center</ListItem>
                    {AdminCenter.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <ListItem 
                                button='true' 
                                onClick={() => checklist(item.path)}
                                sx={{ padding: '12px 20px' }} // Spacing for a cleaner look
                            >
                                <ListItemIcon sx={{ color: 'var(--text)' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItem>
                            {index < AdminCenter.length - 1 && <Divider/>}
                        </React.Fragment>
                    ))}
                </List>)}
                <List>
                    {isadmin && <ListItem sx={{ fontSize: '1.3rem' }}>Account</ListItem>}
                    {navItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <ListItem 
                                button='true' 
                                onClick={() => checklist(item.path)}
                                sx={{ padding: '12px 20px' }} // Spacing for a cleaner look
                            >
                                <ListItemIcon sx={{ color: 'var(--text)' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItem>
                            {index < navItems.length - 1 && <Divider/>}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>
        </>
    );
};

export default AdminNav;

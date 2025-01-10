import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Avatar, Menu, MenuItem, ListItemIcon, Divider, Typography } from '@mui/material';
import { Logout, Person } from '@mui/icons-material';
import {ThemeMuiSwitch} from './Switch'
import {useTheme} from '../../context/Theme'
import {useLogin} from '../../context/IsLoggedIn'
import {SignUp, Login} from '../Layout/Header/children/buttons'
import './css/profile.css'

const MyAccount = ({isMobile}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, setIsLoggedIn} = useLogin();
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const Profile = [{ Name: 'John Doe', email: 'johndoegmail.com' }]
  const DummyRoutes =[{ dummy: '/dummy', settings: '/settings', MyAccount: '/myaccount' }]
  const ProfileImage = ''
  
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };
  return (
    <React.Fragment>
      <Box 
        sx={{ display: 'flex', alignItems: 'center', textAlign: 'center', marginRight: isMobile ? 7 : 2}} 
        onClick={handleClick}
        className="Account"
      >
      {isLoggedIn && ProfileImage ? (
        <img 
          src={ProfileImage} 
          className='Account-image'
          title="Profile picture" 
          alt="Account_image" 
        />
      ) : (
        <Avatar sx={{
          width: 40, 
          height: 40,
        }} />
      )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {!isLoggedIn && (
          <>
          <MenuItem>
            <Login/>
          </MenuItem>
          <Divider />
          <MenuItem>
            <SignUp />
          </MenuItem>
          </>
        )}
        {isLoggedIn && (
          <>
            <MenuItem onClick={() => { Navigate(DummyRoutes.MyAccount); handleClose(); }}>
              {ProfileImage ? (
                  <Box
                  component="img"
                  src={ProfileImage}
                  sx={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
              ) : (
                  <Avatar sx={{ width: 32, height: 32, borderRadius: '50%' }} />
              )}
              <Box
                sx={{display:'flex', flexDirection: 'column'}}
                >
                <Typography sx={{ ml: 2 }}>{Profile[0].Name}</Typography>
                <Typography sx={{ ml: 2, fontSize: '0.9rem'  }}>{Profile[0].email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { Navigate(DummyRoutes.dummy); handleClose(); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              View Portal
            </MenuItem>
            <MenuItem onClick={() => { toggleLogin(); handleClose(); }}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
            <MenuItem>
              <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
            </MenuItem>
          </>
        )}
      </Menu>
    </React.Fragment>
  );
};

export default MyAccount;

import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Menu, MenuItem, ListItemIcon, Divider} from '@mui/material';
import { Logout, Settings} from '@mui/icons-material';
import {ThemeMuiSwitch} from './Switch'
import {useTheme} from '../../context/Theme'
import {useLogin} from '../../context/IsLoggedIn'
import {usePriorityDisplay} from '../../context/PriorityDisplay'
import {SignUp, Login} from '../Layout/Header/children/buttons'
import './css/profile.css'

const MyAccount = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { theme, toggleTheme } = useTheme();
  const {priorityDisplay} = usePriorityDisplay();
  const { isLoggedIn, userData, setRequestLogout} = useLogin();
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const ProfileImage = userData?.profile_pic_url
  
  const toggleLogout = () => {
    setRequestLogout(true);
  };
  function handleSettings(){
    navigate('/settings')
  }

  return (
    <React.Fragment>
      <Box 
        sx={{ display: 'flex', alignItems: 'center', textAlign: 'center', marginRight: isLoggedIn? 3:7}} 
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
        {!isLoggedIn && [
          priorityDisplay !== 'login' && (
            <React.Fragment key="login">
              <MenuItem>
                <Login />
              </MenuItem>
              <Divider />
            </React.Fragment>
          ),
          priorityDisplay !== 'signup' && (
            <MenuItem key="signup">
              <SignUp />
            </MenuItem>
          )
        ]}

        {isLoggedIn && [
          <MenuItem key="account">
            {ProfileImage ? (
                <img src={ProfileImage} style={{ width: 40, height: 40, borderRadius: '50%' }} />
            ) : (
                <Avatar sx={{ width: 32, height: 32, borderRadius: '50%' }} />
            )}
            {userData &&(
            <div>
              <h2 style={{fontSize:'1.1rem'}} className='ml-2'>{userData.first_name} {userData.last_name}</h2>
              <h2  className='ml-2'>{userData.email}</h2>
            </div>)}
          </MenuItem>,
          <Divider key="divider2" />,
          <MenuItem key="settings" onClick={() => { handleSettings(); handleClose(); }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>,
          <MenuItem key="logout" onClick={() => { toggleLogout(); handleClose(); }}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>,
          <MenuItem key="theme">
            <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
          </MenuItem>
        ]}

      </Menu>
    </React.Fragment>
  );
};

export default MyAccount;

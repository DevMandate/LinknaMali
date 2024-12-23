import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Menu, MenuItem, ListItemIcon, Divider, Typography } from '@mui/material';
import { Settings, Logout, SwitchAccount } from '@mui/icons-material';
import {settings,MyAccount, dummy} from '../../../assets/routes';
import { useProfile } from '../../../contexts/ProfileProvider'

const MyAccount_Nav = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  //Fetch User data
  const { name, email, ProfileImage } = useProfile();

  return (
    <React.Fragment>
      <Box 
        sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }} 
        onClick={handleClick}
        className="dashboard-nav-icon Account-image"
      >
      {ProfileImage ? (
        <img 
          src={ProfileImage} 
          title="Profile picture" 
          alt="Account_image" 
        />
      ) : (
        <Avatar sx={{
          width: 40, 
          height: 40,
          '@media (max-width: 600px)': { 
            width: '100%',
            height: '100%',
          }, 
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
                //backgroundColor: 'var(--color-blue)',
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
        <MenuItem onClick={() => { navigate(MyAccount); handleClose(); }}>
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
            <Typography sx={{ ml: 2 }}>{name}</Typography>
            <Typography sx={{ ml: 2, fontSize: '0.9rem'  }}>{email}</Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { navigate(dummy); handleClose(); }}>
          <ListItemIcon>
            <SwitchAccount fontSize="small" />
          </ListItemIcon>
          Switch account
        </MenuItem>
        <MenuItem onClick={() => { navigate(settings); handleClose(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={() => { navigate(dummy); handleClose(); }}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default MyAccount_Nav;

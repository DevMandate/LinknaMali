import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import Profile from "../../../Common/Profile";
import { ThemeMuiSwitch } from "../../../Common/Switch";
import { useTheme } from "../../../../context/Theme";
import { useLogin } from "../../../../context/IsLoggedIn";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'

function Buttons({ menuOpen, setMenuOpen }) {
  /**Active when device is in full screen mode */
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn } = useLogin();
  const navigate = useNavigate();
  const {priorityDisplay} = usePriorityDisplay();
  function handleCreateListing(){
    if(menuOpen){
      setMenuOpen(false);
    }
    navigate('/login');
  }
  return (
    <Box
      className="flex"
      sx={{
        gap: 2,
        "@media (max-width: 550px)": {
          flexDirection: "column-reverse",
        },
      }}
    >
      {isLoggedIn && <Profile />}
      {isLoggedIn===false && (
        <>
          <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === "dark"} />
          <Login menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
          <SignUp menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </>
      )}
      {priorityDisplay!=='login' && priorityDisplay!=='signup' && !isLoggedIn && (
      <Button
        variant="contained"
        sx={{
          marginRight: "10px",
          backgroundColor: "red",
          transition: "background-color 0.5s ease",
          "&:hover": {
            backgroundColor: "#FF0000",
          },
        }}
        onClick={() => handleCreateListing()}
      >Create Listing
      </Button>)}
    </Box>
  );
}
export default Buttons;

export function Login({menuOpen,setMenuOpen}) {
  const navigate = useNavigate();
  const {priorityDisplay} = usePriorityDisplay();
  function handleLogin(){
    if(menuOpen){
      setMenuOpen(false);
    }
    navigate('/login');
  }
  return priorityDisplay !== 'login' ? (
    <Button
      sx={{
        color: "white",
        marginRight: priorityDisplay==='signup'? '20px': '0px',
        "@media (max-width: 1260px)": {
          color: "inherit",
        },
      }}
      onClick={handleLogin}
    >
      Log In
    </Button>
  ) : null;  
}

export function SignUp({menuOpen, setMenuOpen}) {
  const navigate = useNavigate();
  const {priorityDisplay} = usePriorityDisplay();
  function handleSignUp(){
    if(menuOpen){
      setMenuOpen(false);
    }
    navigate('/signup');
  }
  return priorityDisplay !== 'signup' ? (
    <Button
      variant="contained"
      sx={{ backgroundColor: 'var(--merime-theme)',
        marginRight: priorityDisplay==='login'? '20px': '0px',
      }}
      onClick={handleSignUp}
    >
      Sign Up
    </Button>
  ) : null;
}

import React from "react";
import { Box, Button} from "@mui/material";
import Profile from "../../../Common/Profile";
import {ThemeMuiSwitch} from '../../../Common/Switch'
import {useTheme} from '../../../../context/Theme'
import {useLogin} from '../../../../context/IsLoggedIn'
function Buttons({isMobile}) {
    const { theme, toggleTheme } = useTheme();
    const { isLoggedIn, setIsLoggedIn } = useLogin();

    const toggleLogin = () => {
        setIsLoggedIn(!isLoggedIn);
    };

    return(
        <Box className='flex'
            sx={{
            '@media (max-width: 550px)': {
                gap:2,
                flexDirection: 'column-reverse',
            },
          }}
        >
            {!isMobile && isLoggedIn &&(
                <Profile/>
            )}
            {!isLoggedIn && (
                <>
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
            </>)}
            <Button
                variant="contained"
                sx={{
                    marginLeft: isLoggedIn ? '0px' : '20px',
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
                onClick={toggleLogin}
            >Create Listing</Button>
        </Box>
    );
}
export default Buttons;

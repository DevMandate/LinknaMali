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
            gap:2,
            '@media (max-width: 550px)': {
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
                <Login color={true}/>
                <SignUp/>
            </>)}
            <Button
                variant="contained"
                sx={{
                    marginRight:'10px',
                    backgroundColor:'red',
                    transition: 'background-color 0.5s ease',
                    "&:hover": {
                        backgroundColor: "#FF0000"
                    },
                }}
                onClick={toggleLogin}
            >Create Listing</Button>
        </Box>
    );
}
export default Buttons;

export function Login({color}) {
    return(
        <Button
            sx={{
                color:'white',
                transition: 'color 0.5s ease',
                "&:hover": {
                    ...(color && { color: "#EDEDED" }),
                },
                '@media (max-width: 1000px)': {
                    color: 'inherit',
                    "&:hover":{
                        color: 'unset'
                    }
                },
            }}
        >Log In</Button>
    );
}

export function SignUp() {
    return(
        <Button
            variant='contained'
        >Sign Up</Button>

    );
}



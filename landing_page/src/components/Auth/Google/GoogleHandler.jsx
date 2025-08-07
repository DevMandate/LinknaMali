import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import {useSearchEngine} from '../../../context/SearchEngine'
import GoogleIcon from '../../Common/MUI_Text_Custom/customIcons';
import { Divider, Typography, Button } from "@mui/material";
import {usePriorityDisplay} from '../../../context/PriorityDisplay';
import {useLogin} from '../../../context/IsLoggedIn'

const GOOGLE_AUTH_URL = "https://api.linknamali.ke/auth/google";

const GoogleHandler = ({ onSuccess, text='' }) => {
    const navigate = useNavigate();
    const {setAuthSuccess} = useLogin();
    const {setPriorityDisplay} = usePriorityDisplay();
    const [error, setError] = useState("");
    const {searchEngine,setSearchEngine} = useSearchEngine();

    const handleGoogleSignIn = async () => {
        try {
            setSearchEngine(true);
            setError("");
    
            const width = 500, height = 600;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
    
            const googleWindow = window.open(
                GOOGLE_AUTH_URL,
                "GoogleSignIn",
                `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
            );
            const receiveMessage = (event) => {
                if (event.data === "google-auth-success") {
                    setSearchEngine(false);
                    googleWindow?.close();
                    setAuthSuccess(true);
                    setPriorityDisplay(null);
                    navigate("/");
                    window.removeEventListener("message", receiveMessage);
                }
            };
            window.addEventListener("message", receiveMessage);    
            
            // Polling to detect when the popup closes
            const checkPopup = setInterval(() => {
                if (!googleWindow || googleWindow.closed) {
                    clearInterval(checkPopup);
                    setSearchEngine(false);
                }
            }, 1000);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setSearchEngine(false);
        }
    };    

    return (
        <div className="">
            {error && <p style={{ color: "red" }}>{error}</p>}
            <Divider sx={{ my: 2}}>
                    <Typography sx={{ color: 'text.secondary' }}>or</Typography>
            </Divider>
            <Button
            fullWidth
            variant="outlined"
            disabled={searchEngine}
            onClick={handleGoogleSignIn}
            startIcon={<GoogleIcon />}
            sx={{borderColor:'var(--merime-theme)', color:'var(--text)'}}
            >{text}
            </Button>
        </div>
    );
};

export default GoogleHandler;

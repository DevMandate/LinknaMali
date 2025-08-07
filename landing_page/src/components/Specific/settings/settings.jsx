import React,{useState, useEffect} from 'react';
import { Container, useMediaQuery} from '@mui/material';
import { ArrowBack, Brush, Person, Lock, Feedback as FeedbackIcon, Gavel } from "@mui/icons-material";
import Appearance from './children/Appearance'
import Feedback from './children/Feedback'
import Legals from './children/Legals'
import PersonalInfo from './children/PersonalInfo'
import Security from './children/Security'
import { useLogin } from '../../../context/IsLoggedIn';
import './css/settings.css';

const Settings = () => {
    const { userData } = useLogin();
    const isMobile = useMediaQuery("(max-width: 1260px)");
    const [isactive, setisactive] = useState('appearance');
    function handleActive(active){
        setisactive(active);
    }
    const menuItems = [
        { key: "appearance", label: "Appearance", icon: <Brush fontSize="small" /> },
        { key: "personal", label: "Personal Information", icon: <Person fontSize="small" /> },
        ...(userData?.signup_method === 'Normal' 
            ? [{ key: "security", label: "Security Settings", icon: <Lock fontSize="small" /> }] 
            : []),
        { key: "feedback", label: "Support & Feedback", icon: <FeedbackIcon fontSize="small" /> },
        { key: "legal", label: "Legal & Compliance", icon: <Gavel fontSize="small" /> },
    ];    
    useEffect(() => {
        if(isMobile){
            setisactive('')
        }else{
            setisactive('appearance');
        }
    }, [isMobile]);
    function handleBack(){
        setisactive('') 
    }
    return (
        <Container maxWidth={false}
            className='settings'
        >
            <div
            style={{ display: isMobile && isactive ? "none" : "block" }} 
            className="settings-sidebar">
                <ul>
                {menuItems.map((item) => (
                    <li key={item.key} onClick={() => handleActive(item.key)}>
                    {item.icon}<span className='ml-3'>{item.label}</span>
                    </li>
                ))}
               </ul>
            </div>
            <div
            style={{display: isactive?'block':'none'}} 
            className="settings-content">
                {isMobile &&<ArrowBack onClick={handleBack} sx={{marginBottom:2}} fontSize="large"/>}
                <Appearance isactive={isactive}/>
                <Feedback isactive={isactive}/>
                <Legals isactive={isactive}/>
                <PersonalInfo isactive={isactive}/>
                {userData?.signup_method==='Normal' && (<Security isactive={isactive}/>)}
            </div>
        </Container>
    );
};

export default Settings;

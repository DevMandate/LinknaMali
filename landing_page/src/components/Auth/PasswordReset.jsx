import React, {useState, useEffect} from 'react';
import { useNavigate, useParams } from "react-router-dom";
import {useSearchEngine} from '../../context/SearchEngine'
import CustomPasswordField from '../Common/MUI_Text_Custom/customPasswordField'
import StandardButton from "../Common/MUI_Button_Custom/standard";
import {usePriorityDisplay} from '../../context/PriorityDisplay';
import {scrollIntoView} from '../../utils/scrollIntoView'
import CircularProgress from '../Common/circularProgress';
import AlertDialogue from '../Common/AlertDialogue'
import {useTheme} from '../../context/Theme'

function PasswordReset() {
    const { 
        alertClose,
        setMessage,
        setAlertOpen,
        setAlertClose,  
    } = useTheme();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        user_id: '',
        reset_uuid: '',
        password1: '',
        password2: '',
    });
    const [error, setError] = useState('');
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();
    const {searchEngine, setSearchEngine} = useSearchEngine();
    
    const { reset_uuid, user_id } = useParams();
    useEffect(() => {
        setPriorityDisplay('reset');
        setFormData(prevData => ({ 
            ...prevData, 
            user_id: user_id, 
            reset_uuid: reset_uuid 
        }));       
    }, [reset_uuid, user_id]);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        }); 
    };
    const handlePasswordReset = async () => {
        try {
            setSearchEngine(true);
            const response = await fetch('https://api.linknamali.ke/auth/password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });
    
            let result;
            try {
                result = await response.json();
            } catch (error) {
                result = { response: "Please check internet connection or try again later." };
            }
    
            if (response.ok) {
                setMessage(`Password reset was successful. Proceed to log in with your new password.`)
                setAlertOpen(true);
            } else {
                if (result.error_code === 'RESET_FAILED') {
                    setMessage(`Password reset has failed. Please try again later.`)
                    setAlertOpen(true);
                } else {
                    setError(result.response);
                }
            }
        } catch (error) {
            setError('Server Error. Please try again later.');
        } finally {
            setSearchEngine(false);
        }
    };    
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (formData.password1 !== formData.password2) {
            setError('Passwords do not match.');
            return;
        }
        handlePasswordReset();
    };
    useEffect(() => {
        if(alertClose){
            navigate(`/`);
            setPriorityDisplay(null);
            scrollIntoView('header');
            setAlertClose(false);
        }
    }, [alertClose]); 
    return (
        user_id ?(
        <div 
        id='login'
        style={{
            display: priorityDisplay === 'reset' ? 'flex' : 'none',
        }}
        className="items-center justify-center">
            <AlertDialogue/>
            <div className="max-w-md w-full  p-8 rounded-lg m-3 bg-[var(--hamburger)] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]">
                <h2 className="text-3xl text-center mb-6">Reset Your Password</h2>
                {error && <div className="mb-4 text-red-500 text-center">{error}</div>}     
                <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
                    <CustomPasswordField
                        id="password1"
                        name="password1"
                        label="Password"
                        value={formData.password1}
                        onChange={handleChange}
                        required
                    />
                    <CustomPasswordField
                        id="password2"
                        name="password2"
                        label="Confirm Password"
                        value={formData.password2}
                        onChange={handleChange}
                        required
                    /> 
                    <StandardButton
                    isloading={searchEngine} 
                    text='Reset Password'/> 
                </form>
            </div>
        </div>):(
            <CircularProgress/>
        )
    );
}

export default PasswordReset;
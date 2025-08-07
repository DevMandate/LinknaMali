import React, { useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField'
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import AlertDialogue from '../../../Common/AlertDialogue'
import {useTheme} from '../../../../context/Theme'

function SendEmailReset() {
    const { 
        alertClose,
        setMessage,
        setAlertOpen,
        setAlertClose,  
    } = useTheme();
    const navigate = useNavigate();
    const {setPriorityDisplay} = usePriorityDisplay();
    const [formData, setFormData] = useState({
        email: '',
    });
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const {searchEngine,setSearchEngine} = useSearchEngine();

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
            const response = await fetch('https://api.linknamali.ke/auth/send-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
    
            let result;
            try {
                result = await response.json();
            } catch (error) {
                result = { response: "Please check your internet connection or try again later." };
            }
            if (response.ok) {
                setMessage(`You'll receive an email with a link to reset your password. Please check your inbox and spam folder.`)
                setAlertOpen(true);  
            } else {
                setError(result.response);
            }
        } catch (error) {
            setError('Server error. Please try again later.');
        } finally {
            setSearchEngine(false);
        }
    };
       
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        handlePasswordReset();
    };

    useEffect(() => {
        setEmail(formData.email);
    }, [formData.email]);

    useEffect(() => {
        if(alertClose){
            navigate(`/`);
            setPriorityDisplay(null);
            scrollIntoView('header');
            setAlertClose(false);
        }
    }, [alertClose]); 

    return (
        <>
        <AlertDialogue/>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}     
        <h2 className='mb-3'>Enter the email address associated with your account.</h2>
        <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">  
                <div><label htmlFor="email" className="block text-sm font-medium">
                Email <span className="text-red-500">*</span>
                </label>
                <CustomTextField
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                /></div> 
                <StandardButton
                isloading={searchEngine} 
                text='Submit'/>
        </form>
        </>
    );
}

export default SendEmailReset;
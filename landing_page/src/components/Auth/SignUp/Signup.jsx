import React, { useState, useEffect} from 'react';
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { LinearProgress} from "@mui/material";
import { motion } from "framer-motion";
import {useSearchEngine} from '../../../context/SearchEngine'
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import Names from './children/Name'
import Identification from './children/Identification';
import Password from './children/Password';
import VerifyOTP from './children/VerifyOTP';
import SendEmailReset from './children/SendEmailReset';
import GoogleHandler from '../Google/GoogleHandler';
import {scrollIntoView} from '../../../utils/scrollIntoView'

function SignUp() {
    const location = useLocation();
    const navigate = useNavigate(); 
    const { setSearchEngine } = useSearchEngine();
    const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();

    // Extract token and email from URL query string
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");
    const invited_email = queryParams.get("email");

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        id_number: '',
        email: '',
        phone_number: '',
        password1: '',
        password2: '',
        role: ''
    });

    const [startTimer, setStartTimer] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);

    const state = location.state ? location.state[0] : null;
    const verify = state ? state.verify : null;
    const email = state ? state.email : null;
    const sendemailreset = state ? state.sendemailreset : null;
    const [error, setError] = useState('');
    const [step, setStep] = useState(0);
    const progress = step === 4 ? 100 : ((step + 1) / 4) * 100;

    function handleNextStep() {
        if (step < 3) {
            setStep(step + 1);
        }
    }

    useEffect(() => {
        if (location.pathname === "/signup") {
            setPriorityDisplay('signup');
            scrollIntoView('signup');
        }
    }, [location.pathname]);

    // Prefill invited email
    useEffect(() => {
        if (invited_email) {
            setFormData(prev => ({ ...prev, email: invited_email }));
        }
    }, [invited_email]);

    useEffect(() => {
        if (forgotPassword) setStep(4);
        if (verify && email) {
            setStep(3);
            setStartTimer(true);
            setFormData(prevData => ({ ...prevData, email: email }));
        }
    }, [verify, email, forgotPassword]);

    useEffect(() => {
        if (sendemailreset) {
            setForgotPassword(true);
        }
    }, [sendemailreset]);

    const handleRegister = async () => {
        try {
            setSearchEngine(true);
            const response = await fetch('https://api.linknamali.ke/auth/signup', {
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
                setError('');
                setStartTimer(true);
                setStep(3); // Move directly to OTP
                setFormData(prev => ({ ...prev, email: formData.email }));

                // Save inviter redirect ID for post-verification redirect
                if (result.redirect_owner_id) {
                    sessionStorage.setItem('redirect_owner_id', result.redirect_owner_id);
                }

            } else {
                setError(result.response);
            }

        } catch (error) {
            setError('Server Error. Please try again later.');
        } finally {
            setSearchEngine(false);
        }
    };

    function handleLogin(){
        navigate('/login');
    };

    function handleForgotPassword(){
        setForgotPassword(true);
    }

    return (
        <div 
        id='signup'
        style={{
            zIndex:'3',//Hamburger has 5, BottomNav has 2
            display: priorityDisplay === 'signup' ? 'flex' : 'none',
        }}
        className="items-center justify-center"
        >
            <div className="max-w-md w-full p-8 m-3 rounded-lg bg-[var(--hamburger)] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]">
            <h2 className="text-3xl text-center mb-6">
            {verify ? 'Verify' : forgotPassword ? 'Reset Your Password' : 'Sign Up'}
            </h2>

                <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
                {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
                <motion.div
                    key={step}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {step === 0 && <Names formData={formData} setFormData={setFormData} handleNextStep={handleNextStep}  />}
                    {step === 1 && <Identification formData={formData} setFormData={setFormData} handleNextStep={handleNextStep} />}
                    {step === 2 && <Password formData={formData} setFormData={setFormData} handleRegister={handleRegister} />}
                    {step === 3 && <VerifyOTP startTimer={startTimer} formData={formData}/>}
                    {step === 4 && <SendEmailReset/>}
                </motion.div>
                <GoogleHandler text='Sign up with Google'/>
                { step !==4 && (<div className="mt-[30px] text-left" style={{cursor:'pointer'}} onClick={() => handleForgotPassword()}>
                    <p className="text-sm text-[var(--merime-theme)]">
                    Forgot Password?
                    </p>
                </div>)}
                <div className="mt-[30px] text-center" style={{cursor:'pointer'}} onClick={() => handleLogin()}>
                    <p className="text-sm text-[var(--text)]">
                        Already have an account? Sign in
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
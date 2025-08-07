import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField'
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {useLogin} from '../../../../context/IsLoggedIn'
import {useSearchEngine} from '../../../../context/SearchEngine'
import StandardButton from "../../../Common/MUI_Button_Custom/standard";

function VerifyOTP({startTimer,formData}) {
    const navigate = useNavigate();
    const {setAuthSuccess} = useLogin();
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const {setPriorityDisplay} = usePriorityDisplay();

    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(900);

    useEffect(() => {
        setEmail(formData.email);
    }, [formData]);

    const handleVerifyOtp = async () => {
        try {
            setSearchEngine(true);
            const response = await fetch('https://api.linknamali.ke/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
                credentials: 'include',
            });

            let result;
            try {
                result = await response.json();
            } catch (error) {
                result = { response: "Please check internet connection or try again later." };
            }

            if (response.ok) {
                setAuthSuccess(true);
                setPriorityDisplay(null);

                const redirectOwnerId = sessionStorage.getItem('redirect_owner_id');
                if (redirectOwnerId) {
                    navigate(`/user-dashboard?as=${redirectOwnerId}`);
                    sessionStorage.removeItem('redirect_owner_id');
                } else {
                    navigate('/user-dashboard');
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


    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        handleVerifyOtp();
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [startTimer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };
    return (
        <>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <form onSubmit={handleSubmit} 
        className="space-y-6 pt-2"
        >
            <div>
                <h2 htmlFor="otp" className=" text-md text-[var(--text)] mb-[20px]">
                    We've sent an OTP to your email. Use it to verify your account.
                </h2>
                <p className="text-sm text-[var(--text)] mb-2">
                    OTP expires in: <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
                </p>
                <CustomTextField
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <StandardButton
            isloading={searchEngine} 
            text='Verify OTP'/>
        </form>
        </>
    );
}

export default VerifyOTP;
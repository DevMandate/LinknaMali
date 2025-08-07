import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useLogin } from '../../context/AppContext';

const handleRegister = async (formData, setError, setOtpSent) => {
    try {
        const response = await fetch('https://api.linknamali.ke/user_register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (response.ok) {
            setOtpSent(true); // Indicate that OTP has been sent
            alert(result.response);
        } else {
            setError(result.response || 'An error occurred during registration.');
        }
    } catch (error) {
        console.error('Error signing up:', error);
        setError('An error occurred during registration.');
    }
};

const handleVerifyOtp = async (email, otp, setError, setIsLoggedIn, setUserName, navigate) => {
    try {
        const response = await fetch('https://api.linknamali.ke/verify_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });
        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('authToken', result.token); // Store the token
            setIsLoggedIn(true); // Update login state in context
            setUserName(email);
            alert(result.response);
            navigate('/user-dashboard/login');
        } else {
            setError(result.response || 'Invalid OTP.');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        setError('An error occurred during OTP verification.');
    }
};

function Register() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        id_number: '',
        email: '',
        phone_number: '(+254) ',
        password1: '',
        password2: '',
        role: ''
    });

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate(); 
    const { setIsLoggedIn, setUserName } = useLogin(); // Destructure setIsLoggedIn and setUserName from context

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (formData.password1 !== formData.password2) {
            setError('Passwords do not match.');
            return;
        }
        handleRegister(formData, setError, setOtpSent);
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        setError('');
        handleVerifyOtp(formData.email, otp, setError, setIsLoggedIn, setUserName, navigate);
    };

    const togglePasswordVisibility1 = () => {
        setShowPassword1(!showPassword1);
    };

    const togglePasswordVisibility2 = () => {
        setShowPassword2(!showPassword2);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
                {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
                {!otpSent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="First Name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                placeholder="Last Name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="id_number" className="block text-sm font-medium text-gray-700">
                                ID Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faIdCard} className="text-gray-400" />
                                </div>
                                <input
                                    id="id_number"
                                    name="id_number"
                                    type="text" // Always show the ID number as text
                                    placeholder="ID Number"
                                    value={formData.id_number}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="phone_number"
                                name="phone_number"
                                type="text"
                                placeholder="+254 123-456-7890"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Select Role</option>
                                <option value="owner">Property Owner</option>
                                <option value="buyer">Property Buyer</option>
                                <option value="agent">Property Agent</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password1" className="block text-sm font-medium text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                </div>
                                <input
                                    id="password1"
                                    name="password1"
                                    type={showPassword1 ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password1}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={togglePasswordVisibility1}>
                                    <FontAwesomeIcon icon={showPassword1 ? faEyeSlash : faEye} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                </div>
                                <input
                                    id="password2"
                                    name="password2"
                                    type={showPassword2 ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={formData.password2}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={togglePasswordVisibility2}>
                                    <FontAwesomeIcon icon={showPassword2 ? faEyeSlash : faEye} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                OTP <span className="text-red-500">*</span>
                            </label>
                            <input
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
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Verify OTP
                            </button>
                        </div>
                    </form>
                )}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/user-dashboard/login" className="text-indigo-600 hover:text-indigo-500">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
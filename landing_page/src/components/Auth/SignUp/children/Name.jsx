import React, { useState, useEffect} from 'react';
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField'
import StandardButton from "../../../Common/MUI_Button_Custom/standard";

function Names({formData, setFormData,handleNextStep}) {
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

    const checkUserExists = async () => {
        if (!email) return;
        try {
            setSearchEngine(true);
            const response = await fetch('https://api.linknamali.ke/auth/is-new-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
    
            let result;
            try {
                result = await response.json();
            } catch (error) {
                result = { response: "Please check internet connection or try again later." };
            }
    
            if (response.ok) {
                handleNextStep(); //User doesn't exist in DB, proceed to next step
            } else {
                setError(result.response);
            }
        } catch (error) {
            setError("Server Error. Please try again later.");
        } finally {
            setSearchEngine(false);
        }
    };    
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        checkUserExists();
    };

    useEffect(() => {
        setEmail(formData.email);
    }, [formData.email]);

    return (
        <>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}     
        <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
                
                <div><label htmlFor="email" className="block text-sm font-medium">
                First Name <span className="text-red-500">*</span>
                </label>
                <CustomTextField
                    id="first_name"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                /></div>
                <div><label htmlFor="email" className="block text-sm font-medium">
                Last Name <span className="text-red-500">*</span>
                </label>
                <CustomTextField
                    id="last_name"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                /></div>   
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
                text='Next'/>
        </form>
        </>
    );
}

export default Names;
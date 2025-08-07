import React, {useState, useEffect} from 'react';
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomPasswordField from '../../../Common/MUI_Text_Custom/customPasswordField'
import StandardButton from "../../../Common/MUI_Button_Custom/standard";

function Password({formData,setFormData, handleRegister}) {
    const [error, setError] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const {searchEngine, setSearchEngine} = useSearchEngine();
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
        handleRegister();
    };
    useEffect(() => {
        setSearchEngine(false)
    }, []);
    return (
        <>
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
                <label className="flex items-center space-x-2 text-sm">
                <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={() => setIsChecked(!isChecked)} 
                />
                <span>
                I agree to the 
                <a 
                href="https://files.linknamali.ke/assets/Company/Linknamali_Terms_of_Use.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className='ml-1'
                style={{textDecoration: 'underline'}}
                >Terms and Conditions
                </a>
                </span>
            </label> 
            <StandardButton
            isloading={searchEngine} 
            disabled={!isChecked}
            text='sign up'/> 
        </form>
        </>
    );
}

export default Password;
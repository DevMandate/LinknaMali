import React, {useEffect} from 'react';
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField'
import CustomSelectField from '../../../Common/MUI_Text_Custom/customSelectField'
import StandardButton from "../../../Common/MUI_Button_Custom/standard";

function Identification({formData, setFormData,handleNextStep}) {
    const {searchEngine,setSearchEngine} = useSearchEngine();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        handleNext();
    };
    function handleNext(){
        setSearchEngine(true)
        handleNextStep();
    }
    useEffect(() => {
        setSearchEngine(false)
    }, []);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">  
            <div><label htmlFor="email" className="block text-sm font-medium">
            ID Number <span className="text-red-500">*</span>
            </label>
            <CustomTextField
                id="id_number"
                name="id_number"
                placeholder="ID Number"
                value={formData.id_number}
                onChange={handleChange}
                required
            /></div>
            <div><label htmlFor="email" className="block text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
            </label>
            <CustomTextField
                id="phone_number"
                name="phone_number"
                type="text"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={handleChange}
                required
            /></div>
            <CustomSelectField
                id="role"
                name="role"
                label="Role"
                value={formData.role || ""}
                onChange={handleChange}
                required
                options={[
                    { value: "general_user", label: "General User" },
                    { value: "owner", label: "Property Owner" },
                    { value: "buyer", label: "Property Buyer" },
                    { value: "agent", label: "Property Agent" },
                    { value: "service_provider", label: "Service Provider" }
                ]}
            />
            <StandardButton
            isloading={searchEngine} 
            text='Next'/>
        </form>
    );
}

export default Identification;
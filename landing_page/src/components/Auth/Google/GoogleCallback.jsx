import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {useSearchEngine} from '../../../context/SearchEngine'
import CustomSelectField from '../../Common/MUI_Text_Custom/customSelectField'
import StandardButton from "../../Common/MUI_Button_Custom/standard";
import {usePriorityDisplay} from '../../../context/PriorityDisplay';
import {LinknaMali} from '../../../assets/images'

const GoogleCallback = ({ onLoginSuccess }) => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    //const status = 'select-role';
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        role: "",
    });
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();

    const [error, setError] = useState("");
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleGoogleCallback = async () => {
        try {
            setSearchEngine(true)
            const response = await fetch('https://api.linknamali.ke/auth/googleusernotfound', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            let result;
            try {
                result = await response.json();
            } catch (error) {
                result = { response: "Please check internet connection or try again later." };
            }
            if (response.ok) {
                setError('');
                window.opener?.postMessage("google-auth-success", "*");
                window.close();
            } else {
                setError(result.response);
            }
        } catch (error) {
            setError('Server Error. Please try again later.');
        } finally {
            setSearchEngine(false);
        }
    };

    useEffect(() => {
        setFormData({
          email: searchParams.get("email") || "",
          first_name: searchParams.get("first_name") || "",
          last_name: searchParams.get("last_name") || "",
        });
    }, [searchParams]);

    useEffect(() => {
        if (status === "success") {
            window.opener?.postMessage("google-auth-success", "*");
            window.close();
        }else if(status === "select-role"){
            setPriorityDisplay('google-callback')
        }
    }, [status]);

    const handleSubmit = (e) => {
        e.preventDefault();
        handleGoogleCallback();
    };

    if (status === "select-role") {
        return (
        <div id='google-callback'
            style={{
                display: priorityDisplay === 'google-callback' ? 'flex' : 'none',
            }}
            className="items-center justify-center">
            <form onSubmit={handleSubmit} className=" max-w-md w-full p-8 rounded-md m-3 bg-[var(--hamburger)] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] space-y-6 text-[var(--text)]">  
                <img src={LinknaMali} width={100}/>
                {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
                <h2>Welcome to LinkNamali! Please select a role to proceed. </h2>
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
                text='Proceed'/>
            </form>
        </div>
        );
    }
};

export default GoogleCallback;

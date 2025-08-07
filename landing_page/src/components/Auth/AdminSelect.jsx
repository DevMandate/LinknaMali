import { useState, useEffect } from "react";
import {useLogin} from '../../context/IsLoggedIn'
import { useParams, useNavigate } from "react-router-dom";
import CustomSelectField from '../Common/MUI_Text_Custom/customSelectField'
import StandardButton from "../Common/MUI_Button_Custom/standard";
import {usePriorityDisplay} from '../../context/PriorityDisplay';

const AdminSelect = () => {
    const navigate = useNavigate()
    const [role, setRole] = useState("");
    const {setAuthCallback} = useLogin();
    const { account , name } = useParams();
    const {priorityDisplay, setPriorityDisplay} = usePriorityDisplay();

    const formattedName = name
        .split("-") // Split by hyphen
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
        .join(" ");

    const formattedAccount = account
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    useEffect(() => {
        setPriorityDisplay('admin-select');
    }, [account,name]);

    const handleChange = (event) => {
        setRole(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        let sessionRole = role === "general_user" ? "general_user" 
                         : role === "admin" ? "admin" 
                         : "";
        // Set session with expiration (1 hour)
        const expiryTime = Date.now() + 60 * 60 * 1000;
        sessionStorage.setItem("userRole", JSON.stringify({ role: sessionRole, expiry: expiryTime }));
        setAuthCallback(true);
        setPriorityDisplay(null);
        navigate('/');
    };
    

    return (
        <div
        id='admin-select'
        style={{
            display: priorityDisplay === 'admin-select' ? 'flex' : 'none',
        }}
        className="w-full flex items-center justify-center h-[300px]">
            <form onSubmit={handleSubmit} className="p-4 bg-[var(--hamburger)] rounded-lg shadow-md max-w-md w-full m-3">
                <h1 className="mb-3">Hello {formattedAccount} {formattedName}, choose an account to log in</h1>
                <CustomSelectField
                    id="role"
                    name="role"
                    label="Select"
                    value={role}
                    onChange={handleChange}
                    required
                    options={[
                        { value: "admin", label: "Admin" },
                        { value: "general_user", label: "Landing Page Control" },
                    ]}
                />
                <StandardButton
                text='Proceed'
                sx={{mt:3}}
                />
            </form>
    </div>
    );
};

export default AdminSelect;

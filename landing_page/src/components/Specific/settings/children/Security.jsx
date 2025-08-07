import React, {useState,useEffect} from "react";
import { useLogin } from '../../../../context/IsLoggedIn';
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomPasswordField from '../../../Common/MUI_Text_Custom/customPasswordField';
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import AlertDialogue from '../../../Common/AlertDialogue'
import {useTheme} from '../../../../context/Theme'

const Security = ({isactive}) => {
  const { 
      alertClose,
      setMessage,
      setAlertOpen,
      setAlertClose, 
  } = useTheme();
  const { userData } = useLogin();
  const {searchEngine,setSearchEngine} = useSearchEngine();
  const [error, setError] = useState(''); 
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
        ...formData,
        [name]: value
    }); 
  };
  const handleSave = async () => {
    try {
        setSearchEngine(true); 
        const response = await fetch(`https://api.linknamali.ke/auth/updatepassword/${userData.user_id}`, {
            method: 'PUT',
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
          setMessage('Password updated successfully');
          setAlertOpen(true);
          setFormData({
            old_password: '',
            new_password: '',
            confirm_password: ''
          });          
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
    if (formData.new_password !== formData.confirm_password) {
        setError('Passwords do not match.');
        return;
    }
    handleSave();
    
  };
  useEffect(() => {
    if(alertClose){
      setAlertClose(false);
    }
  }, [alertClose]);

  return (
    <section id="security"
      style={{display: isactive === 'security' || isactive === null ? 'block' : 'none',}}
    >
        <h2>Security Settings</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
            <CustomPasswordField
                id="old_password"
                name="old_password"
                label="Old Password"
                value={formData.old_password}
                onChange={handleChange}
                required
            />
            <CustomPasswordField
                id="new_password"
                name="new_password"
                label="New password"
                value={formData.new_password}
                onChange={handleChange}
                required
            />
            <CustomPasswordField
                id="confirm_password"
                name="confirm_password"
                label="Confirm Password"
                value={formData.confirm_password}
                onChange={handleChange}
                required            /> 
            <StandardButton
            fullWidth={false} 
            isloading={searchEngine} 
            text='Save Changes'/>
            <AlertDialogue/>
        </form> 
    </section>
  );
};

export default Security;

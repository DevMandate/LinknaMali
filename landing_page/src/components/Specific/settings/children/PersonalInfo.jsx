import React, {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import {usePriorityDisplay} from '../../../../context/PriorityDisplay';
import { useLogin } from '../../../../context/IsLoggedIn';
import {useSearchEngine} from '../../../../context/SearchEngine'
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField';
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import AlertDialogue from '../../../Common/AlertDialogue'
import {useTheme} from '../../../../context/Theme'

const PersonalInfo = ({isactive}) => {
  const { 
      alertClose,
      setMessage,
      setAlertOpen,
      setAlertClose, 
  } = useTheme();
  const navigate = useNavigate();
  const { userData } = useLogin();
  const {searchEngine,setSearchEngine} = useSearchEngine();
  const {setPriorityDisplay} = usePriorityDisplay();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [newFormData, setNewFormData] = useState({});
    const [formData, setFormData] = useState({
      first_name: userData ? userData.first_name : "",
      last_name: userData ? userData.last_name : "",
      email: userData ? userData.email : "",
    });
    const handleChange = (e) => {
      if(userData?.signup_method === "Google") return;
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      handleNewFormData(name, value);
    };

    // Function to track changed fields
    const handleNewFormData = (name, value) => {
      if (value !== (userData?.[name] || "")) {
        setNewFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      } else {
        // If the field is reverted back to original, 
        // remove it from newFormData
        setNewFormData((prev) => {
          const updatedData = { ...prev };
          delete updatedData[name];
          return updatedData;
        });
      }
    };
    useEffect(() => {
      setEditing(Object.keys(newFormData).length > 0);
    }, [newFormData]);

    const handleSave = async () => {
      try {
          setSearchEngine(true); 
          const response = await fetch(`https://api.linknamali.ke/auth/updateuser/${userData.user_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newFormData), 
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
            setMessage('Your details have been updated successfully')
            setAlertOpen(true);
            setEditing(false);
            if(newFormData.email){
              navigate(`/signup`, { state: [{ verify: true, email: newFormData.email }] });
              setPriorityDisplay('signup');
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
  function handleSubmit(e){
    e.preventDefault();
    setError('');
    if (!Object.keys(newFormData).length > 0) return;
    handleSave();
  }
    useEffect(() => {
      if(alertClose){
        setAlertClose(false);
      }
    }, [alertClose]);

  return (
    <section 
      id="personal"
      style={{display: isactive === 'personal' || isactive === null ? 'block' : 'none',}}
    >
        <h2>Personal Information</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {editing && <div className="mb-4 text-[var(--merime-theme)]">Changes might take a few minutes to reflect</div>}
        <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
              <div><label htmlFor="email" className="block text-sm font-medium">
              First Name
              </label>
              <CustomTextField
                  id="first_name"
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  editMode={false}
              /></div>
              <div><label htmlFor="email" className="block text-sm font-medium">
              Last Name
              </label>
              <CustomTextField
                  id="last_name"
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  editMode={false}
              /></div> 
              {editing && newFormData?.email && <div className="mb-4 text-[var(--merime-theme)]">
                Please enter a valid email. An invalid email may affect your ability to log in.</div>}  
              <div><label htmlFor="email" className="block text-sm font-medium">
              Email
              </label>
              <CustomTextField
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  editMode={false}
              /></div> 
              {editing &&(
                <StandardButton
                fullWidth={false} 
                isloading={searchEngine} 
                text='Save Changes'/>
              )}
              <AlertDialogue/>
        </form>
    </section> 
  );
};

export default PersonalInfo;

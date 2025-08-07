import React, {useState, useEffect} from 'react';
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField';
import Contact from '../../../Layout/Footer/children/contact';
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import {useSearchEngine} from '../../../../context/SearchEngine'
import { useLogin } from '../../../../context/IsLoggedIn';
import AlertDialogue from '../../../Common/AlertDialogue'
import {useTheme} from '../../../../context/Theme'

const Feedback = ({isactive}) => {
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
    first_name: userData ? userData.first_name : "",
    last_name: userData ? userData.last_name : "",
    email: userData ? userData.email : "",
    role: userData ? userData.role : "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleFeedback = async () => {
    try {
        setSearchEngine(true); 
        const response = await fetch(`https://api.linknamali.ke/support/feedback`, {
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
          setMessage('Your feedback has been received');
          setAlertOpen(true);
          setFormData({
            message: ''
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
  function handleSubmit(e){
    e.preventDefault();
    setError('');
    handleFeedback();
  }
  useEffect(() => {
    if(alertClose){
      setAlertClose(false);
    }
  }, [alertClose]);

  return (
    <section
      id='feedback'
      style={{display: isactive === 'feedback' || isactive === null ? 'block' : 'none',}}
    >
        <h2>Support & Feedback</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit}>
            <CustomTextField
            id="message"
            name="message"
            label="Your feedback matters to us"
            multiline
            rows={4}
            required
            onChange={handleChange}
            value={formData.message}
            sx={{ margin:'10px 0px 20px 0px'}}
          />
          <StandardButton
          fullWidth={false} 
          isloading={searchEngine} 
          sx={{mb:3}}
          text='Submit'/>
          <Contact />
          <AlertDialogue/>
        </form> 
    </section>
  );
};

export default Feedback;

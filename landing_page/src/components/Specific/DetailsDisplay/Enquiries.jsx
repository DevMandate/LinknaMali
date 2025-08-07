import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, Typography } from "@mui/material";
import {useLogin} from '../../../context/IsLoggedIn'
import {useSearchEngine} from '../../../context/SearchEngine'
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import {scrollIntoView} from '../../../utils/scrollIntoView'
import CustomTextField from '../../Common/MUI_Text_Custom/customTextField'
import StandardButton from "../../Common/MUI_Button_Custom/standard";
import AlertDialogue from '../../Common/AlertDialogue'
import {useTheme} from '../../../context/Theme'
import axios from 'axios';

const Enquiries = () => {
  const { 
      alertClose,
      setMessage,
      setAlertOpen,
      setAlertClose, 
  } = useTheme();
  const navigate = useNavigate();
  const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();
  const {searchEngine,setSearchEngine} = useSearchEngine();
  const { isLoggedIn, userData} = useLogin();

  const [Property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    user_id: userData? userData.user_id : "",
    property_id: '',
    property_type: '',
    first_name: userData? userData.first_name : "",
    last_name: userData? userData.last_name : "",
    email: userData? userData.email : "",
    subject: "",
    message: ""
  });

  const { id, property_type } = useParams();
  useEffect(() => {
      if(!id || !property_type) return;
      setPriorityDisplay('enquiries');
  }, [id, property_type]);

  useEffect(() => {
    if (Property) {
        setFormData(prevData => ({
            ...prevData,
            property_id: Property.id || '',
            property_type: Property.property_type || ''
        }));
    }
  }, [Property]);

  useEffect(() => {
      axios.get(`https://api.linknamali.ke/property/getpropertybyid/${property_type}/${id}`)
          .then(response => {
              setProperty(response.data.data);
          })
          .catch(error => {
              //console.error(error);
          });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const submitEnquiry = async (formData) => {
    try {
      const response = await fetch("https://api.linknamali.ke/bookings/submitenquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting enquiry:', error.message);
      throw error;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSearchEngine(true);
      const response = await submitEnquiry(formData);
      setMessage('Enquiry submitted successfully. The property owner will get back to you via email as soon as possible.')
      setAlertOpen(true);
    } catch (error) {
      alert('Failed to submit enquiry');
    } finally {
      setSearchEngine(false);
    }
  }; 
  useEffect(() => {
    if(alertClose){
      setPriorityDisplay(null);
      navigate('/');
      scrollIntoView('header');
      setAlertClose(false);
    }
  }, [alertClose]); 

  return (
    <Card sx={{ 
      display: priorityDisplay === 'enquiries' ? 'block' : 'none',
      maxWidth: 600, margin: "auto", mt: 5, p: 2,
      backgroundColor:'var(--hamburger)', color:'var(--text)',
      '@media (max-width: 600px)': {
        mt: 'unset',
        m:1
      }
     }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Send an Enquiry
        </Typography>
        {Property &&(
          <Typography>This is to confirm your enquiry is for {Property.title} {Property.property_type} for {Property.purpose}</Typography>
        )}
        <form onSubmit={handleSubmit}>
          {isLoggedIn === false && !userData && (
            <>
              <CustomTextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                margin="normal"
              />
              <CustomTextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                margin="normal"
              />
              <CustomTextField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </>
          )}
          <CustomTextField
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            margin="normal"
          />
          <CustomTextField
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            multiline
            rows={3}
            required
            margin="normal"
          />
          <StandardButton isloading={searchEngine} text='Submit Enquiry' sx={{mt:2}}/>
          <AlertDialogue/>
        </form>
      </CardContent>
    </Card>
  );
};

export default Enquiries;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { Typography, Card, CardContent } from '@mui/material';
import {useSearchEngine} from '../../../../context/SearchEngine'
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import CircularProgress from '../../../Common/circularProgress';
import DetailsBooking from './detailsBooking'
import CustomTextField from '../../../Common/MUI_Text_Custom/customTextField';
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import AlertDialogue from '../../../Common/AlertDialogue' 
import {useTheme} from '../../../../context/Theme'
import axios from 'axios';

const CancelBooking = () => {
    const { 
        alertClose,
        setMessage,
        setAlertOpen, 
        setAlertClose,
    } = useTheme();

    const navigate = useNavigate();
    const {setPriorityDisplay} = usePriorityDisplay();
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const [cancellationMessage, setCancellationMessage] = useState('');
    const [item, setItem] = useState(null);

    const { id } = useParams();  
    const [action, setAction] = useState(null);

    useEffect(() => {
      if (id) { 
        setAction(['cancelBooking']);
      }
    }, [id]);
    
    useEffect(() => {
      axios.get(`https://api.linknamali.ke/bookings/getbookingbyid/${id}`)
          .then(response => {
              setItem(response.data.data);
          })
          .catch(error => {
              //console.error(error);
          });
    }, [id]);  // ✅ included `id` as a dependency

    const handleCancelBooking = async () => {
      setSearchEngine(true);
      try {
        const response = await fetch(`https://api.linknamali.ke/bookings/bookings/${id}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancellation_message: cancellationMessage }),
        });

        if (response.ok) {
          setMessage('Booking cancellation request submitted successfully');
          setAlertOpen(true);
        } else {
          alert('An error occurred while submitting the cancellation request.');
        }
      } catch (error) {
        alert('An error occurred while  submitting the cancellation request.');
        console.error(error);
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
    item && action?(
    <>
      <Card sx={{ 
        maxWidth: 600, width: '100%', padding: 2, mx: "auto", marginBottom:2,
        backgroundColor:'var(--hamburger)', color:'var(--text)', mt:2,
        '@media (max-width:600px)': {
          mx:'unset',
          width:'unset',
          m:1
        }
        }}>
        <CardContent>
          <Typography variant="body1" gutterBottom>
          We’re sorry to hear that you’ve decided to cancel your booking.
          For our records and to help us improve our services,
          we’d appreciate it if you could share the reason for your cancellation.
          Your feedback is valuable to us!
          </Typography>
          <CustomTextField
            label="Message"
            value={cancellationMessage}
            onChange={(e) => setCancellationMessage(e.target.value)}
            multiline
            rows={4}
            sx={{ margin:'10px 0px 20px 0px'}}
          />
          <StandardButton 
          onClick={handleCancelBooking}
          isloading={searchEngine} 
          text='Cancel Booking' sx={{mt:2}}/>
        </CardContent>
      </Card>
      <DetailsBooking itemObject={item} Action={action}/>
      <AlertDialogue/>
    </>):(
      <CircularProgress/>
    )
  );
};

export default CancelBooking;

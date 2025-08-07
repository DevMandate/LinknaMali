import React, {useEffect} from "react";
import {Button} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import CustomTextField from "./customTextField";

function AdditionalInformation({formData,setFormData,handleSubmit,Booking,editing}) {
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    return(
        <>
        <CustomTextField
        label="Special Requests"
        name="special_requests"
        value={formData.special_requests}
        onChange={handleChange}
        multiline
        rows={3}
        margin="normal"
        />
        <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2, backgroundColor: 'var(--merime-theme)' }}
        onClick={handleSubmit}
        >
        {editing ? "Confirm Edit" : `Submit ${Booking?.property_type === 'lands' ? 'Reservation' : 'Booking'}`}
        </Button>
    </>
    );
}

export default AdditionalInformation;
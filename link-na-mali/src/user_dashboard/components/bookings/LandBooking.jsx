import React from "react";
import {MenuItem, Button } from "@mui/material";
import CustomTextField from "./customTextField";

function LandBooking({formData,setFormData,handleNextStep}) {
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    function handleNext(){
        handleNextStep();
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        handleNext();
    };

    return(
        <form onSubmit={handleSubmit}>
        <CustomTextField
          label="Reservation Duration"
          name="reservation_duration" 
          value={formData.reservation_duration}
          onChange={handleChange}
          required
          margin="normal"
        />
        <CustomTextField
          label="Purpose of Purchase"
          name="purchase_purpose"
          select
          value={formData.purchase_purpose}
          onChange={handleChange}
          required
          margin="normal"
        >
          <MenuItem value="residential">Residential</MenuItem>
          <MenuItem value="commercial">Commercial</MenuItem>
          <MenuItem value="agricultural">Agricultural</MenuItem>
        </CustomTextField>
        <CustomTextField
          label="Payment Option"
          name="payment_option"  
          select
          value={formData.payment_option}
          onChange={handleChange}
          required
          margin="normal"
        >
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="deposit">Deposit</MenuItem>
          <MenuItem value="installments">Installments</MenuItem>
        </CustomTextField>
        {formData.payment_option === "installments" && (
          <CustomTextField
            label="Payment Period"
            name="payment_period" 
            value={formData.payment_period}
            onChange={handleChange}
            required
            margin="normal"
          />
        )}
        <Button
        sx={{mt:2}}
        type="submit"
        variant="contained"
        >Next
        </Button>
      </form>
    );
}

export default LandBooking;
import React,{useEffect} from "react";
import {MenuItem } from "@mui/material";
import {useSearchEngine} from '../../../../../context/SearchEngine'
import CustomTextField from "../../../../Common/MUI_Text_Custom/customTextField";
import StandardButton from "../../../../Common/MUI_Button_Custom/standard";

function LandBooking({formData,setFormData,handleNextStep}) {
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    function handleNext(){
        setSearchEngine(true)
        handleNextStep();
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        handleNext();
    };
    useEffect(() => {
        setSearchEngine(false)
    }, []);
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
        <StandardButton
        sx={{mt:2}}
        isloading={searchEngine} 
        text='Next'/>
      </form>
    );
}

export default LandBooking;

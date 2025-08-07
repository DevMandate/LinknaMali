import React, {useEffect, useState} from "react";
import {MenuItem, Button } from "@mui/material";
import CustomTextField from "./customTextField";

function PaymentInformation({formData,setFormData,handleNextStep}) {
    const [warning, setWarning] = useState(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "pay_later_date") {
            const checkInDate = new Date(formData.check_in_date);
            const selectedDate = new Date(value);
            const minDate = new Date(checkInDate);
            minDate.setDate(minDate.getDate() - 2); // 2 days before check-in
            if (selectedDate >= minDate) {
                setWarning(true);
                alert("Please select a date at least 2 days before check-in.");
                return;
            }
        }
    
        setFormData({ ...formData, [name]: value });
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
            label="Payment Option"
            name="payment_option"
            select
            value={formData.payment_option}
            onChange={handleChange}
            required
            margin="normal"
            >
            <MenuItem value="pay_now">Pay Now</MenuItem>
            <MenuItem value="pay_later">Pay Later</MenuItem>
            <MenuItem value="pay_at_property">Pay at Property</MenuItem>
            </CustomTextField>
            {formData.payment_option === "pay_later" && (
                <>
                {warning &&(<h2>Your Check in date is {formData.check_in_date}</h2>)}
                <CustomTextField
                    type="date"
                    name="pay_later_date"
                    value={formData.pay_later_date}
                    onChange={handleChange}
                    required
                    margin="normal"
                />
                </>
            )}
            <CustomTextField
            label="Payment Method"
            name="payment_method"
            select
            value={formData.payment_method}
            onChange={handleChange}
            required
            margin="normal"
            >
            {formData.payment_option !== "pay_at_property" && <MenuItem value="card">Card</MenuItem>}
            {formData.payment_option !== "pay_later" && <MenuItem value="mpesa">Mpesa</MenuItem>}
            {formData.payment_option === "pay_at_property" && <MenuItem value="cash">Cash</MenuItem>}
            </CustomTextField>
            <Button
            sx={{mt:2}}
            type="submit"
            variant="contained"
            >Next
            </Button>
      </form>
    );
}

export default PaymentInformation;

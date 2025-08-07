import React from "react";
import {MenuItem, Button} from "@mui/material";
import CustomTextField from "./customTextField";

function TravelDetails({formData,setFormData, handleNextStep}) {
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
            label="Check-in Date"
            type="date"
            name="check_in_date" 
            value={formData.check_in_date}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            />
            <CustomTextField
            label="Check-out Date"
            type="date"
            name="check_out_date"  
            value={formData.check_out_date}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            />
            <CustomTextField
            label="Purpose of Travel"
            name="travel_purpose"
            select
            value={formData.travel_purpose}
            onChange={handleChange}
            required
            margin="normal"
            >
            <MenuItem value="leisure">Leisure</MenuItem>
            <MenuItem value="business">Business</MenuItem>
            </CustomTextField>
            <CustomTextField
            label="Number of Adults"
            name="number_of_adults" 
            value={formData.number_of_adults}
            onChange={handleChange}
            required
            margin="normal"
            />
            <CustomTextField
            label="Number of Children"
            name="number_of_children" 
            value={formData.number_of_children}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            />
            <CustomTextField
            label="Number of Guests"
            name="number_of_guests"
            value={formData.number_of_guests}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            />
            <CustomTextField
            label="Number of Rooms Needed"
            name="number_of_rooms"  
            value={formData.number_of_rooms}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            />
            <Button
            sx={{mt:2}}
            type="submit"
            variant="contained"
            >Next
            </Button>
      </form>
    );
}

export default TravelDetails;
import React from "react";
import { Grid, Box, TextField } from "@mui/material";
import StandardButton from "../../../components/Common/MUI_Button_Custom/standard";

const ServiceBookingForm = ({ formData, setFormData, handleSubmit, submitting }) => {
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} mt={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            name="booking_date"
            label="Preferred Date"
            InputLabelProps={{ shrink: true }}
            value={formData.booking_date}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Info"
            name="additional_info"
            multiline
            rows={3}
            value={formData.additional_info}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <StandardButton
          text={submitting ? "Submitting..." : "Submit Booking"}
          onClick={handleSubmit}
          isloading={submitting}
        />
      </Box>
    </Box>
  );
};

export default ServiceBookingForm;

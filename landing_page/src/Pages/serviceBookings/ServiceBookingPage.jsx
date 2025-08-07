import React, { useState } from "react";
import { Container, Typography, Snackbar } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useLogin } from "../../context/IsLoggedIn";
import axios from "axios";
import ServiceBookingForm from "./components/ServiceBookingForm";

const ServiceBookingPage = () => {
  const { profileId } = useParams();
  const { userData } = useLogin();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: userData?.first_name || "",
    last_name: userData?.last_name || "",
    email: userData?.email || "",
    phone_number: "",
    booking_date: "",
    additional_info: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      user_id: userData?.id || null,
      service_id: profileId,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone_number: formData.phone_number.trim(),
      booking_date: formData.booking_date,
      additional_info: formData.additional_info.trim() || null
    };

    try {
      await axios.post(
        "https://linknamali.ke/service_bookings",
        payload,
        { withCredentials: true }
      );

      setSnackbarOpen(true);

      setTimeout(() => {
        setSnackbarOpen(false);
        navigate("/");
      }, 2500);

    } catch (error) {
      console.error("Booking error:", error.response?.data || error.message);
      alert(`❌ Booking failed: ${error.response?.data?.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Book a Service Provider
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>
        Please complete the form to request a booking.
      </Typography>

      <ServiceBookingForm
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        message="✅ Booking submitted successfully!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
};

export default ServiceBookingPage;

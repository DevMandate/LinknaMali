import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";
import LandBooking from "./LandBooking";
import TravelDetails from "./TravelDetails";
import PaymentInformation from "./PaymentInfo";
import AdditionalInformation from "./AdditionalInfo";
import { useAppContext } from "../../context/AppContext";

const API_URL = "https://api.linknamali.ke/bookings";

const Bookings = ({ Booking, Action }) => {
  const navigate = useNavigate();
  const { userData } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(!userData);
  const [searchEngine, setSearchEngine] = useState(false);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    id: "",
    user_id: userData?.user_id || "",
    property_id: Booking?.id || "",
    property_type: Booking?.property_type || "",
    check_in_date: "",
    check_out_date: "",
    special_requests: "",
    purchase_purpose: "",
    reservation_duration: "",
    payment_option: "",
    payment_period: "",
    number_of_guests: "",
    number_of_adults: "",
    number_of_children: "",
    number_of_rooms: "",
    travel_purpose: "",
    payment_method: "",
    pay_later_date: "",
  });

  useEffect(() => {
    if (userData) setIsLoading(false);
  }, [userData]);

  // Reusable API Request Function
  const handleBookingRequest = async (url, method, payload) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      alert("Booking processed successfully");
      return data;
    } catch (error) {
      console.error("Booking request error:", error);
      alert(`Failed to process booking: ${error.message}`);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSearchEngine(true);
    const { id, ...payload } = formData;
    
    try {
      if (editing) {
        await handleBookingRequest(`${API_URL}/updatebookings/${id}`, "PUT", payload);
      } else {
        await handleBookingRequest(`${API_URL}/createbookings`, "POST", payload);
      }
    } finally {
      setSearchEngine(false);
    }
  };

  // Update Step Skipping Logic for Land
  useEffect(() => {
    if (Booking?.property_type === "land" && step === 1) {
      setStep(2);
    }
  }, [step, Booking]);

  const progress = ((step + 1) / 4) * 100;

  const StepComponent = {
    0: Booking?.property_type === "land" ? (
      <LandBooking formData={formData} setFormData={setFormData} handleNextStep={() => setStep(1)} />
    ) : (
      <TravelDetails formData={formData} setFormData={setFormData} handleNextStep={() => setStep(1)} />
    ),
    1: <PaymentInformation formData={formData} setFormData={setFormData} handleNextStep={() => setStep(2)} />,
    2: <AdditionalInformation formData={formData} setFormData={setFormData} Booking={Booking} editing={editing} handleSubmit={handleSubmit} />,
  };

  return (
    <Card sx={{ maxWidth: 500, margin: "auto", mt: 5, p: 2, backgroundColor: "var(--hamburger)", color: "var(--text)" }}>
      <CardContent>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {Booking?.property_type === "land" ? "Reserve" : "Book"} a Property
        </Typography>
        <Typography>
          This is to confirm your {Booking?.property_type === "land" ? "reserving" : "booking"} {Booking?.title} {Booking?.property_type} for {Booking?.purpose}
        </Typography>
        <motion.div
          key={step}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {StepComponent[step]}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default Bookings;

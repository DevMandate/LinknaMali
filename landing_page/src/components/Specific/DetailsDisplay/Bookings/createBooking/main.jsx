import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, Typography, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";
import { useLogin } from "../../../../../context/IsLoggedIn";
import { useSearchEngine } from "../../../../../context/SearchEngine";
import { usePriorityDisplay } from "../../../../../context/PriorityDisplay";
import { scrollIntoView } from "../../../../../utils/scrollIntoView";
import AlertDialogue from "../../../../Common/AlertDialogue";
import { useTheme } from "../../../../../context/Theme";
import LandBooking from "./LandBooking";
import TravelDetails from "./TravelDetails";
import PaymentInformation from "./PaymentInfo";
import AdditionalInformation from "./AdditionalInfo";
import CircularProgress from "../../../../Common/circularProgress";
import axios from "axios";
import { useLocation } from "react-router-dom";

const Bookings = () => {
  const { alertClose, setMessage, setAlertOpen, setAlertClose } = useTheme();

  const { userData } = useLogin();
  const navigate = useNavigate();
  const { setSearchEngine } = useSearchEngine();

  const location = useLocation();
  const serviceBooking =
    location.state?.bookingType === "service" ? location.state : null;

  const { setPriorityDisplay } = usePriorityDisplay();

  /**In creation mode, Booking is the actual property, with title and id and size
   * eg Booking.title, Booking.id, hence property_id is Booking.id
   * However in editing mode, Booking is the actual booking, hence Booking.id
   * is the actual booking id not property id.
   *
   * Thats why in editing mode, we dont submit property_id and property_type,
   * to avoid overwriting actual property id with the Booking id.
   */
  const [Booking, setBooking] = useState(null);
  const [Property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    user_id: userData ? userData.user_id : "",
    property_id: "",
    property_type: "",
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
    mpesa_phone: "",
    total_amount: 0,
  });

  useEffect(() => {
    if (serviceBooking) {
      setBooking(serviceBooking);
      setFormData((prev) => ({
        ...prev,
        property_type: "service",
        property_id: serviceBooking.provider_id,
      }));
    }
  }, [serviceBooking]);

  const { id, action, property_type } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => {
    if (action === "edit" && item?.booking) {
      setBooking(item.booking);
    } else if (action === "create" && item) {
      setProperty(item);
      setBooking(item);
    }
  }, [item]);

  useEffect(() => {
    if (Property) {
      setFormData((prev) => ({
        ...prev,
        property_id: Property.id,
        property_type: Property.property_type,
      }));
    }
  }, [Property]);

  useEffect(() => {
    if (action === "create") return;
    axios
      .get(`https://api.linknamali.ke/bookings/getbookingbyid/${id}`)
      .then((response) => {
        setItem(response.data.data);
      })
      .catch((error) => {
        //console.error(error);
      });
  }, []);

  // useEffect(() => {
  //     if(action === 'edit') return;
  //     axios.get(`https://api.linknamali.ke/property/getpropertybyid/${property_type}/${id}`)
  //         .then(response => {
  //             setItem(response.data.data);
  //         })
  //         .catch(error => {
  //             //console.error(error);
  //         });
  // }, []);

  useEffect(() => {
    if (action === "edit") return;

    if (property_type === "service") {
      setItem({
        data: {
          id: "srv-001",
          property_type: "service",
          title: "Deep Cleaning Services",
          purpose: "Booking",
          media: [{ media_url: "https://via.placeholder.com/300x200" }],
        },
      });
    } else {
      axios
        .get(
          `https://api.linknamali.ke/property/getpropertybyid/${property_type}/${id}`
        )
        .then((response) => {
          setItem(response.data.data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);


  // Calculate and update total_amount when dates or property change
  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date && (Property || Booking)) {
      const numberOfDays = calculateDaysBetween(formData.check_in_date, formData.check_out_date);
      const dailyRate = Property?.price || Property?.cost || Property?.amount || Booking?.price || Booking?.cost || Booking?.amount || 0;
      const totalAmount = dailyRate * numberOfDays;

      setFormData(prev => ({
        ...prev,
        total_amount: totalAmount
      }));
    }
  }, [formData.check_in_date, formData.check_out_date, Property, Booking]);



  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (Booking && action === "edit") {
      setEditing(true);
      setFormData((prevData) => ({
        ...prevData,
        id: Booking.id || prevData.id,
        check_in_date: Booking.check_in_date || prevData.check_in_date,
        check_out_date: Booking.check_out_date || prevData.check_out_date,
        special_requests: Booking.special_requests || prevData.special_requests,
        purchase_purpose: Booking.purchase_purpose || prevData.purchase_purpose,
        reservation_duration:
          Booking.reservation_duration || prevData.reservation_duration,
        payment_option: Booking.payment_option || prevData.payment_option,
        payment_period: Booking.payment_period || prevData.payment_period,
        number_of_guests: Booking.number_of_guests || prevData.number_of_guests,
        number_of_adults: Booking.number_of_adults || prevData.number_of_adults,
        number_of_children:
          Booking.number_of_children || prevData.number_of_children,
        number_of_rooms: Booking.number_of_rooms || prevData.number_of_rooms,
        travel_purpose: Booking.travel_purpose || prevData.travel_purpose,
        payment_method: Booking.payment_method || prevData.payment_method,
        pay_later_date: Booking.pay_later_date || prevData.pay_later_date,
        total_amount: Booking.total_amount || prevData.total_amount,
      }));
    }
  }, [Booking, action]);

  // Function to calculate days between two dates
  const calculateDaysBetween = (checkInDate, checkOutDate) => {
    // Convert string dates to Date objects
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }

    // Calculate the difference in milliseconds
    const timeDifference = endDate.getTime() - startDate.getTime();

    // Convert milliseconds to days (1 day = 24 * 60 * 60 * 1000 milliseconds)
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    // Return at least 1 day if check-in and check-out are the same date
    return Math.max(daysDifference, 1);
  };

  const initiateMpesaPayment = async (formData) => {
    try {

      const paymentPayload = {
        phone: formData.mpesa_phone,
        amount: formData.total_amount,
      };

      console.log("All cookies:", document.cookie);

      const response = await fetch("https://api.linknamali.ke/api/mpesa/stk-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.status}`);
      }

      const data = await response.json();

      // Check if STK push was initiated successfully
      if (data.ResponseCode === "0") {
        // STK push sent successfully to user's phone
        return {
          success: true,
          message:
            "Payment request sent to your phone. Please complete the payment.",
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
        };
      } else {
        // STK push failed
        return {
          success: false,
          message:
            data.errorMessage ||
            data.ResponseDescription ||
            "Payment initiation failed",
        };
      }
    } catch (error) {
      console.error("M-Pesa payment error:", error);
      return {
        success: false,
        message: "Failed to initiate payment. Please try again.",
      };
    }
  };

  const submitBooking = async (formData) => {
    // Remove id from the form data, backend creates UUID
    const { id, ...payload } = formData;
    try {
      const response = await fetch(
        "https://api.linknamali.ke/bookings/createbookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error submitting booking:", error.message);
      throw error;
    }
  };

  const updateBooking = async (formData) => {
    //Remove property_id to avoid overwrite
    const { user_id, property_id, property_type, ...payload } = formData;
    try {
      const response = await fetch(
        `https://api.linknamali.ke/bookings/updatebookings/${formData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating booking:", error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      handleEdit();
      return;
    }
    try {
      setSearchEngine(true);
      const response = await submitBooking(formData);
      setMessage(
        "Booking submitted successfully. An email will be sent to you with the details."
      );
      setAlertOpen(true);
    } catch (error) {
      alert("Failed to submit booking");
    } finally {
      setSearchEngine(false);
    }
  };
  const handleEdit = async (e) => {
    try {
      setSearchEngine(true);
      const response = await updateBooking(formData);
      setMessage(
        "Booking updated successfully. The property owner will be informed of the changes."
      );
      setAlertOpen(true);
    } catch (error) {
      alert("Failed to submit booking");
    } finally {
      setSearchEngine(false);
    }
  };

  useEffect(() => {
    if (alertClose) {
      setPriorityDisplay(null);
      navigate("/");
      scrollIntoView("header");
      setAlertClose(false);
    }
  }, [alertClose]);

  /***progress******/
  const [step, setStep] = useState(0);
  const progress = step === 4 ? 100 : ((step + 1) / 4) * 100;
  function handleNextStep() {
    if (step < 3) {
      setStep(step + 1);
    }
  }
  useEffect(() => {
    if (Booking?.property_type === "land" && step === 1) {
      setStep(2);
    }
  }, [step]);

  return Booking ? (
    <Card
      sx={{
        maxWidth: 600,
        margin: "auto",
        mt: 5,
        p: 2,
        backgroundColor: "var(--hamburger)",
        color: "var(--text)",
        "@media (max-width: 600px)": {
          mt: "unset",
          m: 1,
        },
      }}
    >
      <CardContent>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
        {editing ? (
          <Typography variant="h5">Editing</Typography>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              {Property?.property_type === "land"
                ? "Reserve Land"
                : Property?.property_type === "service"
                  ? "Book a Service"
                  : "Book a Property"}
            </Typography>

            <Typography>
              This is to confirm your{" "}
              {Property?.property_type === "land" ? "reserving" : "booking"}{" "}
              {Property?.title} {Property?.property_type} for{" "}
              {Property?.purpose}
            </Typography>
          </>
        )}
        <div>
          <motion.div
            key={step}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {step === 0 &&
              (Booking.property_type === "land" ? (
                <LandBooking
                  formData={formData}
                  setFormData={setFormData}
                  handleNextStep={handleNextStep}
                />
              ) : (
                <TravelDetails
                  formData={formData}
                  setFormData={setFormData}
                  handleNextStep={handleNextStep}
                  propertyId={formData.property_id}
                />
              ))}
            {step === 1 && (
              <PaymentInformation
                formData={formData}
                setFormData={setFormData}
                handleNextStep={handleNextStep}
                initiateMpesaPayment={initiateMpesaPayment}
                Property={Property}
              />
            )}
            {step === 2 && (
              <AdditionalInformation
                formData={formData}
                setFormData={setFormData}
                Property={Property}
                editing={editing}
                handleSubmit={handleSubmit}
              />
            )}
          </motion.div>
          <AlertDialogue />
        </div>
      </CardContent>
    </Card>
  ) : (
    <CircularProgress />
  );
};

export default Bookings;
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Home,
  Calendar,
  Tag,
  CreditCard,
  Phone,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAppContext } from "../../context/AppContext";
import AdsListings from "../ads/AdsListings";
import PaymentPollingModal from "./PaymentPollingModal";

// Helper to format dates
const formatDate = (date) => date.toISOString().split("T")[0];

const Create = ({ onSwitchPhase }) => {
  const { userData } = useAppContext();
  const [mode, setMode] = useState("manual");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    checkoutRequestId: "",
    merchantRequestId: "",
    phoneNumber: "",
  });
  const [pendingAdData, setPendingAdData] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [budget, setBudget] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
  });
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Handle file selection
  const handleMediaChange = (e) => setMediaFiles([...e.target.files]);

  // Callback when using a property to prefill form
  const useProperty = (prop) => {
    setTitle(prop.title);
    setDescription(prop.description);
    setSelectedImages(prop.images || []);
    setMode("manual");
  };

  // Calculate total amount based on budget and date range
  const calculateTotalAmount = () => {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return budget * days;
  };

  // M-Pesa payment initiation
  const initiateMpesaPayment = async (formData) => {
    try {
      const totalAmount = calculateTotalAmount();
      
      const paymentPayload = {
        phone: mpesaNumber,
        amount: 1,
      };

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
          message: "Payment request sent to your phone. Please complete the payment.",
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
        };
      } else {
        // STK push failed
        return {
          success: false,
          message: data.errorMessage || data.ResponseDescription || "Payment initiation failed",
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

  // Create ad after successful payment
  const createAdAfterPayment = async (adData) => {
    try {
      const res = await fetch("https://api.linknamali.ke/ads", {
        method: "POST",
        body: adData,
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.error || data.message === "Invalid date format") {
        setAlert({
          type: "error",
          message: data.error || "Invalid date format.",
        });
        return false;
      } else {
        setAlert({ type: "success", message: "Ad created successfully!" });
        // Reset form
        resetForm();
        onSwitchPhase("manage");
        return true;
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Error creating ad after payment." });
      return false;
    }
  };

  // Reset form helper
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaFiles([]);
    setSelectedImages([]);
    setStartDate(new Date());
    setEndDate(new Date());
    setBudget(100);
    setPaymentMethod("");
    setMpesaNumber("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    
    const userId = userData?.id || userData?.user_id;
    if (!userId) {
      setAlert({ type: "error", message: "User not logged in." });
      return;
    }
    
    if (mediaFiles.length === 0 && selectedImages.length === 0) {
      setAlert({ type: "error", message: "Media is required." });
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("start_date", formatDate(startDate));
    formData.append("end_date", formatDate(endDate));
    formData.append("budget", budget);
    formData.append("payment_method", paymentMethod);
    
    if (paymentMethod === "mpesa") {
      formData.append("mpesa_number", mpesaNumber);
    }
    
    mediaFiles.forEach((file) => formData.append("media_urls", file));
    selectedImages.forEach((url) => formData.append("media_urls", url));

    // Handle payment flow
    if (paymentMethod === "mpesa") {
      // Store the form data for later use after payment
      setPendingAdData(formData);
      
      // Initiate M-Pesa payment
      const paymentResult = await initiateMpesaPayment(formData);
      
      if (paymentResult.success) {
        // Show payment modal and start polling
        setPaymentData({
          checkoutRequestId: paymentResult.checkoutRequestId,
          merchantRequestId: paymentResult.merchantRequestId,
          phoneNumber: mpesaNumber,
        });
        setShowPaymentModal(true);
      } else {
        setAlert({ type: "error", message: paymentResult.message });
      }
    } else if (paymentMethod === "visa") {
      // For Visa payments, proceed directly (implement Visa logic as needed)
      try {
        const res = await fetch("https://api.linknamali.ke/ads", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        const data = await res.json();
        
        if (data.error || data.message === "Invalid date format") {
          setAlert({
            type: "error",
            message: data.error || "Invalid date format.",
          });
        } else {
          setAlert({ type: "success", message: "Ad created successfully!" });
          resetForm();
          onSwitchPhase("manage");
        }
      } catch (err) {
        console.error(err);
        setAlert({ type: "error", message: "Error creating ad." });
      }
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    
    if (pendingAdData) {
      const success = await createAdAfterPayment(pendingAdData);
      if (success) {
        setPendingAdData(null);
      }
    }
  };

  // Handle payment modal close
  const handlePaymentModalClose = (reason) => {
    setShowPaymentModal(false);
    
    if (reason === "retry") {
      // Retry payment
      handleSubmit({ preventDefault: () => {} });
    } else {
      // Cancel - clear pending data
      setPendingAdData(null);
      setAlert({ type: "info", message: "Payment cancelled. Please try again." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      {alert.message && (
        <div
          className={`mb-6 p-4 text-center rounded-lg ${
            alert.type === "success"
              ? "bg-green-50 text-green-800"
              : alert.type === "info"
              ? "bg-blue-50 text-blue-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center px-6 py-2 rounded-full font-semibold transition ${
            mode === "manual"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <PlusCircle className="mr-2" /> Manual
        </button>
        <button
          onClick={() => setMode("fromProperty")}
          className={`flex items-center px-6 py-2 rounded-full font-semibold transition ${
            mode === "fromProperty"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <Home className="mr-2" /> From Property
        </button>
      </div>

      {mode === "fromProperty" ? (
        <AdsListings onSelectProperty={useProperty} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center mb-2 font-medium text-gray-700">
                <Tag className="mr-2" /> Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={20}
                required
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ad title"
              />
            </div>
            <div>
              <label className="flex items-center mb-2 font-medium text-gray-700">
                <Tag className="mr-2" /> Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                required
                className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-blue-500"
                placeholder="Ad description"
              />
            </div>
          </div>

          {/* Date Pickers */}
          <div className="flex space-x-6">
            <div className="flex-1">
              <label className="flex items-center mb-2 font-medium text-gray-700">
                <Calendar className="mr-2" /> Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center mb-2 font-medium text-gray-700">
                <Calendar className="mr-2" /> End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Budget with Total Amount Display */}
          <div>
            <label className="flex justify-center items-center mb-2 font-medium text-gray-700">
              <CreditCard className="mr-2" /> Budget: {budget} KSH/day
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              Total Amount: {calculateTotalAmount()} KSH ({Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} days)
            </div>
          </div>

          {/* Media Upload & Previews */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Upload Image/Video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {selectedImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={url}
                  className="w-24 h-24 object-cover rounded border"
                  onError={(e) => (e.target.src = "/default-placeholder.jpg")}
                />
              ))}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Payment Method
            </label>
            <div className="flex justify-center space-x-8">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="mpesa"
                  checked={paymentMethod === "mpesa"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <Phone className="mr-1" />
                <span>M-Pesa</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="visa"
                  checked={paymentMethod === "visa"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <CreditCard className="mr-1" />
                <span>Visa</span>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {paymentMethod === "mpesa" && (
            <div>
              <label className="flex items-center mb-2 font-medium text-gray-700">
                <Phone className="mr-2" /> M-Pesa Number
              </label>
              <input
                type="text"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                required
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="2547XXXXXXXX"
              />
            </div>
          )}
          {paymentMethod === "visa" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center mb-2 font-medium text-gray-700">
                  <CreditCard className="mr-2" /> Card Number
                </label>
                <input
                  type="text"
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="flex items-center mb-2 font-medium text-gray-700">
                    <Calendar className="mr-2" /> Expiry
                  </label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, expiry: e.target.value })
                    }
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center mb-2 font-medium text-gray-700">
                    <CreditCard className="mr-2" /> CVV
                  </label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value })
                    }
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="CVV"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition"
            >
              <PlusCircle className="mr-2" size={20} /> 
              {paymentMethod === "mpesa" ? "Pay & Create Ad" : "Create Ad"}
            </button>
          </div>
        </form>
      )}

      {/* Payment Polling Modal */}
      <PaymentPollingModal
        open={showPaymentModal}
        onClose={handlePaymentModalClose}
        onPaymentSuccess={handlePaymentSuccess}
        checkoutRequestId={paymentData.checkoutRequestId}
        phoneNumber={paymentData.phoneNumber}
      />
    </div>
  );
};

export default Create;
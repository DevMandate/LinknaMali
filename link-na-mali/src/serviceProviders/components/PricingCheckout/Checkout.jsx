import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTiers } from "./pricing";
import {
  Box,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import PaymentPollingModal from "./PaymentPollingModal";

// Local color palette
const ACCENT = "#29327E";
const SECONDARY = "#35BEBD";

export default function CheckoutPage() {
  const { tierId } = useParams();
  const navigate = useNavigate();

  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [cardInfo, setCardInfo] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch tier data based on tierId
    async function fetchTierData() {
      try {
        const response = await fetchTiers();

        const tier = response.data.tiers.find(t => t.id === tierId);
        if (tier) {
          setSelectedTier(tier);
        } else {
          setError("Tier not found");
        }
      } catch (error) {
        console.error('Failed to fetch tier data:', error);
        setError("Failed to load tier data");
      } finally {
        setLoading(false);
      }
    }

    fetchTierData();
  }, [tierId]);

  const handleBack = () => {
    navigate('/pricing'); // Go back to pricing page
  };

  const handlePaymentSuccess = () => {
    navigate('/pricing'); // Go back to pricing page
  };

  const validateForm = () => {
    if (paymentMethod === "mpesa") {
      if (!phone) {
        setError("Please enter your phone number");
        return false;
      }
      if (!/^254[0-9]{9}$/.test(phone.replace(/\s+/g, ""))) {
        setError("Please enter a valid Kenyan phone number (254XXXXXXXXX)");
        return false;
      }
    } else {
      if (
        !cardInfo.number ||
        !cardInfo.expiry ||
        !cardInfo.cvv ||
        !cardInfo.name
      ) {
        setError("Please fill in all card details");
        return false;
      }
      if (!/^[0-9]{16}$/.test(cardInfo.number.replace(/\s+/g, ""))) {
        setError("Please enter a valid 16-digit card number");
        return false;
      }
    }
    return true;
  };

  const handlePay = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setPaymentLoading(true);
    try {
      if (paymentMethod === "mpesa") {
        const paymentResult = await initiateMpesaPayment(
          phone,
          selectedTier.price
        );

        if (paymentResult.success) {
          // Store payment data and show modal
          setPaymentData({
            checkoutRequestId: paymentResult.checkoutRequestId,
            merchantRequestId: paymentResult.merchantRequestId,
            phoneNumber: phone,
          });

          setShowPaymentModal(true);
        } else {
          setError(paymentResult.message || "Payment initiation failed");
        }
      } else {
        // Handle card payment
        await processCard(cardInfo, selectedTier.id, selectedTier.price);
        setSuccess("Card payment processed successfully!");

        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          handlePaymentSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Auto-format phone number
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.slice(1);
    }
    return cleaned;
  };

  const formatCardNumber = (value) => {
    // Auto-format card number with spaces
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const handlePaymentModalClose = (action) => {
    setShowPaymentModal(false);
    setPaymentData(null);

    if (action === "retry") {
      // Retry payment - call handlePay again
      handlePay();
    }
    // If action is 'cancel', just close modal
  };

  const handlePaymentModalSuccess = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    setSuccess("Payment completed successfully!");

    // Wait a moment to show success message, then redirect
    setTimeout(() => {
      handlePaymentSuccess();
    }, 1500);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state - tier not found
  if (!selectedTier) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Tier not found"}
        </Alert>
        <Button
          variant="contained"
          onClick={handleBack}
          sx={{ backgroundColor: ACCENT }}
        >
          Back to Pricing
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", p: 3 }}>
      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Back Button */}
      <Button
        variant="text"
        onClick={handleBack}
        sx={{ mb: 2, color: ACCENT }}
        disabled={paymentLoading}
      >
        ← Back to Plans
      </Button>

      {/* Payment Form */}
      <Card sx={{ mb: 3, border: `1px solid ${ACCENT}` }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: ACCENT, fontWeight: "bold" }}
          >
            {selectedTier.name} Plan Checkout
          </Typography>

          <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography>Plan:</Typography>
            <Typography sx={{ fontWeight: "bold" }}>
              {selectedTier.name}
            </Typography>
          </Grid>

          <Grid container justifyContent="space-between">
            <Typography>Price:</Typography>
            <Typography sx={{ fontWeight: "bold", color: ACCENT }}>
              KES {selectedTier.price.toLocaleString()}
            </Typography>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ mb: 1, fontWeight: "bold" }}>
            Payment Method:
          </Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              value="mpesa"
              control={<Radio sx={{ color: SECONDARY }} />}
              label="M-Pesa"
              disabled={paymentLoading}
            />
            <FormControlLabel
              value="card"
              control={<Radio sx={{ color: SECONDARY }} />}
              label="Credit/Debit Card"
              disabled={paymentLoading}
            />
          </RadioGroup>

          {paymentMethod === "mpesa" ? (
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="254712345678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              disabled={paymentLoading}
              sx={{ mt: 1 }}
              helperText="Enter your M-Pesa registered phone number"
            />
          ) : (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={cardInfo.name}
                onChange={(e) =>
                  setCardInfo({ ...cardInfo, name: e.target.value })
                }
                disabled={paymentLoading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={cardInfo.number}
                onChange={(e) =>
                  setCardInfo({
                    ...cardInfo,
                    number: formatCardNumber(e.target.value),
                  })
                }
                disabled={paymentLoading}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 19 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={cardInfo.expiry}
                    onChange={(e) =>
                      setCardInfo({ ...cardInfo, expiry: e.target.value })
                    }
                    disabled={paymentLoading}
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    placeholder="123"
                    value={cardInfo.cvv}
                    onChange={(e) =>
                      setCardInfo({ ...cardInfo, cvv: e.target.value })
                    }
                    disabled={paymentLoading}
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handlePay}
            disabled={paymentLoading}
            sx={{
              mt: 3,
              backgroundColor: SECONDARY,
              "&:hover": { backgroundColor: "#2a9e9d" },
              position: "relative",
            }}
          >
            {paymentLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                Processing Payment...
              </>
            ) : (
              `Pay KES ${selectedTier.price.toLocaleString()}`
            )}
          </Button>

          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, textAlign: "center", color: "#666" }}
          >
            Your payment is secure and encrypted
          </Typography>
        </CardContent>
      </Card>

      {/* Payment Polling Modal */}
      {showPaymentModal && paymentData && (
        <PaymentPollingModal
          open={showPaymentModal}
          onClose={handlePaymentModalClose}
          onPaymentSuccess={handlePaymentModalSuccess}
          checkoutRequestId={paymentData.checkoutRequestId}
          phoneNumber={paymentData.phoneNumber}
        />
      )}
    </Box>
  );
}

const initiateMpesaPayment = async (phone, amount) => {
  try {
    const paymentPayload = {
      phone: phone,
      amount: amount,
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

async function processCard(cardInfo, tierId, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate API call to card processor
      const success = Math.random() > 0.15; // 85% success rate for demo
      if (success) {
        console.log(
          `Card payment processed for tier ${tierId}, Amount: KES ${amount}`
        );
        resolve({
          success: true,
          transactionId: "CD" + Date.now(),
          message: "Card payment processed successfully",
        });
      } else {
        reject(
          new Error(
            "Card payment failed. Please check your card details and try again."
          )
        );
      }
    }, 2500);
  });
}
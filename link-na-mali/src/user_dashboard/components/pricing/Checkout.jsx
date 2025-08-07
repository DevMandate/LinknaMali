import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTiers } from "../api/pricing";
import { useAppContext } from "../../context/AppContext";
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
  const { userData } = useAppContext();

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
    navigate('/user-dashboard/pricing');
  };

  const handlePaymentSuccess = () => {
    navigate('/user-dashboard/pricing');
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
          setPaymentData({
            checkoutRequestId: paymentResult.checkoutRequestId,
            merchantRequestId: paymentResult.merchantRequestId,
            phoneNumber: phone,
            tierId: selectedTier.id,
          });

          setShowPaymentModal(true);
        } else {
          setError(paymentResult.message || "Payment initiation failed");
        }
      } else {
        await processCard(cardInfo, selectedTier.id, selectedTier.price);
        await createSubscription(selectedTier.id, "card", selectedTier.price);
        setSuccess("Payment processed and subscription created successfully!");

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
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.slice(1);
    }
    return cleaned;
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const handlePaymentModalClose = (action) => {
    setShowPaymentModal(false);
    setPaymentData(null);

    if (action === "retry") {
      handlePay();
    }
  };

  const handlePaymentModalSuccess = async () => {
    try {
      if (paymentData?.tierId) {
        await createSubscription(paymentData.tierId, "mpesa", selectedTier.price);
      }
      
      setShowPaymentModal(false);
      setPaymentData(null);
      setSuccess("Payment completed and subscription created successfully!");

      setTimeout(() => {
        handlePaymentSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error creating subscription:", error);
      setError("Payment completed but subscription creation failed. Please contact support.");
    }
  };

  // Subscription creation function using AppContext userData
  const createSubscription = async (tierId, paymentMethod = "mpesa", amountPaid = 0) => {
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Get user_id from AppContext userData
      const userId = userData?.user_id;
      
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const subscriptionPayload = {
        user_id: userId,
        tier_id: tierId,
        start_date: startDate,
        end_date: endDate.toISOString(),
        status: "active",
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        listings_used: 0,
        auto_renew: false,
        payment_reference: `PAY_${Date.now()}`,
        promo_code_used: null,
        discount_applied: null
      };

      console.log("SUBSCRIPTION PAYLOAD: ", subscriptionPayload);

      const response = await fetch("https://api.linknamali.ke/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(subscriptionPayload),
      });

      console.log("Subscription Creation Response: ", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.response || `Subscription creation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Subscription created successfully:", data);
      return data;
    } catch (error) {
      console.error("Subscription creation error:", error);
      throw error;
    }
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

    if (data.ResponseCode === "0") {
      return {
        success: true,
        message: "Payment request sent to your phone. Please complete the payment.",
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    } else {
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

async function processCard(cardInfo, tierId, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() > 0.15;
      if (success) {
        console.log(`Card payment processed for tier ${tierId}, Amount: KES ${amount}`);
        resolve({
          success: true,
          transactionId: "CD" + Date.now(),
          message: "Card payment processed successfully",
        });
      } else {
        reject(new Error("Card payment failed. Please check your card details and try again."));
      }
    }, 2500);
  });
}

// Additional utility functions
export const getActiveSubscription = async () => {
  try {
    const response = await fetch("https://api.linknamali.ke/subscriptions/active", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active subscription: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching active subscription:", error);
    throw error;
  }
};

export const getUserSubscriptions = async () => {
  try {
    const response = await fetch("https://api.linknamali.ke/subscriptions/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user subscriptions: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    throw error;
  }
};

export const incrementListingUsage = async () => {
  try {
    const response = await fetch("https://api.linknamali.ke/subscriptions/increment-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to increment listing usage: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error incrementing listing usage:", error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch(`https://api.linknamali.ke/subscriptions/cancel/${subscriptionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};
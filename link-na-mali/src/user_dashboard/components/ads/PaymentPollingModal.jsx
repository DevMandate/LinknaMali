import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Box,
  Button,
  Alert
} from '@mui/material';
import { CheckCircle, Cancel, Phone } from '@mui/icons-material';

const PaymentPollingModal = ({ 
  open, 
  onClose, 
  onPaymentSuccess, 
  checkoutRequestId, 
  phoneNumber 
}) => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [message, setMessage] = useState('Payment request sent to your phone. Please complete the payment...');
  const [pollingCount, setPollingCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes timeout

  // Poll payment status
  const pollPaymentStatus = async () => {
    try {
      const response = await fetch('https://api.linknamali.ke/api/mpesa/stk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutRequestId: checkoutRequestId
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch status");

      const data = await response.json();

      console.log("Payment Poll Status Response: ", data)
      
      if (data.ResultCode === '0') {
        // Payment successful
        setPaymentStatus('success');
        setMessage('Payment completed successfully!');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      } else if (data.ResultCode === '1032') {
        // Payment cancelled by user
        setPaymentStatus('cancelled');
        setMessage('Payment was cancelled. Please try again.');
      } else if (data.ResultCode === '1037') {
        // Payment timeout
        setPaymentStatus('failed');
        setMessage('Payment request timed out. Please try again.');
      } else if (data.ResultCode === '1') {
        // Insufficient funds
        setPaymentStatus('failed');
        setMessage('Insufficient funds. Please check your M-Pesa balance and try again.');
      } else if (data.ResultCode) {
        // Other failure codes
        setPaymentStatus('failed');
        setMessage('Payment failed. Please try again.');
      }
      // If no ResultCode, payment is still pending
      
    } catch (error) {
      console.error('Error polling payment status:', error);
      if (pollingCount > 10) { // Stop polling after too many attempts
        setPaymentStatus('failed');
        setMessage('Unable to verify payment status. Please contact support.');
      }
    }
  };

  // Start polling when modal opens
  useEffect(() => {
    if (open && checkoutRequestId && paymentStatus === 'pending') {
      const pollInterval = setInterval(() => {
        pollPaymentStatus();
        setPollingCount(prev => prev + 1);
      }, 5000); // Poll every 5 seconds

      // Cleanup interval
      return () => clearInterval(pollInterval);
    }
  }, [open, checkoutRequestId, paymentStatus, pollingCount]);

  // Countdown timer
  useEffect(() => {
    if (open && paymentStatus === 'pending' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && paymentStatus === 'pending') {
      setPaymentStatus('failed');
      setMessage('Payment request timed out. Please try again.');
    }
  }, [open, timeRemaining, paymentStatus]);

  const handleRetry = () => {
    setPaymentStatus('pending');
    setMessage('Payment request sent to your phone. Please complete the payment...');
    setPollingCount(0);
    setTimeRemaining(120);
    // The parent component should handle retry logic
    onClose('retry');
  };

  const handleCancel = () => {
    onClose('cancel');
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle sx={{ color: 'green', fontSize: 60 }} />;
      case 'failed':
      case 'cancelled':
        return <Cancel sx={{ color: 'red', fontSize: 60 }} />;
      default:
        return <CircularProgress size={60} />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={paymentStatus !== 'pending' ? handleCancel : undefined}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={paymentStatus === 'pending'}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h6">
          {paymentStatus === 'pending' ? 'Processing Payment' : 
           paymentStatus === 'success' ? 'Payment Successful' : 
           'Payment Failed'}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
        <Box sx={{ mb: 3 }}>
          {getStatusIcon()}
        </Box>

        <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
          {message}
        </Alert>

        {paymentStatus === 'pending' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Phone sx={{ mr: 1 }} />
              <Typography variant="body2">
                Check your phone ({phoneNumber}) for M-Pesa prompt
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Time remaining: {formatTime(timeRemaining)}
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              Please do not close this window while payment is processing...
            </Typography>
          </>
        )}

        {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        )}

        {paymentStatus === 'success' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Proceeding to complete your booking...
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

// PropTypes validation
PaymentPollingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  checkoutRequestId: PropTypes.string.isRequired,
  merchantRequestId: PropTypes.string,
  phoneNumber: PropTypes.string.isRequired,
};

// Default props
PaymentPollingModal.defaultProps = {
  merchantRequestId: null,
};

export default PaymentPollingModal;
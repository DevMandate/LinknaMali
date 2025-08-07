import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaMoneyBillWave,
  FaExclamationTriangle 
} from 'react-icons/fa';

const RefundPollingModal = ({ 
  open, 
  onClose, 
  onRefundSuccess, 
  bookingId,
  bookingDetails 
}) => {
  const [refundStatus, setRefundStatus] = useState('pending');
  const [message, setMessage] = useState('Processing refund request...');
  const [pollingCount, setPollingCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes timeout
  const [refundData, setRefundData] = useState(null);

  // Poll refund status
  const pollRefundStatus = async () => {
    try {
      const response = await fetch(`https://api.linknamali.ke/api/mpesa/b2c/status/${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error("Failed to fetch refund status");

      const data = await response.json();
      console.log("Refund Poll Status Response: ", data);
      
      setRefundData(data);
      
      if (data.refund_status === 'confirmed') {
        // Refund successful
        setRefundStatus('success');
        setMessage('Refund has been processed successfully!');
        setTimeout(() => {
          onRefundSuccess(data);
        }, 2000);
      } else if (data.refund_status === 'failed') {
        // Refund failed
        setRefundStatus('failed');
        setMessage('Refund processing failed. Please try again or contact support.');
      } else if (data.refund_status === 'timeout') {
        // Refund timeout
        setRefundStatus('failed');
        setMessage('Refund processing timed out. Please try again.');
      } else if (data.refund_status === 'pending') {
        // Still pending
        setMessage('Refund is being processed. Please wait...');
      }
      
    } catch (error) {
      console.error('Error polling refund status:', error);
      if (pollingCount > 30) { // Stop polling after too many attempts
        setRefundStatus('failed');
        setMessage('Unable to verify refund status. Please contact support.');
      }
    }
  };

  // Start polling when modal opens
  useEffect(() => {
    if (open && bookingId && refundStatus === 'pending') {
      // Initial call
      pollRefundStatus();
      
      const pollInterval = setInterval(() => {
        pollRefundStatus();
        setPollingCount(prev => prev + 1);
      }, 10000); // Poll every 10 seconds

      // Cleanup interval
      return () => clearInterval(pollInterval);
    }
  }, [open, bookingId, refundStatus, pollingCount]);

  // Countdown timer
  useEffect(() => {
    if (open && refundStatus === 'pending' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && refundStatus === 'pending') {
      setRefundStatus('failed');
      setMessage('Refund processing timed out. Please try again.');
    }
  }, [open, timeRemaining, refundStatus]);

  const handleRetry = () => {
    setRefundStatus('pending');
    setMessage('Processing refund request...');
    setPollingCount(0);
    setTimeRemaining(300);
    setRefundData(null);
  };

  const handleClose = () => {
    onClose();
  };

  const getStatusIcon = () => {
    switch (refundStatus) {
      case 'success':
        return <FaCheckCircle className="text-green-500 text-6xl" />;
      case 'failed':
        return <FaTimesCircle className="text-red-500 text-6xl" />;
      default:
        return <FaClock className="text-blue-500 text-6xl animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (refundStatus) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'failed':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {refundStatus === 'pending' ? 'Processing Refund' : 
             refundStatus === 'success' ? 'Refund Successful' : 
             'Refund Failed'}
          </h2>
        </div>

        {/* Status Icon */}
        <div className="text-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Booking Details
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Booking ID:</strong> #{bookingId?.toString().slice(-8)}</p>
            {bookingDetails?.user_name && (
              <p><strong>Guest:</strong> {bookingDetails.user_name}</p>
            )}
            {refundData?.refund_amount && (
              <p><strong>Refund Amount:</strong> KSh {parseFloat(refundData.refund_amount).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className={`border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
          <div className="flex items-center">
            {refundStatus === 'pending' && <FaClock className="mr-2" />}
            {refundStatus === 'success' && <FaCheckCircle className="mr-2" />}
            {refundStatus === 'failed' && <FaExclamationTriangle className="mr-2" />}
            <span className="font-medium">{message}</span>
          </div>
        </div>

        {/* Pending Status Details */}
        {refundStatus === 'pending' && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Time remaining: {formatTime(timeRemaining)}
            </p>
            <p className="text-xs text-gray-500">
              Please do not close this window while refund is processing...
            </p>
            <div className="mt-2 text-xs text-gray-400">
              Checking status every 10 seconds...
            </div>
          </div>
        )}

        {/* Success Details */}
        {refundStatus === 'success' && refundData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-800 mb-2">Refund Details</h4>
            <div className="text-sm text-green-700 space-y-1">
              {refundData.refund_amount && (
                <p><strong>Amount:</strong> KSh {parseFloat(refundData.refund_amount).toLocaleString()}</p>
              )}
              {refundData.user_name && (
                <p><strong>Processed for:</strong> {refundData.user_name}</p>
              )}
              {refundData.updated_at && (
                <p><strong>Processed at:</strong> {new Date(refundData.updated_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          {refundStatus === 'failed' && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={handleClose}
            disabled={refundStatus === 'pending'}
            className={`px-4 py-2 rounded-lg transition ${
              refundStatus === 'pending' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {refundStatus === 'pending' ? 'Processing...' : 'Close'}
          </button>
        </div>

        {/* Additional Info for Success */}
        {refundStatus === 'success' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              The refund has been initiated and will reflect in the customer's account within 1-3 business days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundPollingModal;
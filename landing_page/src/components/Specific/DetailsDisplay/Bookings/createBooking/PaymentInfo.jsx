import {useEffect, useState} from "react";
import PropTypes from 'prop-types';
import {MenuItem } from "@mui/material";
import {useSearchEngine} from '../../../../../context/SearchEngine'
import CustomTextField from "../../../../Common/MUI_Text_Custom/customTextField";
import StandardButton from "../../../../Common/MUI_Button_Custom/standard";
import PaymentPollingModal from "./PaymentPollingModal";

function PaymentInformation({formData,setFormData,handleNextStep,initiateMpesaPayment}) {
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const [warning, setWarning] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "pay_later_date") {
            const checkInDate = new Date(formData.check_in_date);
            const selectedDate = new Date(value);
            const minDate = new Date(checkInDate);
            minDate.setDate(minDate.getDate() - 2); // 2 days before check-in
            if (selectedDate >= minDate) {
                setWarning(true);
                alert("Please select a date at least 2 days before check-in.");
                return;
            }
        }
             
        setFormData({ ...formData, [name]: value });
    };
       
    function handleNext(){
        setSearchEngine(true)
        handleNextStep();
    }

    const handlePayNow = async () => {
        if (formData.payment_method === "mpesa") {
            try {
                setSearchEngine(true);
                const paymentResult = await initiateMpesaPayment(formData);
                
                if (paymentResult.success) {
                    // Store payment data and show modal
                    setPaymentData({
                        checkoutRequestId: paymentResult.checkoutRequestId,
                        merchantRequestId: paymentResult.merchantRequestId,
                        phoneNumber: formData.mpesa_phone
                    });
                    
                    setShowPaymentModal(true);
                } else {
                    alert(paymentResult.message);
                }
            } catch (error) {
                alert("Payment failed. Please try again.", error);
            } finally {
                setSearchEngine(false);
            }
        } else {
            // For other payment methods (like card), proceed to next step
            handleNext();
        }
    };

    const handlePaymentModalClose = (action) => {
        setShowPaymentModal(false);
        if (action === 'retry') {
            // Retry payment
            handlePayNow();
        }
        // If action is 'cancel', close modal
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        handleNextStep(); // Proceed to next step after successful payment
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (formData.payment_option === "pay_now") {
            handlePayNow();
        } else {
            handleNext();
        }
    };
    
    useEffect(() => {
        setSearchEngine(false)
    }, [setSearchEngine]);

    // Determine button text based on payment option
    const getButtonText = () => {
        return formData.payment_option === "pay_now" ? "Pay" : "Next";
    };

    return(
        <form onSubmit={handleSubmit}>
            <CustomTextField
            label="Payment Option"
            name="payment_option"
            select
            value={formData.payment_option}
            onChange={handleChange}
            required
            margin="normal"
            >
            <MenuItem value="pay_now">Pay Now</MenuItem>
            {/* <MenuItem value="pay_later">Pay Later</MenuItem> */}
            {/* <MenuItem value="pay_at_property">Pay at Property</MenuItem>/ */}
            </CustomTextField>
            
            {formData.payment_option === "pay_later" && (
                <>
                {warning &&(<h2>Your Check in date is {formData.check_in_date}</h2>)}
                <CustomTextField
                    type="date"
                    name="pay_later_date"
                    value={formData.pay_later_date}
                    onChange={handleChange}
                    required
                    margin="normal"
                />
                </>
            )}
            
            <CustomTextField
            label="Payment Method"
            name="payment_method"
            select
            value={formData.payment_method}
            onChange={handleChange}
            required
            margin="normal"
            >
            {formData.payment_option !== "pay_at_property" && <MenuItem value="card">Card</MenuItem>}
            {formData.payment_option !== "pay_later" && <MenuItem value="mpesa">Mpesa</MenuItem>}
            {formData.payment_option === "pay_at_property" && <MenuItem value="cash">Cash</MenuItem>}
            </CustomTextField>
            
            {formData.payment_method === "mpesa" && (
                <CustomTextField
                    label="M-Pesa Phone Number"
                    name="mpesa_phone"
                    type="tel"
                    value={formData.mpesa_phone}
                    onChange={handleChange}
                    required
                    margin="normal"
                    placeholder="254712345678"
                />
            )}
            
            <StandardButton
            sx={{mt:2}}
            isloading={searchEngine}
            text={getButtonText()}/>

            <PaymentPollingModal
                open={showPaymentModal}
                onClose={handlePaymentModalClose}
                onPaymentSuccess={handlePaymentSuccess}
                checkoutRequestId={paymentData?.checkoutRequestId}
                merchantRequestId={paymentData?.merchantRequestId}
                phoneNumber={paymentData?.phoneNumber}
            />
      </form>
    );
}

// PropTypes validation
PaymentInformation.propTypes = {
    formData: PropTypes.shape({
        payment_option: PropTypes.string,
        payment_method: PropTypes.string,
        pay_later_date: PropTypes.string,
        check_in_date: PropTypes.string,
        mpesa_phone: PropTypes.string,
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    handleNextStep: PropTypes.func.isRequired,
    initiateMpesaPayment: PropTypes.func.isRequired,
    Property: PropTypes.object, 
};

// Default props
PaymentInformation.defaultProps = {
    Property: null,
};

export default PaymentInformation;
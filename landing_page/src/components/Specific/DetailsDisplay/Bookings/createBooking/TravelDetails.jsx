import React, {useEffect, useState} from "react";
import {MenuItem, Alert } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {useSearchEngine} from '../../../../../context/SearchEngine'
import CustomTextField from "../../../../Common/MUI_Text_Custom/customTextField";
import StandardButton from "../../../../Common/MUI_Button_Custom/standard";

function TravelDetails({formData, setFormData, handleNextStep, propertyId}) {
    const {searchEngine, setSearchEngine} = useSearchEngine();
    const [blockedDates, setBlockedDates] = useState([]);
    const [dateError, setDateError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch blocked dates when component mounts
    useEffect(() => {
        const fetchBlockedDates = async () => {
            if (!propertyId) return;
            
            setLoading(true);
            try {
                const response = await fetch(`https://api.linknamali.ke/bookings/blocked-dates/${propertyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBlockedDates(data.blocked_dates || []);
                } else {
                    console.error('Failed to fetch blocked dates');
                }
            } catch (error) {
                console.error('Error fetching blocked dates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlockedDates();
        setSearchEngine(false);
    }, [propertyId]);

    // Check if a date is blocked
    const isDateBlocked = (dateString) => {
        return blockedDates.includes(dateString);
    };

    // Generate array of dates between check-in and check-out
    const getDatesBetween = (startDate, endDate) => {
        const dates = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentDate < end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    // Validate date selection
    const validateDates = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return true;
        
        // Check if check-in date is blocked
        if (isDateBlocked(checkIn)) {
            setDateError('Check-in date is not available');
            return false;
        }
        
        // Check if check-out date is blocked
        if (isDateBlocked(checkOut)) {
            setDateError('Check-out date is not available');
            return false;
        }
        
        // Check if any dates between check-in and check-out are blocked
        const datesBetween = getDatesBetween(checkIn, checkOut);
        const blockedInRange = datesBetween.some(date => isDateBlocked(date));
        
        if (blockedInRange) {
            setDateError('Some dates in your selected range are not available');
            return false;
        }
        
        // Check if check-out is after check-in
        if (new Date(checkOut) <= new Date(checkIn)) {
            setDateError('Check-out date must be after check-in date');
            return false;
        }
        
        setDateError('');
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Validate dates when either check-in or check-out changes
        if (name === 'check_in_date' || name === 'check_out_date') {
            const newFormData = { ...formData, [name]: value };
            validateDates(newFormData.check_in_date, newFormData.check_out_date);
        }
    };

    // Handle date picker changes
    const handleDateChange = (name, value) => {
        const dateString = value ? value.format('YYYY-MM-DD') : '';
        setFormData({ ...formData, [name]: dateString });
        
        // Validate dates when either check-in or check-out changes
        if (name === 'check_in_date' || name === 'check_out_date') {
            const newFormData = { ...formData, [name]: dateString };
            validateDates(newFormData.check_in_date, newFormData.check_out_date);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get next available date after a blocked date
    const getNextAvailableDate = (startDate) => {
        let currentDate = new Date(startDate);
        let dateString = currentDate.toISOString().split('T')[0];
        
        while (isDateBlocked(dateString)) {
            currentDate.setDate(currentDate.getDate() + 1);
            dateString = currentDate.toISOString().split('T')[0];
        }
        
        return dateString;
    };

    // Function to disable blocked dates in DatePicker
    const shouldDisableDate = (date) => {
        const dateString = date.format('YYYY-MM-DD');
        return isDateBlocked(dateString);
    };

    function handleNext() {
        if (!validateDates(formData.check_in_date, formData.check_out_date)) {
            return;
        }
        setSearchEngine(true);
        handleNextStep();
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        handleNext();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <form onSubmit={handleSubmit}>
                {dateError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {dateError}
                    </Alert>
                )}
                
                <DatePicker
                    label="Check-in Date"
                    value={formData.check_in_date ? dayjs(formData.check_in_date) : null}
                    onChange={(value) => handleDateChange('check_in_date', value)}
                    shouldDisableDate={shouldDisableDate}
                    minDate={dayjs()}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            required: true,
                            margin: 'normal',
                            helperText: isDateBlocked(formData.check_in_date) 
                                ? "This date is not available" 
                                : "Select your check-in date",
                            error: isDateBlocked(formData.check_in_date)
                        }
                    }}
                />
                
                <DatePicker
                    label="Check-out Date"
                    value={formData.check_out_date ? dayjs(formData.check_out_date) : null}
                    onChange={(value) => handleDateChange('check_out_date', value)}
                    shouldDisableDate={shouldDisableDate}
                    minDate={formData.check_in_date ? dayjs(formData.check_in_date).add(1, 'day') : dayjs()}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            required: true,
                            margin: 'normal',
                            helperText: isDateBlocked(formData.check_out_date) 
                                ? "This date is not available" 
                                : "Select your check-out date",
                            error: isDateBlocked(formData.check_out_date)
                        }
                    }}
                />
                
                <CustomTextField
                    label="Purpose of Travel"
                    name="travel_purpose"
                    select
                    value={formData.travel_purpose}
                    onChange={handleChange}
                    required
                    margin="normal"
                >
                    <MenuItem value="leisure">Leisure</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                </CustomTextField>
                
                <CustomTextField
                    label="Number of Adults"
                    name="number_of_adults" 
                    value={formData.number_of_adults}
                    onChange={handleChange}
                    required
                    margin="normal"
                />
                
                <CustomTextField
                    label="Number of Children"
                    name="number_of_children" 
                    value={formData.number_of_children}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                
                <CustomTextField
                    label="Number of Guests"
                    name="number_of_guests"
                    value={formData.number_of_guests}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                
                <CustomTextField
                    label="Number of Rooms Needed"
                    name="number_of_rooms"  
                    value={formData.number_of_rooms}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                
                <StandardButton
                    sx={{mt:2}}
                    isloading={searchEngine || loading} 
                    text='Next'
                    disabled={!!dateError || loading}
                />
            </form>
        </LocalizationProvider>
    );
}

export default TravelDetails;
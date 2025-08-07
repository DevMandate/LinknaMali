import React, {useEffect} from "react";
import {Button } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import {useSearchEngine} from '../../../../../context/SearchEngine'
import CustomTextField from "../../../../Common/MUI_Text_Custom/customTextField";

function AdditionalInformation({formData,setFormData,handleSubmit,Property,editing}) {
    const {searchEngine,setSearchEngine} = useSearchEngine();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    useEffect(() => {
        setSearchEngine(false)
    }, []);
    return(
        <>
        <CustomTextField
        label="Special Requests"
        name="special_requests"
        value={formData.special_requests}
        onChange={handleChange}
        multiline
        rows={3}
        margin="normal"
        />
        <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2, backgroundColor: 'var(--merime-theme)' }}
        disabled={searchEngine}
        onClick={handleSubmit}
        >
        {searchEngine ? (
            <CircularProgress size={20} sx={{ mr: 1 }} /> 
        ) : (
            editing ? "Confirm Edit" : `Submit ${Property.property_type === 'lands' ? 'Reservation' : 'Booking'}` // Default text when not loading
        )}
        </Button>
    </>
    );
}

export default AdditionalInformation;

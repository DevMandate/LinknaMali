import React from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Button, Divider} from "@mui/material";
import { PhoneIphone} from '@mui/icons-material'
import {usePriorityDisplay} from '../../../context/PriorityDisplay'
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {OptionsPanel} from '../3_Rentals/children/options'
import Swiper from './carousel'
import {rental1, rental2, rental3, rental4, rental5, rental6} from '../../../assets/images'
function Render(){
    const location = useLocation();
    const images = [rental1, rental2, rental3, rental4, rental5, rental6];
    //Instead of specifying location.state?.service to make it receive data from all components;
    const detailsDisplay = location.state 
        ? Object.values(location.state)[0]
        : null;
    return (  
        detailsDisplay && (
            <Box className='p-[20px]'>
                <Typography variant="h5">{detailsDisplay.name} <LocationOnIcon color="var(--text)"/> {detailsDisplay.location} @ {detailsDisplay.price}</Typography>   
                <Box className='flex justify-between'>
                    <Swiper images={images}/>
                    <div className="p-[20px] flex flex-col gap-2" style={{minWidth: '400px'}}>
                        <OptionsPanel data={detailsDisplay}/>
                        <Box className='flex items-center'>
                            <div className="w-[50px] h-[50px] mr-5">
                                <img className="w-[100%] h-[100%] rounded-[50%]" style={{objectFit:'cover'}} src={detailsDisplay.ownerImage} />
                            </div>
                            <Typography>{detailsDisplay.owner}</Typography>
                            <Button
                                variant="contained"
                                color='secondary'
                                sx={{marginLeft: 2}}
                                endIcon={<PhoneIphone/>}
                            >Reach out</Button>
                        </Box>
                        <Divider />
                        {Object.entries(detailsDisplay).map(([key, value]) => (
                            key !== 'id'
                            && key !=='image'
                            && key !=='name'
                            && key !=='location'
                            && key !=='price'
                            && key !=='owner' 
                            && key !=='ownerImage' 
                            && key !=='likes'
                            &&(
                            <Typography key={key} variant="h6">
                                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                        )))}
                    </div>
                </Box>
            </Box>
        )
    ) 
}
function DetailsDisplay() {
    const {priorityDisplay} = usePriorityDisplay();
    return(
        <Box
            id='propertyDetails'
            className=''
            sx={{
                display: priorityDisplay === 'propertyDetails' ? 'block' : 'none',
                minHeight: "300px",
                padding: "20px",
            }}
        >
            <Render />
        </Box>

    );
}

export default DetailsDisplay;

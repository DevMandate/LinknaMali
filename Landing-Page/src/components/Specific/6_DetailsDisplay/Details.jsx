import React from "react";
import { Box, Typography, Button, Divider} from "@mui/material";
import { PhoneIphone} from '@mui/icons-material'
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {OptionsPanel} from '../../Common/Search/searchResults'
import Swiper from './carousel'

function Details({detailsDisplay, images}){
    return (  
        detailsDisplay && (
            <Box className='p-[20px]'>
                <Typography variant="h5" sx={{marginBottom: 2}}>{detailsDisplay.name} <LocationOnIcon color="var(--text)"/> {detailsDisplay.location} @ {detailsDisplay.price}</Typography>   
                <Box className='flex justify-between'
                    sx={{
                        '@media (max-width: 1210px)': {
                            flexDirection: 'column',
                        }
                    }}
                >
                    <Swiper images={images}/>
                    <Box className="p-[20px] flex flex-col gap-2" 
                        sx={{
                            minWidth: '400px',
                            '@media (max-width: 500px)': {
                                minWidth: 'unset',
                                width: 'auto',
                            }
                        }}>
                        <OptionsPanel data={detailsDisplay} iconSize={25} iconSpace={40}/>
                        <Box className='flex items-center'
                            sx={{
                                '@media (max-width: 500px)': {
                                    flexDirection: 'column',
                                    alignItems: 'normal',
                                    gap: 2,
                                }
                            }}
                        >
                            <Box className='flex items-center'>
                            <div className="w-[50px] h-[50px] mr-5">
                                <img className="w-[100%] h-[100%] rounded-[50%]" style={{objectFit:'cover'}} src={detailsDisplay.ownerImage} />
                            </div>
                            <Typography>{detailsDisplay.owner}</Typography></Box>
                            <Button
                                variant="contained"
                                color='secondary'
                                sx={{marginLeft: 2,
                                    '@media (max-width: 500px)': {
                                        marginLeft: 0,
                                    }
                                }}
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
                    </Box>
                </Box>
            </Box>
        )
    ) 
}

export default Details;

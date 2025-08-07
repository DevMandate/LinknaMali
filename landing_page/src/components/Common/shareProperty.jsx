import { useState } from "react";
import { Dialog, DialogTitle,DialogContent, DialogActions, Button } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";

const ShareButton = ({ data, size }) => {
    const [open, setOpen] = useState(false);
    const propertyUrl = `https://linknamali.ke/property/${data.property_type}/${data.id}`;
    const formattedAmenities = data.amenities
    ? data.amenities.split(',').map(item => `✅ ${item.trim()}`).join('\n')
    : "No amenities listed.";
    const shareText = `Check out this ${data.title} located in ${data.location} at ${data.town}\n\nAmenities:\n${formattedAmenities}`;


    // Function to share
    const handleShare = async (event) => {
        event.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: shareText,
                    url: propertyUrl
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            // Show fallback popup for unsupported devices
            setOpen(true);
        }
    };

    // Function to copy link
    const copyToClipboard = (event) => {
        event.stopPropagation();
        navigator.clipboard.writeText(propertyUrl);
        setOpen(false);
    };

    const handleClose = (event) => {
        event.stopPropagation();
        setOpen(false);
    };

    const handleWhatsappShare = (event) => {
        event.stopPropagation();
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + propertyUrl)}`, "_blank");
    }
    const handleFacebookShare = (event) => {
        event.stopPropagation();
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, "_blank");
    }

    return (
        <>
            <ShareIcon 
            onClick={(event) =>handleShare(event)} 
            style={{ cursor: "pointer", fontSize: size, color: "gray" }}
            />

            {/* Fallback share popup for desktop */}
            <Dialog open={open} onClose={(event) => handleClose(event)}>
                <DialogTitle>Share {data.title} located in {data.location}</DialogTitle>
                <DialogContent>
                    <img src={data?.images && data.images[0]} style={{width:'100%',height:'200px', objectFit:'cover', borderRadius:'5px'}}/>
                    {/* <p className="mt-2">{data.size} {data.property_type} for {data.purpose} in {data.location}, {data.description}</p> */}
                    <p className="mt-2">{data.description}</p>
                    
                </DialogContent>
                <DialogActions sx={{ display: "flex", justifyContent: "center", gap: 2, padding: 2 }}>
                    {/* WhatsApp Share */}
                    <WhatsAppIcon
                        onClick={(event) => handleWhatsappShare(event)}
                        sx={{fontSize: 40,color:'#25D366'}}
                     />
                    {/* Facebook Share */}
                    <FacebookIcon
                        onClick={(event) => handleFacebookShare(event)}
                        sx={{fontSize: 40,color:'#1877F2'}}
                    />
                    {/* Copy Link */}
                    <Button 
                        onClick={(event) => copyToClipboard(event)}
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                    >Copy Link
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ShareButton;

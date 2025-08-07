import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, Divider, Container } from "@mui/material";
import { EventAvailable, QuestionAnswer, LocationOn } from '@mui/icons-material';
import CircularProgress from '../../Common/circularProgress';
import { OptionsPanel } from '../0_Search/searchResults';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import { useLogin } from '../../../context/IsLoggedIn';
import { useTheme } from '../../../context/Theme';
import AlertDialogue from '../../Common/AlertDialogue';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Swiper from './carousel';
import AmenityList from "./AmenityList";
import axios from 'axios';
import SimilarListings from './SimilarListings';
import ReviewModal from '../6_Services/ReviewsModal';


function Details() {
  const navigate = useNavigate();
  const { isLoggedIn, userData, setPendingAction } = useLogin();
  const { alertClose, setMessage, setAlertOpen, setAlertClose } = useTheme();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [details, setdetails] = useState(null);
  const { id, property_type } = useParams();

  const [mediaMode, setMediaMode] = useState("images");

  function formatKey(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

    const excludedKeys = [
    'images', 'videos', 'id', 'title', 'location', 'price', 'purpose',
    'size', 'description', 'property_type', 'house_type',
    'amenities', 'likes', 'user_name', 'ownerImage', 'documents',
    'availability_status', 'deleted', 'is_approved', 'user_id',
    'created_at', 'updated_at', 'under_review', 'map_location',
    'location_text', 'reviews', 'display', 'verified_by_agent_id',
    'manually_verified', 'is_cover', 'cover_image', 'is_verified', 'project_id', 'cover_image', 'coverImageUri', 'cover_image_url'
  ];


  useEffect(() => {
    if (!id || !property_type) return;
    setPriorityDisplay('details');
  }, [id, property_type]);

  useEffect(() => {
    if (!id || !property_type) return;

    setdetails(null);

    axios
      .get(`https://api.linknamali.ke/property/getpropertybyid/${property_type}/${id}`)
      .then(response => {
        console.log("📦 Full property details from API:", response.data.data);
        console.log("🖼 Images:", response.data.data.images);
        console.log("🎥 Videos:", response.data.data.videos);
        setdetails(response.data.data);
      })
      .catch(error => {
        console.error("❌ Failed to fetch property details:", error.response?.data || error.message || error);
      });
  }, [id, property_type]);

  function handleBooking(property) {
    if (isLoggedIn && userData) {
      navigate(`/bookings/hub/${property.property_type}/${property.id}/create`);
    } else {
      setPendingAction(true);
      const pendingPath = `/bookings/hub/${property.property_type}/${property.id}/create`;
      sessionStorage.setItem("pendingPath", pendingPath);
      setMessage(`Log in to proceed with your booking for ${property.title}. If you don’t have an account, Sign Up to get started.`);
      setAlertOpen(true);
    }
  }

  useEffect(() => {
    if (alertClose) {
      navigate(`/login`);
      setAlertClose(false);
    }
  }, [alertClose]);

  useEffect(() => {
    if (details) {
      console.log("✅ DETAILS OBJECT DEBUG:", details);
    }
  }, [details]);

  function handleEnquiry(property) {
    navigate(`/enquiries/${property.property_type}/${property.id}`);
  }

  return details ? (
    <Container maxWidth='lg'
      sx={{
        display: priorityDisplay === 'details' ? 'block' : 'none',
        padding: id ? '10px' : 'unset'
      }}
    >
      <AlertDialogue requestExit={true} />

      {/* Back Button */}
      <Box
        sx={{
          paddingTop: '10px',
          paddingLeft: { xs: '8px', sm: '15px' },
          paddingBottom: '5px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Typography
          onClick={() => navigate("/", { state: { scrollTo: "rentals" } })}
          sx={{
            cursor: "pointer",
            fontWeight: 500,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            color: "var(--merime-theme)",
            width: "fit-content",
            marginLeft: { xs: '4px', sm: '6px' }
          }}
        >
          ← Back to Rentals
        </Typography>
      </Box>
      {(() => {
        const images = details.images?.map(img => ({ type: 'image', src: img })) || [];
        const videos = details.videos?.map(vid => ({ type: 'video', src: vid })) || [];

        const media = mediaMode === 'videos' ? videos : images;
        return media.length > 0 && (
          <Swiper media={media} />
        );
      })()}

      <div className='mt-2' style={{
        padding: '20px',
        boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
        borderRadius: '5px',
        backgroundColor: 'var(--hamburger)'
      }}>
        <Typography variant="h6" sx={{ marginBottom: 0 }}>
          {details.title} {details.town}, {details.locality} {details.location} county,
          priced at {details.Listed_price}
          <OptionsPanel
            data={details}
            iconSize={25}
            iconSpace={10}
            onOpenReview={(property) => {
              setSelectedProperty(property);
              setOpenReviewModal(true);
            }}
          />

        </Typography>

        {details.videos?.length > 0 && mediaMode !== 'videos' && (
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: '#35BEBD',
              color: '#fff',
              '&:hover': { backgroundColor: '#2fa9a9' }
            }}
            onClick={() => {
              setMediaMode('videos');
              setTimeout(() => {
                const swiperContainer = document.querySelector('.swiper');
                swiperContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const videos = swiperContainer?.querySelectorAll('video');
                if (videos.length > 0) {
                  videos[0].play();
                }
              }, 100);
            }}
          >
            🎥 Watch House Tour
          </Button>
        )}

        {mediaMode === 'videos' && (
          <Button
            variant="outlined"
            sx={{
              ml: 2,
              color: '#35BEBD',
              borderColor: '#35BEBD',
              '&:hover': {
                backgroundColor: '#e1f7f7',
                borderColor: '#2fa9a9'
              }
            }}
            onClick={() => setMediaMode('images')}
          >
            ⬅ Back to Photos
          </Button>
        )}

        <Box className="flex flex-col gap-2 mt-4"
          sx={{
            minWidth: '400px',
            '@media (max-width: 500px)': {
              minWidth: 'unset',
              width: 'auto',
            }
          }}>
          <Box
              className='flex items-center'
              sx={{
                width: '100%',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                rowGap: 1,
                columnGap: 1,
                '@media (max-width: 500px)': {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }
              }}
            >
              {/* LEFT: All the buttons */}
              <Box className='flex items-center' sx={{ flexWrap: 'wrap', gap: 1 }}>
                {details.purpose?.trim().toLowerCase() === 'short stay' && (
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: 'var(--merime-theme)' }}
                    endIcon={<EventAvailable />}
                    onClick={() => handleBooking(details)}
                  >
                    Book
                  </Button>
                )}

                <Button
                  variant="contained"
                  color='primary'
                  endIcon={<QuestionAnswer />}
                  onClick={() => handleEnquiry(details)}
                >
                  Make an Enquiry
                </Button>

                {details.map_location && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocationOn />}
                    onClick={() => window.open(details.map_location, "_blank", "noopener,noreferrer")}
                  >
                    Open Location
                  </Button>
                )}
              </Box>

              
             {(details.manually_verified === 1 || (details.verified_by_agent && typeof details.verified_by_agent === 'object')) && (
                <img
                  src="/verified-agent.png"
                  alt="Verified by agent"
                  title="Verified by listing agent"
                  style={{
                    width: 50,
                    height: 50,
                    marginLeft: 6,
                    objectFit: 'contain',
                    verticalAlign: 'middle'
                  }}
                />
              )}
            </Box>


          {details.location_text && (
            <>
              <Divider />
              <h2><strong>Landmark:</strong> {details.location_text}</h2>
            </>
          )}

          <Divider />
          <Typography>{details.description}</Typography>
          <AmenityList amenities={details.amenities} />

          {Object.entries(details).map(([key, value]) => {
            if (excludedKeys.includes(key) || key === "verified_by_agent") return null;
            if (
              value === null ||
              value === undefined ||
              value === '' ||
              value === 'Display 1' ||
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
            ) return null;

            


return (
              <Typography key={key}>
                <strong>{formatKey(key)}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Typography>
            );
          })}
        </Box>
      </div>

      {['rent', 'sale'].includes(details.purpose?.trim().toLowerCase()) && (
      <Box
        sx={{
          backgroundColor: "#fff9db",
          color: "#3c2f00",
          border: "1px solid #ffe8a1",
          borderRadius: 2,
          padding: 2.5,
          marginTop: 4,
          marginBottom: 4,
          fontSize: '15px',
          lineHeight: 1.8,
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Typography sx={{ fontWeight: 'bold', fontSize: '16px', mb: 1 }}>
          ⚠️ Safety Tips:
        </Typography>
        <Typography>
          <strong>1.</strong> Do not make any upfront payments including inspection or rent fees, before seeing the property or meeting the agent in person.
          <br />
          <strong>2.</strong> Agents listed do not represent Linknamali/Merime Development directly, and the platform does not authorize or mandate any upfront charges.
        </Typography>
      </Box>
      )
    }
      <SimilarListings propertyType={property_type} propertyId={id} />

      {openReviewModal && selectedProperty && (
              <ReviewModal
                open={openReviewModal}
                onClose={() => setOpenReviewModal(false)}
                propertyId={selectedProperty?.id}
                propertyType={selectedProperty?.property_type}
              />
            )}

    </Container>
  ) : (
    <CircularProgress />
  );
}

export default Details;

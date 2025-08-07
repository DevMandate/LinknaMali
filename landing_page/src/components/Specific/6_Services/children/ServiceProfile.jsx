import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProfileGrid from './ProfileGrid';
import { Container, Typography } from '@mui/material';
import Header from '../../../Layout/Header/header';
// import Footer from '../../../Layout/Footer/footer';

const ServiceProfile = () => {
  const { serviceName } = useParams(); // E.g. "Movers"
  const location = useLocation();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('https://api.linknamali.ke/allserviceproviders', {
          credentials: 'include'  // Ensure cookies/session data is sent
        });

        if (res.status === 401) {
          console.warn("Unauthorized. Redirecting to login...");
          window.location.href = '/login';
          return;
        }

        const data = await res.json();

        const filtered = data.filter(profile =>
          profile.category.toLowerCase() === serviceName.toLowerCase()
        );

        setProfiles(filtered);
      } catch (err) {
        console.error('Failed to fetch provider profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [serviceName]);

  useEffect(() => {
    if (location.state?.from) {
      const target = document.querySelector(location.state.from);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [location.state]);

  return (
    <div>
      {/* <Header /> */}
      <Container id="services" sx={{ paddingTop: 4 }}>

        {/* ✅ Final Back Button Styled Like Search Results Page */}
        <Typography
          onClick={() => navigate("/", { state: { scrollTo: "service providers" } })}
          sx={{
            cursor: "pointer",
            mb: 2,
            fontSize: "15px",
            fontWeight: 400,
            color: "#3f3f46",
            display: "inline-block",
            "&:hover": {
              textDecoration: "underline"
            }
          }}
        >
          ← Back to Service Providers
        </Typography>

        <Typography className="service-title">
          {serviceName} Profiles
        </Typography>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : profiles.length > 0 ? (
          <ProfileGrid profiles={profiles} />
        ) : (
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            No profiles available for this service.
          </Typography>
        )}
      </Container>
      {/* <Footer /> */}
    </div>
  );
};

export default ServiceProfile;
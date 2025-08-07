import React, { useEffect } from 'react';
import Hero from './components/Specific/1_Hero/hero';
import LandingPageRoutes from './Routes/landingPageRoutes';
import Footer from './components/Layout/Footer/footer';
import AdminNav from './components/Layout/AdminNav/admin';
import Header from './components/Layout/Header/header';
import './assets/styles/styles.css';
import './assets/styles/theme.css';
import './assets/styles/animation.css';
import { usePriorityDisplay } from './context/PriorityDisplay';
import { useLogin } from "./context/IsLoggedIn";
import { useMediaQuery } from "@mui/material";
import ScrollToTop from './components/Common/ScrollToTop';
import { isTokenExpired, logoutUser } from './utils/authHelpers';
import { useLocation } from 'react-router-dom';

function App() {
  const { drawerOpen, setDrawerOpen } = usePriorityDisplay();
  const { isLoggedIn } = useLogin();
  const isMobile = useMediaQuery("(max-width:1260px)");
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        logoutUser();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isHomePage = location.pathname === "/";

  return (
    <>
      {isHomePage ? (
        <>
          <Hero />
        </>
      ) : (
        <>
          <Header />
          <div style={{ height: '100px' }} />
        </>
      )}

      <AdminNav drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

      <div
        style={{
          marginLeft: isMobile ? 0 : drawerOpen ? 300 : 0,
          transition: 'margin 0.3s ease',
          height: isLoggedIn ? 'calc(100vh - 100px)' : 'auto',
          overflowY: isLoggedIn ? 'scroll' : 'visible',
          paddingBottom: '120px',
        }}
      >
        <ScrollToTop />
        <LandingPageRoutes />
        <Footer />
      </div>
    </>
  );
}

export default App;

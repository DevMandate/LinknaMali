import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogin } from "../context/IsLoggedIn";
import { usePriorityDisplay } from "../context/PriorityDisplay";
import Search from "../components/Specific/0_Search/Standard/search";
import Property from "../components/Specific/2_Property/property";
import WhyUs from "../components/Specific/3_WhyUs/whyus";
import Rentals from "../components/Specific/4_Rentals/property";
import Services from "../components/Specific/6_Services/services";
import GetStarted from "../components/Specific/7_GetStarted/getstarted";
import MyBookings from "../components/Specific/DetailsDisplay/Bookings/MyBookings/main";
import BlogManager from "../components/Admin/Blogs/blogManager";
import PolicyCenter from "../components/Admin/Policy Center/main";

function Main() {
  const {
    isLoggedIn,
    pendingAction,
    setPendingAction,
    actionSuccess,
    setActionSuccess,
  } = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();

  function pendingActionHandler() {
    if (pendingAction) {
      const pendingPath = sessionStorage.getItem("pendingPath") || null;
      setPendingAction(false);
      setActionSuccess(true);
      navigate(pendingPath);
    }
  }

  // ✅ Extended scroll logic
  useEffect(() => {
    if (location.state?.scrollTo) {
      const scrollTarget = location.state.scrollTo;

      if (
        scrollTarget === "service providers" ||
        scrollTarget === "search" ||
        scrollTarget === "properties" || 
        scrollTarget === "rentals"
      ) {
        setPriorityDisplay(scrollTarget);
      }

      const timer = setTimeout(() => {
        const target = document.getElementById(scrollTarget);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [location.state, setPriorityDisplay]);

  useEffect(() => {
    if (actionSuccess) {
      setActionSuccess(false);
      sessionStorage.removeItem("pendingPath");
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (isLoggedIn) {
      pendingActionHandler();
    }
  }, [isLoggedIn]);

  const NavOptions = [
    "properties",
    "search",
    "my-bookings",
    "rentals",
    "service providers",
    "blog-manager",
    "policy-center",
    "landing-page-editor",
  ];

  function handleHome() {
    if (!NavOptions.includes(priorityDisplay)) {
      setPriorityDisplay(null);
    }
  }

  useEffect(() => {
    if (location.state?.scrollTo) return;

    if (location.pathname === "/") {
      if (isLoggedIn) handleHome();
      if (!isLoggedIn) setPriorityDisplay(null);
    }
  }, [location.pathname, isLoggedIn]);

  return (
    <>
      <Search />
      <Rentals />
      <WhyUs />
      <Property />
      <Services />
      <GetStarted />
      <MyBookings />
      <BlogManager />
      <PolicyCenter />
    </>
  );
}

export default Main;

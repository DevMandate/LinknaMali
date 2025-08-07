import React from "react";
import { Routes, Route } from "react-router-dom";
import Main from '../Pages/main'
import LoginPage from '../components/Auth/Login'
import SignUpPage from '../components/Auth/SignUp/Signup'
import AboutUsPage from '../Pages/AboutUsPage'
import Details from '../components/Specific/DetailsDisplay/Details'
import CreateBooking from '../components/Specific/DetailsDisplay/Bookings/createBooking/main'
import DetailsBooking from '../components/Specific/DetailsDisplay/Bookings/detailsBooking'
import CancelBooking from '../components/Specific/DetailsDisplay/Bookings/cancelBooking'
import DetailsDisplay from '../Pages/DetailsDisplay'
import SettingsPage from '../components/Specific/settings/settings'
import Policy from '../components/Specific/Policy/main'
import PasswordReset from "../components/Auth/PasswordReset";
import GoogleCallback from '../components/Auth/Google/GoogleCallback';
import AdminSelect from "../components/Auth/AdminSelect";
import Engine from '../components/Specific/0_Search/engine'
import Enquiries from '../components/Specific/DetailsDisplay/Enquiries'
import StoryZaMitaa from "../components/Specific/DetailsDisplay/Blogs/StoryZaMitaa";
import InfoCenter from "../components/Specific/DetailsDisplay/Blogs/InfoCenter";
import BlogReader from "../components/Specific/DetailsDisplay/Blogs/BlogReader";
import ServiceProfile from "../components/Specific/6_Services/children/ServiceProfile";
import ServiceProviderEnquiry from "../components/Specific/6_Services/children/ServiceProviderEnquiry";
import ServiceBookingPage from "../Pages/serviceBookings/ServiceBookingPage";
import PricingPlans from "../Pages/Pricing/PricingPlans";
import CheckoutPage from "../Pages/Pricing/Checkout";
import ServiceProviderDetail from '../Pages/ServiceProviderDetail';
import CompanyInviteHandler from "./CompanyInviteHandler";
import ProjectsPage from '../Pages/ProjectsPage';
import ProjectDetail from '../Pages/ProjectDetail';
import AgentProperties from "../Pages/AgentProperties";




function LandingPageRoutes() {
  return (
    <Routes>
      <Route path="/company-invite-login" element={<CompanyInviteHandler />} />
      <Route path="/" element={<Main />} />

      {/**Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-select/:account/:name" element={<AdminSelect />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/**Google Callback */}
      <Route path="/google-callback" element={<GoogleCallback />} />

      <Route path="/about us" element={<AboutUsPage />} />
      <Route path="/policies" element={<Policy />} />
      <Route path="/settings" element={<SettingsPage />} />
      {/**Search Engine */}
      <Route path="/search" element={<Engine />} />

      {/**Hoe */}
      <Route path="hub/:type/:name/*" element={<DetailsDisplay />} />
      <Route path="/hub/services/:serviceName" element={<ServiceProfile />} />

      {/**Bookings */}
      <Route path="/bookings/:id" element={<DetailsBooking />} />
      <Route path="/bookings/hub/:property_type/:id/:action" element={<CreateBooking />} />
      <Route path="/bookings/cancel/:id" element={<CancelBooking />} />
      <Route path="/createbooking/:property_type/:id" element={<CreateBooking />} />

      {/* Service booking */}
      <Route path="/service-bookings/:profileId/create" element={<ServiceBookingPage />} />



      {/**Enquiries */}
      <Route path="/enquiries/:property_type/:id" element={<Enquiries />} />
      <Route path="/service-enquiries/:service_id" element={<ServiceProviderEnquiry />} />

      {/**Blogs */}
      <Route path="/blogs/story za mitaa" element={<StoryZaMitaa />} />
      <Route path="/blogs/property info and opportunities" element={<InfoCenter />} />
      <Route path="/blogs/read/:id" element={<BlogReader />} />

      {/**Property */}
      <Route path="/property/:property_type/:id" element={<Details />} />

      {/**Password reset */}
      <Route path="/reset/:reset_uuid/:user_id" element={<PasswordReset />} />

      {/* Pricing */}
      <Route path="/pricing" element={<PricingPlans />} />
      <Route path="/pricing/checkout/:tierId" element={<CheckoutPage />} />
      <Route path="/service-providers/view/:id" element={<ServiceProviderDetail />} />

      {/* Projects page */}
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />

      {/* Agent Properties Page (by user_name) */}
      <Route path="/agent-properties/:user_name" element={<AgentProperties />} />




    </Routes>
  );
}

export default LandingPageRoutes;

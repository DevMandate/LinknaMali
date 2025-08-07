import React from "react";
import { Routes, Route } from "react-router-dom";

import CompanyInviteHandler from "./routes/CompanyInviteHandler";
import Login from "./user_dashboard/components/login";
import Signup from "./user_dashboard/components/register";
import Dashboard from "./user_dashboard/pages/dashboard";
import PropertyManagement from "./user_dashboard/components/property";
import LeadManagement from "./user_dashboard/components/lead";
import ReportsAnalytics from "./user_dashboard/components/analytics";
import Support from "./user_dashboard/components/support";
import Settings from "./user_dashboard/components/settings";
import Logout from "./user_dashboard/components/logout";
import PropertyListing from "./user_dashboard/pages/properties";
import AdsCenter from "./user_dashboard/components/ads/AdsCenter";
import CalenderSync from "./user_dashboard/components/calender/CalenderSync";
import PricingPlans from "./user_dashboard/components/pricing/PricingPlans";
import CheckoutPage from "./user_dashboard/components/pricing/Checkout";
import SalesMarketing from "./user_dashboard/components/salesmarketing/SalesMarketing";
import Wallet from "./user_dashboard/components/wallet/Wallet";
import Bookings from "./user_dashboard/components/bookings";
import { Inquiries } from "./user_dashboard/components/inquiries";
import VacantListings from "./user_dashboard/components/vacant";
import SoldListings from "./user_dashboard/components/sold";
import RentedListings from "./user_dashboard/components/rented";
import ApartmentForm from "./user_dashboard/components/apartments/ApartmentForm";
import HouseForm from "./user_dashboard/components/house/HouseForm";
import LandForm from "./user_dashboard/components/land/LandForm";
import CommercialForm from "./user_dashboard/components/commercials/CommercialForm";

import AdminLayout from "./admin_dashboard/AdminLayout";
import AdminDashboard from "./admin_dashboard/pages/AdminDashboard";
import AdminPropertyManagement from "./admin_dashboard/pages/AdminPropertyManagement";
import UserManagement from "./admin_dashboard/pages/UserManagement";
import AdminSettings from "./admin_dashboard/pages/AdminSettings";
import AdminSupport from "./admin_dashboard/pages/AdminSupport";
import AdminAdsCenter from "./admin_dashboard/pages/AdminAdsCenter";
import FinancialAnalytics from "./admin_dashboard/pages/FinancialAnalytics";
import OwnerPayouts from "./admin_dashboard/pages/OwnerPayouts";
import AdminNewListings from "./admin_dashboard/pages/AdminNewListings";
import AdminNewBookings from "./admin_dashboard/pages/AdminNewBookings";
import AdminAllProperties from "./admin_dashboard/pages/AdminAllProperties";


import ServiceProvidersDashboard from "./serviceProviders";

const AppRoutes = () => (
  <Routes>
    {/* All user-dashboard sub-routes live under /user-dashboard */}
    <Route path="/user-dashboard" element={<Dashboard />}>
      {/* Invite handler must appear here */}
      <Route path="company-invite-login" element={<CompanyInviteHandler />} />

      {/* Core dashboard sections */}
      <Route path="property-management" element={<PropertyManagement />} />
      <Route path="lead-management" element={<LeadManagement />} />
      <Route path="reports" element={<ReportsAnalytics />} />
      <Route path="support" element={<Support />} />
      <Route path="settings" element={<Settings />} />
      <Route path="logout" element={<Logout />} />
      <Route path="sales-marketing" element={<SalesMarketing />} />
      <Route path="wallet" element={<Wallet />} />
      <Route path="ads-center" element={<AdsCenter />} />
      <Route path="calendar-sync" element={<CalenderSync />} />
      <Route path="pricing" element={<PricingPlans />} />
      <Route path="pricing/checkout/:tierId" element={<CheckoutPage />} />

      {/* Listing & booking/inquiry views */}
      <Route path="bookings" element={<Bookings />} />
      <Route path="inquiries" element={<Inquiries />} />
      <Route path="vacant" element={<VacantListings />} />
      <Route path="sold" element={<SoldListings />} />
      <Route path="rented" element={<RentedListings />} />

      {/* Property forms */}
      <Route
        path="components/apartments/ApartmentForm/:id"
        element={<ApartmentForm />}
      />
      <Route path="components/house/HouseForm/:id" element={<HouseForm />} />
      <Route path="components/land/LandForm/:id" element={<LandForm />} />
      <Route
        path="components/commercials/CommercialForm/:id"
        element={<CommercialForm />}
      />
    </Route>

    {/* Authentication */}
    <Route path="/user-dashboard/login" element={<Login />} />
    <Route path="/user-dashboard/signup" element={<Signup />} />
    <Route path="/user-dashboard/properties" element={<PropertyListing />} />

    {/* Admin panel */}
    <Route path="/admin-dashboard" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route
        path="AdminPropertyManagement"
        element={<AdminPropertyManagement />}
      />
      <Route path="UserManagement" element={<UserManagement />} />
      <Route path="AdminSettings" element={<AdminSettings />} />
      <Route path="AdminSupport" element={<AdminSupport />} />
      <Route path="AdminAdsCenter" element={<AdminAdsCenter />} />
      <Route path="FinancialAnalytics" element={<FinancialAnalytics />} />
      <Route path="Payouts" element={<OwnerPayouts />} />
      <Route path="AdminNewListings" element={<AdminNewListings />} />
      <Route path="AdminNewBookings" element={<AdminNewBookings />} />
      <Route path="AdminAllProperties" element={<AdminAllProperties />} />

    </Route>

    {/* Service Providers */}
    <Route
      path="/service-providers/*"
      element={<ServiceProvidersDashboard />}
    />
  </Routes>
);

export default AppRoutes;

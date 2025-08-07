// src/serviceProviders/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

// Operations pages
import Orders from './components/operations/orders/Orders';
import Calendar from './components/operations/calendar/Calendar';
import Messages from './components/operations/messages/Messages';
import Bookings from './components/operations/bookings/Bookings';

// Other pages
import Payments from './components/Payments';
import Analytics from './components/Analytics';
import CheckoutPage from './components/PricingCheckout/Checkout';
import Settings from './components/Settings';

import { AppProvider } from './context/ServiceProviderAppContext';

const ServiceProvidersDashboard = () => (
  <AppProvider>
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Core */}
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        {/* Operations */}
        <Route path="orders" element={<Orders />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="messages" element={<Messages />} />
        <Route path="bookings" element={<Bookings />} />

        {/* Finance & Analytics */}
        <Route path="payments" element={<Payments />} />
        <Route path="analytics" element={<Analytics />} />

        {/* Plan Pricing Checkout with tier ID parameter */}
        <Route path="pricing/checkout/:tierId" element={<CheckoutPage />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />

        {/* Catch-all: redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </AppProvider>
);

export default ServiceProvidersDashboard;

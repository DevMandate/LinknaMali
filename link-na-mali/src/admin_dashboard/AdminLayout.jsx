// admin_dashboard/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminAppProvider } from './context/AdminAppContext';

const AdminLayout = () => {
  return (
    <AdminAppProvider>
      <Outlet />
    </AdminAppProvider>
  );
};

export default AdminLayout;

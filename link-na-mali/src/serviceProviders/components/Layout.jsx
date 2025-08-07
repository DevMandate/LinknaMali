import React, { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Toggle function to open/close the sidebar.
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Close the sidebar if a click is detected outside of it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Header */}
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        {/* Sidebar remains fixed */}
        <div ref={sidebarRef}>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
        {/* Main content with top padding for header and left margin when sidebar is open */}
        <main className={`flex-1 bg-gray-100 p-4 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-56" : "ml-0"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

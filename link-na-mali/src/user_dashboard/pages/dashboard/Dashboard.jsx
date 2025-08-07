import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { FaSpinner } from "react-icons/fa";

const quickSections = [
  { label: "Bookings", key: "bookings", icon: "faClipboard", path: "bookings" },
  {
    label: "Inquiries",
    key: "inquiries",
    icon: "faQuestionCircle",
    path: "inquiries",
  },
  {
    label: "Vacant Listings",
    key: "vacantListings",
    icon: "faBuilding",
    path: "vacant",
  },
  {
    label: "Sold Listings",
    key: "soldListings",
    icon: "faDollarSign",
    path: "sold",
  },
  {
    label: "Rented Listings",
    key: "rentedListings",
    icon: "faHome",
    path: "rented",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = useCallback((e) => {
    if (e) e.stopPropagation();
    setSidebarOpen((prev) => !prev);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("https://api.linknamali.ke/auth/cookie", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "https://linknamali.ke";
        return;
      }

      if (!res.ok) throw new Error("Failed to authenticate");

      const data = await res.json();

      if (data?.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data) {
        setUserData(data);
      } else {
        window.location.href = "https://linknamali.ke";
      }
    } catch (err) {
      console.error("Authentication error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation");
    const isReload = navEntries.length
      ? navEntries[0].type === "reload"
      : performance.navigation.type === 1;

    if (isReload) {
      const lastPath = localStorage.getItem("lastDashboardPath");
      if (lastPath && lastPath !== "/user-dashboard") {
        navigate(lastPath, { replace: true });
      }
    }
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/user-dashboard/")) {
      localStorage.setItem("lastDashboardPath", location.pathname);
    }
  }, [location.pathname]);

  const primaryColor = "#29327E";
  const spinnerColor = "#29327E";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-lg font-medium text-gray-700">
          Loading, please wait...
        </p>
        <FaSpinner
          style={{ color: spinnerColor }}
          className="text-5xl animate-spin"
        />
      </div>
    );
  }

  const isDefaultDashboard = location.pathname === "/user-dashboard";

  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <Sidebar toggleSidebar={toggleSidebar} isOpen={isSidebarOpen} />
      <div
        className={`flex-grow transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0" : "lg:ml-64"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} userData={userData} />
        <main className="p-4 md:p-6 mt-16">
          {isDefaultDashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {quickSections.map((section) => (
                <div
                  key={section.key}
                  onClick={() => {
                    const path = `/user-dashboard/${section.path}`;
                    localStorage.setItem("lastDashboardPath", path);
                    navigate(path);
                  }}
                  className="cursor-pointer shadow-lg rounded-lg p-6 flex flex-col items-center space-y-4 transform hover:scale-105 transition duration-200"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="text-4xl text-white">
                    <i className={`fas ${section.icon}`} aria-hidden="true"></i>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {section.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isDefaultDashboard && (
            <div className="mt-4">
              <span
                onClick={() => navigate("/user-dashboard")}
                className="mb-4 cursor-pointer hover:underline"
                style={{ color: primaryColor }}
              >
                Back to Dashboard
              </span>
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

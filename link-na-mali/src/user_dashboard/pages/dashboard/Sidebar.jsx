import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faWarehouse,
  faUsers,
  faBullhorn,
  faChartBar,
  faWallet,
  faChartLine,
  faQuestionCircle,
  faCog,
  faTags,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  {
    label: "Dashboard",
    icon: faTachometerAlt,
    link: "/user-dashboard",
    section: null,
  },
  {
    label: "Listing Management",
    icon: faWarehouse,
    link: "/user-dashboard/property-management",
    section: "propertyManagement",
  },
  {
    label: "Lead Management",
    icon: faUsers,
    link: "/user-dashboard/lead-management",
    section: "leadManagement",
  },
  {
    label: "Calendar Sync",
    icon: faCalendarAlt,
    link: "/user-dashboard/calendar-sync",
    section: "calendarSync",
  },
  {
    label: "Ads Center",
    icon: faBullhorn,
    link: "/user-dashboard/ads-center",
    section: "adsCenter",
  },
  {
    label: "Sales & Marketing",
    icon: faChartBar,
    link: "/user-dashboard/sales-marketing",
    section: "salesMarketing",
  },
  {
    label: "Pricing",
    icon: faTags,
    link: "/user-dashboard/pricing",
    section: "pricing",
  },
  {
    label: "Wallet",
    icon: faWallet,
    link: "/user-dashboard/wallet",
    section: "wallet",
  },
  {
    label: "Reports & Analytics",
    icon: faChartLine,
    link: "/user-dashboard/reports",
    section: "reports",
  },
  {
    label: "Support",
    icon: faQuestionCircle,
    link: "/user-dashboard/support",
    section: "support",
  },
  {
    label: "Settings",
    icon: faCog,
    link: "/user-dashboard/settings",
    section: "settings",
  },
];

const Sidebar = ({ isOpen, setActiveSection, toggleSidebar }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);

  const handleLinkClick = (link, section) => {
    setActiveLink(link);
    setActiveSection(section);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        !e.target.closest(".sidebar-container") &&
        window.innerWidth < 1024
      ) {
        toggleSidebar();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, toggleSidebar]);

  // Define the exact sidebar background color
  const sidebarBgColor = "#29327E";

  return (
    <div
      className={`sidebar-container fixed top-16 left-0 z-50 transform w-56 shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      style={{
        height: "calc(100vh - 4rem)",
        backgroundColor: sidebarBgColor,
      }}
    >
      <nav className="overflow-y-auto h-full px-2 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.link}
                className={`flex items-center space-x-2 p-2 rounded-md text-white ${
                  activeLink === item.link ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
                onClick={() => handleLinkClick(item.link, item.section)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

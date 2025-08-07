import React, { useState } from "react";
import PersonalDetails from "./PersonalDetails";
import CustomisationPreferences from "./CustomisationPreferences";
import SecuritySettings from "./SecuritySettings";
import PaymentMethods from "./PaymentMethods";
import Privacy from "./Privacy";
import CreateCompany from "./CreateCompany";

// New: Dashboard navigation styling
const sidebarStyle = {
  width: "200px",
  backgroundColor: "#f4f4f4",
  padding: "20px",
  borderRight: "1px solid #ddd",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const contentStyle = {
  flex: 1,
  padding: "20px",
};

const containerStyle = {
  display: "flex",
  minHeight: "100vh",
};

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("Personal Details");

  const sections = [
    "Personal Details",
    "Customisation Preferences",
    "Security Settings",
    "Payment Methods",
    "Privacy Settings",
    "Create Company",
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "Personal Details":
        return <PersonalDetails />;
      case "Customisation Preferences":
        return <CustomisationPreferences />;
      case "Security Settings":
        return <SecuritySettings />;
      case "Payment Methods":
        return <PaymentMethods />;
      case "Privacy Settings":
        return <Privacy />;
      case "Create Company":
        return <CreateCompany />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          /* Stack container children vertically */
          div[style*="min-height: 100vh"] {
            flex-direction: column !important;
          }
          /* Make sidebar full width, adjust border, and ensure it comes on top */
          div[style*="border-right: 1px solid #ddd"] {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #ddd !important;
            order: -1 !important;
          }
          /* Make content full width */
          div[style*="flex: 1"][style*="padding: 20px"] {
            width: 100% !important;
          }
        }
      `}</style>
      <div style={containerStyle}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
          <ul className="space-y-4">
            {sections.map((section) => (
              <li
                key={section}
                onClick={() => setActiveSection(section)}
                className={`cursor-pointer p-2 rounded-md ${
                  activeSection === section
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {section}
              </li>
            ))}
          </ul>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Manage Your LinknaMali.ke Experience!
          </h1>
          {renderSection()}
        </div>
      </div>
    </>
  );
};

export default SettingsPage;

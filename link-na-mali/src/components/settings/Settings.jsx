import React, { useState } from "react";
import PersonalDetails from "./PersonalDetails";
import CustomisationPreferences from "./CustomisationPreferences";
import SecuritySettings from "./SecuritySettings";
import PaymentMethods from "./PaymentMethods";
import Privacy from "./Privacy";
// import EmailPreferences from "./EmailPreferences";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("Personal Details");

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
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-6 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-1/4 w-full bg-white rounded-lg shadow-md p-4 mb-6 lg:mb-0 lg:mr-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
          <ul className="space-y-4">
            {["Personal Details", "Customisation Preferences", "Security Settings", "Payment Methods", "Privacy Settings"].map(
              (section) => (
                <li
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`cursor-pointer p-2 rounded-md ${
                    activeSection === section ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {section}
                </li>
              )
            )}
          </ul>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Manage Your LinknaMali.com Experience</h1>
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
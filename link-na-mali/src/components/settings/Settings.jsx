import React, { useState } from "react";

const SettingsPage = () => {
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    displayName: "",
    email: "",
    phone: "",
    dob: "",
    nationality: "",
    gender: "",
    address: "",
    passportDetails: "",
  });

  const [customisationPreferences, setCustomisationPreferences] = useState({
    currency: "USD",
    language: "English",
  });

  const [securitySettings, setSecuritySettings] = useState({
    password: "",
    twoFactor: false,
    activeSessions: 0,
  });

  const [paymentMethods, setPaymentMethods] = useState({
    method: "card",
  });

  const [privacySettings, setPrivacySettings] = useState({
    manage: false,
  });

  const [emailPreferences, setEmailPreferences] = useState({
    email: "user@example.com",
    manage: false,
  });

  const [activeSection, setActiveSection] = useState("personalDetails");

  return (
    <div className="settings-page container mx-auto p-4 flex">
      {/* Sidebar Menu */}
      <div className="menu w-1/4 p-4 bg-gray-100 rounded-lg shadow-md mr-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Settings</h2>
        <ul className="space-y-4">
          <li>
            <button
              onClick={() => setActiveSection("personalDetails")}
              className="text-blue-500 hover:text-blue-700"
            >
              Personal Details
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("customisationPreferences")}
              className="text-blue-500 hover:text-blue-700"
            >
              Customisation Preferences
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("securitySettings")}
              className="text-blue-500 hover:text-blue-700"
            >
              Security Settings
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("paymentMethods")}
              className="text-blue-500 hover:text-blue-700"
            >
              Payment Methods
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("privacySettings")}
              className="text-blue-500 hover:text-blue-700"
            >
              Privacy and Data Management
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("emailPreferences")}
              className="text-blue-500 hover:text-blue-700"
            >
              Email Preferences
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("otherTravellers")}
              className="text-blue-500 hover:text-blue-700"
            >
              Other Travellers
            </button>
          </li>
        </ul>
      </div>

      {/* Content Section */}
      <div className="content w-3/4 p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Your Booking.com Experience</h1>
        
        {/* Personal Details Section */}
        {activeSection === "personalDetails" && (
          <div className="personal-details mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Personal Details</h2>
            <p className="text-gray-600">Update your information and find out how it's used.</p>
            <button className="text-blue-500 mt-4">Manage Personal Details</button>
            {/* Add the form fields for personal details here */}
          </div>
        )}

        {/* Customisation Preferences Section */}
        {activeSection === "customisationPreferences" && (
          <div className="customisation-preferences mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Customisation Preferences</h2>
            <p className="text-gray-600">Personalise your account to suit your needs.</p>
            <button className="text-blue-500 mt-4">Manage Preferences</button>
            {/* Add customisation preferences form here */}
          </div>
        )}

        {/* Security Settings Section */}
        {activeSection === "securitySettings" && (
          <div className="security-settings mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Security Settings</h2>
            <p className="text-gray-600">Change your security settings, set up secure authentication or delete your account.</p>
            <button className="text-blue-500 mt-4">Manage Account Security</button>
            {/* Add security settings form here */}
          </div>
        )}

        {/* Payment Methods Section */}
        {activeSection === "paymentMethods" && (
          <div className="payment-methods mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Payment Methods</h2>
            <p className="text-gray-600">Securely add or remove payment methods to make it easier when you book.</p>
            <button className="text-blue-500 mt-4">Manage Payment Details</button>
            {/* Add payment methods form here */}
          </div>
        )}

        {/* Privacy and Data Management Section */}
        {activeSection === "privacySettings" && (
          <div className="privacy-data-management mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Privacy and Data Management</h2>
            <p className="text-gray-600">Exercise your privacy rights, control your data or export your information.</p>
            <button className="text-blue-500 mt-4">Manage Privacy</button>
            {/* Add privacy management form here */}
          </div>
        )}

        {/* Email Preferences Section */}
        {activeSection === "emailPreferences" && (
          <div className="email-preferences mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Email Preferences</h2>
            <p className="text-gray-600">Decide what you want to be notified about, and unsubscribe from what you don't.</p>
            <button className="text-blue-500 mt-4">Manage Notifications</button>
            {/* Add email preferences form here */}
          </div>
        )}

        {/* Other Travellers Section */}
        {activeSection === "otherTravellers" && (
          <div className="other-travellers mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Other Travellers</h2>
            <p className="text-gray-600">Add or edit information about the people you’re travelling with.</p>
            <button className="text-blue-500 mt-4">Manage Travellers</button>
            {/* Add other travellers form here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
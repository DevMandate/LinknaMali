import React, { useState } from "react";

const SecuritySettings = () => {
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

  const toggleTwoFactorAuthentication = () => {
    setIsTwoFactorEnabled((prev) => !prev);
    console.log(`Two-Factor Authentication ${!isTwoFactorEnabled ? "enabled" : "disabled"}`);
  };

  return (
    <div className="flex items-start justify-center h-screen pt-10">
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Security Settings</h2>
        <p className="text-gray-600 mb-6">Manage your passwords, two-factor authentication, and security questions.</p>
        
        {/* Two-Factor Authentication */}
        <button
          onClick={toggleTwoFactorAuthentication}
          className={`px-4 py-2 mb-4 rounded-lg shadow-md ${
            isTwoFactorEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
          } text-white`}
        >
          {isTwoFactorEnabled ? "Disable Two-Factor Authentication" : "Enable Two-Factor Authentication"}
        </button>

        {/* Manage Password */}
        <div className="mb-4">
          <button className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg shadow-md hover:bg-[var(--quaternary-color)]">
            Change Password
          </button>
        </div>

        {/* Manage Security Questions */}
        <div>
          <button className="px-4 py-2 bg-[var(--tertiary-color)] text-white rounded-lg shadow-md hover:bg-[var(--quaternary-color)]">
            Update Security Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;

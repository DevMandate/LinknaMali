import React from "react";

const SecuritySettings = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-gray-800">Security Settings</h2>
      <p className="text-gray-600 mb-6">Manage your passwords, two-factor authentication, and security questions.</p>
      <button className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600">
        Enable Two-Factor Authentication
      </button>
    </div>
  );
};

export default SecuritySettings;
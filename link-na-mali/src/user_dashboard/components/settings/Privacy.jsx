import React, { useState, useEffect } from "react";

const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    shareEmail: false,
    sharePhone: false,
    profileVisibility: "public", // "public" or "private"
    showActivity: true,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setTimeout(() => {
          const fetchedSettings = {
            shareEmail: true,
            sharePhone: true,
            profileVisibility: "private",
            showActivity: false,
          };
          setSettings(fetchedSettings);
        }, 1000); // Simulate API delay
      } catch (err) {
        setError("Failed to load privacy settings.");
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleVisibilityChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      profileVisibility: event.target.value,
    }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center h-screen pt-10">
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Privacy Settings</h2>
        <p className="text-gray-600 mb-6">Control what information you share and your privacy preferences.</p>

        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.shareEmail}
                onChange={() => handleToggle("shareEmail")}
                className="mr-2"
              />
              <span className="text-gray-800">Share my email address</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.sharePhone}
                onChange={() => handleToggle("sharePhone")}
                className="mr-2"
              />
              <span className="text-gray-800">Share my phone number</span>
            </label>
          </div>

          <div>
            <label className="text-gray-800">Set profile to:</label>
            <div className="flex flex-col mt-2">
              <label className="mr-4 flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={settings.profileVisibility === "public"}
                  onChange={handleVisibilityChange}
                  className="mr-2"
                />
                <span className="text-gray-800">Public</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={settings.profileVisibility === "private"}
                  onChange={handleVisibilityChange}
                  className="mr-2"
                />
                <span className="text-gray-800">Private</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showActivity}
                onChange={() => handleToggle("showActivity")}
                className="mr-2"
              />
              <span className="text-gray-800">Show my activity status</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
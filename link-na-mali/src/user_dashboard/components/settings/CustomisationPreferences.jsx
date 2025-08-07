import React, { useContext } from "react";
import { PreferencesContext } from "./PreferencesContext";

const CustomisationPreferences = () => {
  const { theme, toggleTheme, language, changeLanguage, font, changeFont } = useContext(PreferencesContext);

  return (
    <div className="flex items-start justify-center h-screen pt-10">
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Customisation Preferences</h2>
        <p className="mb-6">Adjust your preferences for the website interface and experience.</p>
        
        {/* Theme Toggle */}
        <div className="mb-4">
          <label className="block mb-2 font-medium dark:text-gray-300">
            Toggle Theme:
          </label>
          <div className="flex items-center">
            <div
              className="relative w-14 h-7 flex items-center cursor-pointer"
              onClick={toggleTheme}
            >
              <div
                className={`w-full h-full rounded-full transition-all duration-300 ${
                  theme === "dark" ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  theme === "dark" ? "translate-x-7" : "translate-x-0"
                }`}
              ></div>
            </div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">
              {theme === "light" ? "Light Mode" : "Dark Mode"}
            </span>
          </div>
        </div>
  
        {/* Language Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Select Language:</label>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>
  
        {/* Font Selection */}
        <div>
          <label className="block mb-2 font-medium">Select Font:</label>
          <select
            value={font}
            onChange={(e) => changeFont(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
      </div>
    </div>
  );
};
  
export default CustomisationPreferences;
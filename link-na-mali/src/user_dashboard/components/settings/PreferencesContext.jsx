import React, { createContext, useState, useEffect, useCallback } from "react";

// Helper function to get a cookie value
const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(row => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

// Helper function to set a cookie
const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const PreferencesContext = createContext();

const PreferencesProvider = ({ children }) => {
  const [theme, setTheme] = useState(getCookie("theme") || "light");
  const [language, setLanguage] = useState(getCookie("language") || "en");
  const [font, setFont] = useState(getCookie("font") || "sans-serif");

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      console.log("Dark theme applied");
    } else {
      root.classList.remove("dark");
      console.log("Light theme applied");
    }

    setCookie("theme", theme);
  }, [theme]);

  // Persist language and font in cookies
  useEffect(() => setCookie("language", language), [language]);
  useEffect(() => setCookie("font", font), [font]);

  // Memoized functions for better performance
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  const changeLanguage = useCallback((newLanguage) => setLanguage(newLanguage), []);
  const changeFont = useCallback((newFont) => setFont(newFont), []);

  return (
    <PreferencesContext.Provider value={{ theme, toggleTheme, language, changeLanguage, font, changeFont }}>
      <div
        className={`min-h-screen ${
          theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
        } transition-all duration-300`}
        style={{ fontFamily: font }}
      >
        {children}
      </div>
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;
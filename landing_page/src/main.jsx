import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom"; // Import BrowserRouter and Routes
import App from './App.jsx';
import { ThemeProvider } from './context/Theme.jsx';
import { LoginProvider } from './context/IsLoggedIn';
import { PriorityDisplayProvider } from './context/PriorityDisplay';
import { SearchEngineProvider } from './context/SearchEngine';
import ServiceProfile from './components/Specific/6_Services/children/ServiceProfile'; // Import your ServiceProfile component

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap everything in context providers */}
      <SearchEngineProvider>
        <PriorityDisplayProvider>
          <LoginProvider>
            <ThemeProvider>
                <App/>             
            </ThemeProvider>
          </LoginProvider>
        </PriorityDisplayProvider>
      </SearchEngineProvider>
    </BrowserRouter>
  </React.StrictMode>
);


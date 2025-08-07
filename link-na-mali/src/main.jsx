// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router, useLocation } from "react-router-dom";

import App from "./App";
import { ThemeProvider } from "./context/Theme";
import CompanyInviteHandler from "./routes/CompanyInviteHandler"; // ← adjusted import

import { AppProvider as UserAppProvider } from "./user_dashboard/context/AppContext";
import PreferencesProvider from "./user_dashboard/components/settings/PreferencesContext";
import { AppProvider as ServiceProviderAppProvider } from "./serviceProviders/context/ServiceProviderAppContext";

// A tiny component to pick between invite-flow vs. main App
function EntryPoint() {
  const { pathname } = useLocation();

  // If on the invite-login path, render that alone
  if (pathname === "/user-dashboard/company-invite-login") {
    return <CompanyInviteHandler />;
  }

  // Otherwise, render the normal app wrapped in contexts
  return (
    <UserAppProvider>
      <PreferencesProvider>
        <ServiceProviderAppProvider>
          <ThemeProvider
            value={{
              alertOpen: false,
              message: "",
              handleClose: () => {},
              handleExit: () => {},
            }}
          >
            <App />
          </ThemeProvider>
        </ServiceProviderAppProvider>
      </PreferencesProvider>
    </UserAppProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <EntryPoint />
    </Router>
  </React.StrictMode>
);

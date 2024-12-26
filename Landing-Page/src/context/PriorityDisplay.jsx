import React, { createContext, useState, useContext, useEffect } from 'react';

const PriorityDisplayContext = createContext();

export const PriorityDisplayProvider = ({ children }) => {
  const [priorityDisplay, setPriorityDisplay] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
        // Reset priorityDisplay when navigating back
        setPriorityDisplay(null);
    };
    // Listen for popstate (back button press or history change)
    window.addEventListener("popstate", handlePopState);

    return () => {
        window.removeEventListener("popstate", handlePopState);
    };
}, []);

  return (
    <PriorityDisplayContext.Provider value={{ priorityDisplay, setPriorityDisplay }}>
      {children}
    </PriorityDisplayContext.Provider>
  );
};

export const usePriorityDisplay = () => useContext(PriorityDisplayContext);

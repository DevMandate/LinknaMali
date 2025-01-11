import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
const PriorityDisplayContext = createContext();
import {scrollIntoView} from '../utils/scrollIntoView'
export const PriorityDisplayProvider = ({ children }) => {
  const navigate = useNavigate();
  const [priorityDisplay, setPriorityDisplay] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
        // Reset priorityDisplay when navigating back
        setPriorityDisplay(null); 
        navigate('/');
        scrollIntoView('search');
    };
    const navigationEntries = window.performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
      navigate('/');
    }

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

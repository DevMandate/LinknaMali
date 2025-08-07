import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
const PriorityDisplayContext = createContext();

export const PriorityDisplayProvider = ({ children }) => {
  const navigate = useNavigate();
  const [priorityDisplay, setPriorityDisplay] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false); //Admin Naviagtion Drawer
      
  useEffect(() => {
    console.log('PriorityDisplay', priorityDisplay);
  }, [priorityDisplay]);

  useEffect(() => {
    /**window.history.length === 1 means the user opened the page directly,
     * there is no previous page to go back to within the current tab.
     * 
     * window.history.length > 1 means the user navigated to the page from another page,
     * Pressing "Back" will actually take them to a previous page within the same tab.
    const handlePopState = () => {
      /*if (window.history.length > 1) {  // Ensures back button is meaningful
        setPriorityDisplay(null);
        window.location.href = '/'; // Using direct navigation to avoid issues
        scrollIntoView('header');
      }*/
    // const handlePopState = () => {
    //     // Reset priorityDisplay when navigating back
    //     setPriorityDisplay(null); 
    //     navigate('/');
    //     scrollIntoView('header');
    // };
    // const navigationEntries = window.performance.getEntriesByType('navigation');
    // if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
    //   navigate('/');
    // }

    // // Listen for popstate (back button press or history change)
    // window.addEventListener("popstate", handlePopState);

    // return () => {
    //     window.removeEventListener("popstate", handlePopState);
    // };
}, []);

  return (
    <PriorityDisplayContext.Provider value={{ priorityDisplay, setPriorityDisplay, drawerOpen, setDrawerOpen }}>
      {children}
    </PriorityDisplayContext.Provider>
  );
};

export const usePriorityDisplay = () => useContext(PriorityDisplayContext);

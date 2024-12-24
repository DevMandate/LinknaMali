import React, { createContext, useState, useContext } from 'react';

const PriorityDisplayContext = createContext();

export const PriorityDisplayProvider = ({ children }) => {
  const [priorityDisplay, setPriorityDisplay] = useState(null);
  const [detailsDisplay, setDetailsDisplay] = useState(null);

  return (
    <PriorityDisplayContext.Provider value={{ priorityDisplay, setPriorityDisplay, detailsDisplay, setDetailsDisplay }}>
      {children}
    </PriorityDisplayContext.Provider>
  );
};

export const usePriorityDisplay = () => useContext(PriorityDisplayContext);

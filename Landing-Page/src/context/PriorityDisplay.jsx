import React, { createContext, useState, useContext } from 'react';

const PriorityDisplayContext = createContext();

export const PriorityDisplayProvider = ({ children }) => {
  const [priorityDisplay, setPriorityDisplay] = useState(null);

  return (
    <PriorityDisplayContext.Provider value={{ priorityDisplay, setPriorityDisplay }}>
      {children}
    </PriorityDisplayContext.Provider>
  );
};

export const usePriorityDisplay = () => useContext(PriorityDisplayContext);

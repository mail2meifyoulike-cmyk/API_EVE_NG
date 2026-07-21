// Labs context
import React, { createContext, useContext } from 'react';
import { useLabs } from '../hooks/useLabs';

const LabsContext = createContext();

export const LabsProvider = ({ children }) => {
  const labs = useLabs();
  
  return (
    <LabsContext.Provider value={labs}>
      {children}
    </LabsContext.Provider>
  );
};

export const useLabsContext = () => {
  const context = useContext(LabsContext);
  if (!context) {
    throw new Error('useLabsContext must be used within LabsProvider');
  }
  return context;
};
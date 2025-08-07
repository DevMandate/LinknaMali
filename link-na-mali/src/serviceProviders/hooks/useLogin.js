import { useContext } from 'react';
import AppContext from '../context/ServiceProviderAppContext';

export const useLogin = () => {
  const context = useContext(AppContext);
  
  // If context is undefined, provide fallback values
  if (!context) {
    return {
      isLoggedIn: false,
      userData: null,
      pendingAction: false,
      setPendingAction: () => {},
      actionSuccess: false,
      setActionSuccess: () => {},
      markProfileComplete: () => {},
    };
  }

  // Map the context values to match what your components expect
  return {
    isLoggedIn: Boolean(context.userData),
    userData: context.userData,
    pendingAction: context.pendingAction,
    setPendingAction: context.setPendingAction,
    actionSuccess: context.actionSuccess,
    setActionSuccess: context.setActionSuccess,
    markProfileComplete: context.markProfileComplete,
  };
};
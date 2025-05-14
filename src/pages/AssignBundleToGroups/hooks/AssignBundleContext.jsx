import { createContext, useContext } from "react";


export const AssignBundleContext = createContext();


export const useAssignBundleContext = () => {
  const context = useContext(AssignBundleContext);
  if (!context) {
    throw new Error("useAssignBundleContext must be used within AssignBundleContext.Provider");
  }
  return context;
};

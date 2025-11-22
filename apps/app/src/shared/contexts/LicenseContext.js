import React, { createContext, useState, useEffect, useContext } from 'react';
import licenseService from '../services/licenseService';

const LicenseContext = createContext();

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    try {
      const licenseData = await licenseService.getLicenseInfo();
      setLicense(licenseData);
    } catch (error) {
      console.error('❌ Error al cargar licencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModuleEnabled = (moduleName) => {
    return licenseService.isModuleEnabled(license, moduleName);
  };

  const isLicenseValid = () => {
    return licenseService.isLicenseValid(license);
  };

  const value = {
    license,
    loading,
    isModuleEnabled,
    isLicenseValid,
    reloadLicense: loadLicense
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

export default LicenseContext;

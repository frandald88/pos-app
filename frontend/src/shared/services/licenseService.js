import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class LicenseService {
  async getLicenseInfo() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/license`);
      return response.data.license;
    } catch (error) {
      console.error('Error al obtener información de licencia:', error);
      // Retornar licencia básica por defecto si hay error
      return {
        clientName: 'Sin Licencia',
        tier: 'basic',
        modules: {},
        features: {
          maxUsers: 3,
          maxStores: 1,
          multiStore: false
        },
        active: false,
        isExpired: false,
        isValid: false
      };
    }
  }

  isModuleEnabled(license, moduleName) {
    if (!license || !license.active) {
      return false;
    }
    return license.modules[moduleName] === true;
  }

  isLicenseValid(license) {
    if (!license) return false;
    return license.active && !license.isExpired;
  }

  getLicenseTier(license) {
    return license?.tier || 'basic';
  }

  getEnabledModules(license) {
    if (!license || !license.modules) return [];
    return Object.keys(license.modules).filter(module => license.modules[module] === true);
  }
}

export default new LicenseService();

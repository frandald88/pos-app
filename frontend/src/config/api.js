// 📁 /frontend/src/config/api.js
// Migrado y adaptado desde apiConfig.js

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_BASE_URL = apiBaseUrl;

// Mantener compatibilidad con tu código existente
export default apiBaseUrl;

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/api/auth/login',
    profile: '/api/auth/profile', // ✅ CORREGIDO: era /api/users/profile
    verify: '/api/auth/verify',
    logout: '/api/auth/logout',
    changePassword: '/api/auth/change-password',
    refresh: '/api/auth/refresh'
  },
  
  // Core modules
  users: '/api/users',
  products: '/api/products', 
  sales: '/api/sales',
  tiendas: '/api/tiendas',
  
  // Optional modules  
  clientes: '/api/clientes',
  devoluciones: '/api/devoluciones',
  gastos: '/api/gastos',
  empleados: '/api/empleados',
  caja: '/api/caja',
  reportes: '/api/reportes',
  delivery: '/api/delivery',
  vacaciones: '/api/vacaciones'
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token })
  };
};

export const buildApiUrl = (endpoint) => {
  return apiBaseUrl + endpoint;
};

// ✅ NUEVAS FUNCIONES ÚTILES
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const headers = getAuthHeaders();
  
  try {
    const response = await fetch(buildApiUrl(url), {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error en request autenticado:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await fetch(buildApiUrl('/api/health'), {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('❌ API no disponible:', error);
    return false;
  }
};
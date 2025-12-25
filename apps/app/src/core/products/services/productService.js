import axios from 'axios';
import apiBaseUrl from '../../../config/api';

export const productService = {
  // Obtener todos los productos
  getAllProducts: async (token, filters = {}) => {
    const params = {};

    // Agregar filtros como query params
    if (filters.tiendaId) {
      params.tiendaId = filters.tiendaId;
    }
    if (filters.category) {
      params.category = filters.category;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.inStock !== undefined) {
      params.inStock = filters.inStock;
    }
    // ⭐ NUEVO: Paginación
    if (filters.page) {
      params.page = filters.page;
    }
    if (filters.limit) {
      params.limit = filters.limit;
    }

    const response = await axios.get(`${apiBaseUrl}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    // ⭐ NUEVO: Retornar el objeto completo con products, pagination y stats
    if (response.data.data?.products) {
      return {
        products: response.data.data.products,
        pagination: response.data.data.pagination || {},
        stats: response.data.data.stats || {}
      };
    } else if (response.data.products) {
      return {
        products: response.data.products,
        pagination: response.data.pagination || {},
        stats: response.data.stats || {}
      };
    } else if (Array.isArray(response.data)) {
      return {
        products: response.data,
        pagination: {},
        stats: {}
      };
    } else {
      return {
        products: [],
        pagination: {},
        stats: {}
      };
    }
  },

  // Obtener siguiente SKU
  getNextSKU: async (token) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/next-sku`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // El backend devuelve { success: true, data: { nextSKU: "..." }, message: "..." }
    return response.data.data || response.data;
  },

  // Obtener tiendas
  getTiendas: async (token) => {
    const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
    return response.data.data.tiendas;
  },

  // Obtener perfil de usuario
  getUserProfile: async (token) => {
    const response = await axios.get(`${apiBaseUrl}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Obtener categorías con conteo
  getCategoriesWithCount: async (token) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/categories-with-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // El backend devuelve { success: true, data: [...], message: "..." }
    return response.data.data || response.data;
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async (token, threshold = 10) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/low-stock`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { threshold }
    });
    // El backend devuelve { success: true, data: [...], message: "..." }
    return response.data.data || response.data;
  },

  // Buscar productos
  searchProducts: async (token, query) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query }
    });
    // El backend devuelve { success: true, data: [...], message: "..." }
    return response.data.data || response.data;
  },

  // Reabastecer producto
  restockProduct: async (token, productId, payload) => {
    const response = await axios.post(`${apiBaseUrl}/api/products/${productId}/restock`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Debug de producto
  getProductDebug: async (token, productId) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/${productId}/debug`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Crear producto
  createProduct: async (token, productData) => {
    const response = await axios.post(`${apiBaseUrl}/api/products`, productData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Actualizar producto
  updateProduct: async (token, productId, productData) => {
    const response = await axios.put(`${apiBaseUrl}/api/products/${productId}`, productData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Eliminar producto
  deleteProduct: async (token, productId) => {
    const response = await axios.delete(`${apiBaseUrl}/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Obtener producto por ID
  getProductById: async (token, productId) => {
    const response = await axios.get(`${apiBaseUrl}/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
};
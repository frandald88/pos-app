import axios from 'axios';
import apiBaseUrl from '../../../config/api';

export const productService = {
  // Obtener todos los productos
  getAllProducts: async (token) => {
    const response = await axios.get(`${apiBaseUrl}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // El controller devuelve un objeto con products, pagination, stats
    // Pero el frontend solo necesita el array de products
    let products;
    if (response.data.data?.products) {
      products = response.data.data.products;
    } else if (response.data.products) {
      products = response.data.products;
    } else if (Array.isArray(response.data)) {
      products = response.data;
    } else {
      products = [];
    }
    return products;
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
    return response.data;
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
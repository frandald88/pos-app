import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class DeliveryService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/orders`;
    this.token = localStorage.getItem('token');
  }

  // Configurar headers con token
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('token')}`
    };
  }

  // Obtener todas las órdenes
  async getAllOrders(params = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        headers: this.getHeaders(),
        params
      });
      
      // El backend devuelve { success: true, data: { orders: [...], pagination: {...} } }
      if (response.data.data?.orders) {
        return {
          orders: response.data.data.orders,
          pagination: response.data.data.pagination
        };
      } else if (response.data.orders) {
        // Estructura legacy
        return {
          orders: response.data.orders,
          pagination: response.data.pagination
        };
      } else if (Array.isArray(response.data)) {
        // Estructura muy antigua
        return {
          orders: response.data,
          pagination: null
        };
      } else {
        return {
          orders: [],
          pagination: null
        };
      }
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      throw error;
    }
  }

  // Obtener mis órdenes
  async getMyOrders(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/mine`, {
        headers: this.getHeaders(),
        params
      });
      
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener mis órdenes:', error);
      throw error;
    }
  }

  // Crear nueva orden
  async createOrder(orderData) {
    try {
      const response = await axios.post(this.baseURL, orderData, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  // Actualizar orden
  async updateOrder(orderId, updateData) {
    try {
      const response = await axios.put(`${this.baseURL}/${orderId}`, updateData, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      throw error;
    }
  }

  // Eliminar orden
  async deleteOrder(orderId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${orderId}`, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      throw error;
    }
  }

  // Obtener orden por ID
  async getOrderById(orderId) {
    try {
      const response = await axios.get(`${this.baseURL}/${orderId}`, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener orden:', error);
      throw error;
    }
  }

  // Obtener tiendas
  async getTiendas() {
    try {
      const response = await axios.get(`${this.baseURL}/tiendas`, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener tiendas:', error);
      throw error;
    }
  }

  // Obtener usuarios para asignación
  async getUsers(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: this.getHeaders(),
        params
      });
      
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  // Obtener información del usuario actual
  async getUserInfo() {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
        headers: this.getHeaders()
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      throw error;
    }
  }

  // Obtener reporte de órdenes
  async getOrderReport(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/report/summary`, {
        headers: this.getHeaders(),
        params
      });
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      throw error;
    }
  }
}

export default new DeliveryService();
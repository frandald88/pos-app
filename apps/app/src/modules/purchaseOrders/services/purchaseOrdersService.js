import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class PurchaseOrdersService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/purchase-orders`;
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    };
  }

  // Obtener todas las órdenes de compra
  async getAll(filters = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        headers: this.getHeaders(),
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener órdenes de compra:', error);
      throw error;
    }
  }

  // Obtener orden por ID
  async getById(id) {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: this.getHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener orden de compra:', error);
      throw error;
    }
  }

  // Crear nueva orden
  async create(orderData) {
    try {
      const response = await axios.post(this.baseURL, orderData, {
        headers: this.getHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al crear orden de compra:', error);
      throw error;
    }
  }

  // Actualizar orden
  async update(id, orderData) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}`, orderData, {
        headers: this.getHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error);
      throw error;
    }
  }

  // Eliminar orden
  async delete(id) {
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar orden de compra:', error);
      throw error;
    }
  }

  // Obtener tiendas
  async getTiendas() {
    try {
      const response = await axios.get(`${this.baseURL}/tiendas`, {
        headers: this.getHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener tiendas:', error);
      throw error;
    }
  }

  // Obtener usuarios (con filtro por tienda)
  async getUsers(filters = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: this.getHeaders(),
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }
}

export default new PurchaseOrdersService();

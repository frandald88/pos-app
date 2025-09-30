import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class ClientesService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/clientes`;
    this.token = localStorage.getItem('token');
  }

  // Configurar headers con token
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Actualizar token si es necesario
  updateToken() {
    this.token = localStorage.getItem('token');
  }

  // Obtener todos los clientes
  async getClientes(filters = {}) {
    try {
      this.updateToken();
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`${this.baseURL}?${params}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  async getClienteById(id) {
    try {
      this.updateToken();
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching cliente by ID:', error);
      throw error;
    }
  }

  // Crear cliente
  async createCliente(clienteData) {
    try {
      this.updateToken();
      const response = await axios.post(this.baseURL, clienteData, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  async updateCliente(id, clienteData) {
    try {
      this.updateToken();
      const response = await axios.put(`${this.baseURL}/${id}`, clienteData, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente
  async deleteCliente(id) {
    try {
      this.updateToken();
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw error;
    }
  }

  // Buscar clientes (para autocomplete)
  async searchClientes(term, limit = 10) {
    try {
      this.updateToken();
      const response = await axios.get(`${this.baseURL}/search/${term}?limit=${limit}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching clientes:', error);
      throw error;
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      this.updateToken();
      const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
}

export default new ClientesService();
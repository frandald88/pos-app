import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class TiendasService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/tiendas`;
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

  // Obtener todas las tiendas
  async getTiendas(filters = {}) {
    try {
      this.updateToken();
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.page) params.append('page', filters.page);
      if (filters.includeStats !== undefined) params.append('includeStats', filters.includeStats);
      if (filters.includeArchived !== undefined) params.append('includeArchived', filters.includeArchived);

      const response = await axios.get(`${this.baseURL}?${params}`, {
        headers: this.getHeaders()
      });

      // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
      return response.data.data.tiendas;
    } catch (error) {
      console.error('Error fetching tiendas:', error);
      throw error;
    }
  }

  // Obtener tienda por ID
  async getTiendaById(id, includeDetails = false) {
    try {
      this.updateToken();
      const params = includeDetails ? '?includeDetails=true' : '';
      const response = await axios.get(`${this.baseURL}/${id}${params}`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching tienda by ID:', error);
      throw error;
    }
  }

  // Crear tienda
  async createTienda(tiendaData) {
    try {
      this.updateToken();
      const response = await axios.post(this.baseURL, tiendaData, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error creating tienda:', error);
      throw error;
    }
  }

  // Actualizar tienda
  async updateTienda(id, tiendaData) {
    try {
      this.updateToken();
      const response = await axios.put(`${this.baseURL}/${id}`, tiendaData, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error updating tienda:', error);
      throw error;
    }
  }

  // Obtener relaciones de una tienda (usuarios, productos, ventas)
  async getTiendaRelationships(id) {
    try {
      this.updateToken();
      const response = await axios.get(`${this.baseURL}/${id}/relationships`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching tienda relationships:', error);
      throw error;
    }
  }

  // Archivar tienda (soft delete)
  async archiveTienda(id) {
    try {
      this.updateToken();
      const response = await axios.patch(`${this.baseURL}/${id}/archive`, {}, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error archiving tienda:', error);
      throw error;
    }
  }

  // Restaurar tienda archivada
  async restoreTienda(id) {
    try {
      this.updateToken();
      const response = await axios.patch(`${this.baseURL}/${id}/restore`, {}, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error restoring tienda:', error);
      throw error;
    }
  }

  // Eliminar tienda
  async deleteTienda(id, forceDelete = false) {
    try {
      this.updateToken();
      const params = forceDelete ? '?force=true' : '';
      const response = await axios.delete(`${this.baseURL}/${id}${params}`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting tienda:', error);
      throw error;
    }
  }

  // Buscar tiendas (para autocomplete)
  async searchTiendas(term, limit = 10) {
    try {
      this.updateToken();
      const response = await axios.get(`${this.baseURL}/search/${term}?limit=${limit}`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error searching tiendas:', error);
      throw error;
    }
  }
}

export default new TiendasService();
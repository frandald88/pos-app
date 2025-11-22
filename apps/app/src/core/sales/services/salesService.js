import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class SalesService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/sales`;
    this.token = localStorage.getItem('token');
  }

  // Configurar headers con token
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('token')}`
    };
  }

  // Obtener productos para la venta
  async getProducts(tiendaId = null) {
    try {
      const params = tiendaId ? { tiendaId } : {};
      const response = await axios.get(`${apiBaseUrl}/api/products`, {
        headers: this.getHeaders(),
        params
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
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  }

  // Obtener clientes
  async getClientes() {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/clientes`, {
        headers: this.getHeaders()
      });
      return response.data.data.clientes;
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      throw error;
    }
  }

  // Obtener perfil del usuario
  async getUserProfile() {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users/profile`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil del usuario:', error);
      throw error;
    }
  }

  // Obtener tiendas
  async getTiendas() {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
        headers: this.getHeaders()
      });
      // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
      return response.data.data.tiendas;
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      throw error;
    }
  }

  // Obtener usuarios repartidores
  async getDeliveryUsers() {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users`, {
        headers: this.getHeaders()
      });
      return response.data.filter(user => user.role === 'repartidor');
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
      throw error;
    }
  }

  // Crear venta
  async createSale(saleData) {
    try {
      const response = await axios.post(this.baseURL, saleData, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al registrar venta:', error);
      throw error;
    }
  }

  // Generar cotización
  async generateQuote(quoteData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/quote`,
        quoteData,
        {
          headers: this.getHeaders(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al generar cotización:', error);
      throw error;
    }
  }

  // Validar pagos mixtos
  async validateMixedPayment(validationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/validate-mixed-payment`,
        validationData,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al validar pagos mixtos:', error);
      throw error;
    }
  }

  // Obtener ventas
  async getSales(filters = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        headers: this.getHeaders(),
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  }

  // Obtener venta por ID
  async getSaleById(id) {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener venta por ID:', error);
      throw error;
    }
  }

  // Actualizar estado de venta
  async updateSaleStatus(id, status) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}/status`, 
        { status },
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado de venta:', error);
      throw error;
    }
  }

  // Obtener tiendas para filtros
  async getTiendasForFilter() {
    try {
      const response = await axios.get(`${this.baseURL}/tiendas`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener tiendas para filtro:', error);
      throw error;
    }
  }

  // Obtener estadísticas de pagos mixtos
  async getMixedPaymentStats(filters = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/mixed-payment-stats`, {
        headers: this.getHeaders(),
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de pagos mixtos:', error);
      throw error;
    }
  }

  // Eliminar múltiples ventas
  async deleteMultipleSales(ids) {
    try {
      const response = await axios.post(`${this.baseURL}/delete-multiple`, 
        { ids },
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al eliminar múltiples ventas:', error);
      throw error;
    }
  }

  // Eliminar ventas sin tienda
  async deleteSalesWithoutStore() {
    try {
      const response = await axios.delete(`${this.baseURL}/no-store`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar ventas sin tienda:', error);
      throw error;
    }
  }
}

export default new SalesService();
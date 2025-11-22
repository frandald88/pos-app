import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class ReportesService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/report`;
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

  // Obtener reporte de ventas
  async getVentasReport(params) {
    try {
      this.updateToken();
      const response = await axios.get(`${this.baseURL}/ventas`, {
        headers: this.getHeaders(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching ventas report:', error);
      throw error;
    }
  }

  // Obtener reporte de devoluciones
  async getDevolucionesReport(params) {
    try {
      this.updateToken();

      // Mapear parámetros del frontend al formato del backend
      // Convertir fecha y hora local a ISO string para el backend
      const backendParams = {
        startDate: params.inicio ? new Date(params.inicio).toISOString() : undefined,
        endDate: params.fin ? new Date(params.fin).toISOString() : undefined,
        tiendaId: params.tiendaId,
        status: params.status,
        refundMethod: params.refundMethod
      };

      // Limpiar parámetros undefined
      Object.keys(backendParams).forEach(key => {
        if (backendParams[key] === undefined) {
          delete backendParams[key];
        }
      });

      const response = await axios.get(`${apiBaseUrl}/api/returns`, {
        headers: this.getHeaders(),
        params: backendParams
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching devoluciones report:', error);
      throw error;
    }
  }

  // Eliminar ventas sin tienda
  async deleteNoStoreSales() {
    try {
      this.updateToken();
      const response = await axios.delete(`${apiBaseUrl}/api/sales/no-store`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting no-store sales:', error);
      throw error;
    }
  }

  // Eliminar múltiples ventas
  async deleteMultipleSales(ids) {
    try {
      this.updateToken();
      const response = await axios.post(`${apiBaseUrl}/api/sales/delete-multiple`,
        { ids },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting multiple sales:', error);
      throw error;
    }
  }
}

export default new ReportesService();

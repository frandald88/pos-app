import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class DevolucionesService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/returns`;
    this.salesURL = `${apiBaseUrl}/api/sales`;
    this.token = localStorage.getItem('token');
  }

  // Headers comunes para todas las peticiones
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('token')}`,
    };
  }

  // Buscar venta por ID
  async getSale(saleId) {
    const response = await axios.get(`${this.salesURL}/${saleId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Verificar si una venta ya tiene devoluciones
  async getReturnsBySale(saleId) {
    const response = await axios.get(`${this.baseURL}/by-sale/${saleId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Crear nueva devolución
  async createReturn(returnData) {
    const response = await axios.post(this.baseURL, returnData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Obtener todas las devoluciones con filtros
  async getReturns(filters = {}) {
    const response = await axios.get(this.baseURL, {
      headers: this.getHeaders(),
      params: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        tiendaId: filters.tiendaId || undefined,
        status: filters.status || undefined,
        refundMethod: filters.refundMethod || undefined,
        limit: filters.limit || 50,
        page: filters.page || 1,
      },
    });
    return response.data;
  }

  // Obtener devolución por ID
  async getReturn(returnId) {
    const response = await axios.get(`${this.baseURL}/${returnId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Actualizar estado de devolución (aprobar/rechazar)
  async updateReturnStatus(returnId, status, adminNotes = '') {
    const response = await axios.patch(
      `${this.baseURL}/${returnId}/status`,
      { status, adminNotes },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Obtener reporte de devoluciones
  async getReturnsSummary(filters = {}) {
    const response = await axios.get(`${this.baseURL}/report/summary`, {
      headers: this.getHeaders(),
      params: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        tiendaId: filters.tiendaId || undefined,
      },
    });
    return response.data;
  }

  // Obtener tiendas disponibles
  async getAvailableStores() {
    const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Obtener información del usuario actual
  async getCurrentUser() {
    const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

export default new DevolucionesService();
import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class GastosService {
  constructor() {
    this.baseURL = `${apiBaseUrl}/api/expenses`;
    this.token = localStorage.getItem('token');
  }

  // Headers comunes para todas las peticiones
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('token')}`,
    };
  }

  // Headers para form data
  getFormDataHeaders() {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    };
  }

  // Crear nuevo gasto
  async createExpense(expenseData) {
    const formData = new FormData();
    formData.append('concepto', expenseData.concepto);
    formData.append('proveedor', expenseData.proveedor);
    formData.append('monto', expenseData.monto === '' ? 0 : parseFloat(expenseData.monto));
    formData.append('metodoPago', expenseData.metodoPago);
    formData.append('tienda', expenseData.tienda);
    
    if (expenseData.evidencia) {
      formData.append('evidencia', expenseData.evidencia);
    }

    const response = await axios.post(this.baseURL, formData, {
      headers: this.getFormDataHeaders(),
    });
    return response.data;
  }

  // Obtener reporte de gastos (admin)
  async getReport(filters = {}) {
    const response = await axios.get(`${this.baseURL}/report`, {
      headers: this.getHeaders(),
      params: {
        proveedor: filters.proveedor || undefined,
        metodoPago: filters.metodoPago || undefined,
        tiendaId: filters.tiendaId || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      },
    });
    return response.data;
  }

  // Obtener gastos del usuario actual
  async getMyExpenses(limit = 50) {
    const response = await axios.get(`${this.baseURL}/mine`, {
      headers: this.getHeaders(),
      params: { limit },
    });
    return response.data;
  }

  // Actualizar estado del gasto
  async updateStatus(gastoId, status, nota = '') {
    const response = await axios.patch(
      `${this.baseURL}/status/${gastoId}`,
      { status, nota },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Eliminar gasto
  async deleteExpense(gastoId) {
    const response = await axios.delete(`${this.baseURL}/${gastoId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Obtener lista de proveedores
  async getProviders() {
    const response = await axios.get(`${this.baseURL}/providers`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Buscar proveedores
  async searchProviders(query) {
    const response = await axios.get(`${this.baseURL}/providers/search`, {
      headers: this.getHeaders(),
      params: { q: query },
    });
    return response.data;
  }

  // Obtener tiendas disponibles
  async getAvailableStores() {
    const response = await axios.get(`${this.baseURL}/available-stores`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Obtener evidencia
  async getEvidence(filename) {
    const response = await axios.get(`${this.baseURL}/evidencia/${filename}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
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

export default new GastosService();
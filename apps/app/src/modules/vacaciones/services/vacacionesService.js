import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class VacacionesService {
  constructor() {
    this.baseUrl = `${apiBaseUrl}/api/vacations`;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  // Obtener días disponibles para un usuario
  async getDaysAvailable(userId) {
    const response = await axios.get(
      `${this.baseUrl}/days-available/${userId}`,
      { headers: this.getAuthHeaders() }
    );
    // Extraer data del wrapper de respuesta estándar
    return response.data.data || response.data;
  }

  // Obtener resumen de días tomados
  async getDaysSummary(userId) {
    const response = await axios.get(
      `${this.baseUrl}/days-summary/${userId}`,
      { headers: this.getAuthHeaders() }
    );
    // Extraer data del wrapper de respuesta estándar
    return response.data.data || response.data;
  }

  // Crear solicitud de vacaciones
  async createRequest(data) {
    const response = await axios.post(
      `${this.baseUrl}/request`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Obtener mis solicitudes
  async getMine(params = {}) {
    const response = await axios.get(
      `${this.baseUrl}/mine`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
    // Extract array from response
    return response.data?.data || response.data || [];
  }

  // Obtener todas las solicitudes (admin)
  async getAll(params = {}) {
    const response = await axios.get(
      `${this.baseUrl}/all`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
    // Extract array from response - backend returns {success, data, message}
    return response.data?.data || response.data || [];
  }

  // Actualizar estado de solicitud (admin)
  async updateStatus(requestId, status, reason = '') {
    const response = await axios.patch(
      `${this.baseUrl}/${requestId}/status`,
      { status, reason },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Eliminar solicitud (admin)
  async deleteRequest(requestId, action = 'soft') {
    const response = await axios.delete(
      `${this.baseUrl}/${requestId}`,
      {
        headers: this.getAuthHeaders(),
        data: { action }
      }
    );
    return response.data;
  }

  // Obtener solicitudes eliminadas (admin)
  async getDeleted(limit = 50) {
    const response = await axios.get(
      `${this.baseUrl}/deleted`,
      {
        headers: this.getAuthHeaders(),
        params: { limit }
      }
    );
    // Extract array from response - backend returns {success, data, message}
    return response.data?.data || response.data || [];
  }

  // Restaurar solicitud eliminada (admin)
  async restoreRequest(requestId) {
    const response = await axios.patch(
      `${this.baseUrl}/${requestId}/restore`,
      {},
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Actualizar días tomados automáticamente (admin)
  async updateTakenDays() {
    const response = await axios.post(
      `${this.baseUrl}/update-taken-days`,
      {},
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Obtener opciones de reemplazo para una tienda
  async getReplacementOptions(tiendaId) {
    const response = await axios.get(
      `${apiBaseUrl}/api/users/replacements/${tiendaId}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Fallback: obtener todos los usuarios y filtrar manualmente
  async getAllUsers() {
    const response = await axios.get(
      `${apiBaseUrl}/api/users`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Limpieza masiva de solicitudes (admin)
  async cleanupRequests(options) {
    const response = await axios.delete(
      `${this.baseUrl}/cleanup`,
      {
        headers: this.getAuthHeaders(),
        data: {
          ...options,
          confirm: true
        }
      }
    );
    return response.data;
  }
}

export default new VacacionesService();

import axios from 'axios';
import apiBaseUrl from '../../../config/api';

class EmpleadosService {
  constructor() {
    this.baseURL = apiBaseUrl;
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

  // ========== ASISTENCIA ==========

  // Check-in de empleado
  async checkIn(data) {
    try {
      this.updateToken();
      const response = await axios.post(
        `${this.baseURL}/api/attendance/checkin`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error en check-in:', error);
      throw error;
    }
  }

  // Check-out de empleado
  async checkOut(data) {
    try {
      this.updateToken();
      const response = await axios.post(
        `${this.baseURL}/api/attendance/checkout`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error en check-out:', error);
      throw error;
    }
  }

  // Registrar ausencia
  async registerAbsence(data) {
    try {
      this.updateToken();
      const response = await axios.post(
        `${this.baseURL}/api/attendance/absence`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando ausencia:', error);
      throw error;
    }
  }

  // Obtener estado de asistencia
  async getAttendanceStatus() {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/attendance/status`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado de asistencia:', error);
      throw error;
    }
  }

  // Obtener reporte de asistencia
  async getAttendanceReport(params) {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/attendance/report`,
        {
          headers: this.getHeaders(),
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reporte de asistencia:', error);
      throw error;
    }
  }

  // ========== USUARIOS ==========

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/users/me`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/users`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // ========== TIENDAS ==========

  // Obtener todas las tiendas
  async getAllTiendas() {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/tiendas`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tiendas:', error);
      throw error;
    }
  }

  // ========== HISTORIAL DE EMPLEADOS ==========

  // Obtener ranking de empleados por faltas
  async getRankingFaltas(params) {
    try {
      this.updateToken();
      const response = await axios.get(
        `${this.baseURL}/api/employees/history/ranking/faltas`,
        {
          headers: this.getHeaders(),
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ranking de faltas:', error);
      throw error;
    }
  }
}

export default new EmpleadosService();

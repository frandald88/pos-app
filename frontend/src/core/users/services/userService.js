import axios from "axios";
import apiBaseUrl from "../../../config/api";

const token = () => localStorage.getItem("token");

class UserService {
  // Obtener todos los usuarios
  async getUsers() {
    const response = await axios.get(`${apiBaseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener datos del usuario actual
  async getMe() {
    const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener perfil del usuario
  async getProfile() {
    const response = await axios.get(`${apiBaseUrl}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener usuarios eliminados
  async getDeletedUsers() {
    const response = await axios.get(`${apiBaseUrl}/api/users/deleted`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener usuarios para reemplazos
  async getReplacementUsers(tiendaId) {
    const response = await axios.get(`${apiBaseUrl}/api/users/replacements/${tiendaId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Crear nuevo usuario
  async createUser(userData) {
    const response = await axios.post(`${apiBaseUrl}/api/users`, userData, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Actualizar usuario
  async updateUser(id, userData) {
    const response = await axios.put(`${apiBaseUrl}/api/users/${id}`, userData, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Eliminar usuario
  async deleteUser(id) {
    const response = await axios.delete(`${apiBaseUrl}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Restaurar usuario
  async restoreUser(id) {
    const response = await axios.patch(`${apiBaseUrl}/api/users/${id}/restore`, {}, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener tiendas
  async getTiendas() {
    const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener historial laboral
  async getHistorialLaboral() {
    const response = await axios.get(`${apiBaseUrl}/api/historial-laboral`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Crear historial laboral
  async createHistorialLaboral(data) {
    const response = await axios.post(`${apiBaseUrl}/api/historial-laboral`, data, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Actualizar historial laboral
  async updateHistorialLaboral(id, data) {
    const response = await axios.put(`${apiBaseUrl}/api/historial-laboral/${id}`, data, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Obtener datos personales
  async getDatosPersonales() {
    const response = await axios.get(`${apiBaseUrl}/api/datos-personales`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }

  // Crear/actualizar datos personales
  async saveDatosPersonales(data) {
    const response = await axios.post(`${apiBaseUrl}/api/datos-personales`, data, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return response.data;
  }
}

export default new UserService();
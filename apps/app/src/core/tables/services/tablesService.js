import axios from 'axios';
import API_BASE_URL from '../../../apiConfig';

const API_URL = `${API_BASE_URL}/api/tables`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Obtener todas las mesas
export const getAllTables = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.tiendaId) params.append('tiendaId', filters.tiendaId);
    if (filters.status) params.append('status', filters.status);
    if (filters.section) params.append('section', filters.section);

    const response = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo mesas:', error);
    throw error;
  }
};

// Obtener mesa por ID
export const getTableById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo mesa:', error);
    throw error;
  }
};

// Crear nueva mesa
export const createTable = async (tableData) => {
  try {
    const response = await axios.post(API_URL, tableData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error creando mesa:', error);
    throw error;
  }
};

// Actualizar mesa
export const updateTable = async (id, tableData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, tableData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error actualizando mesa:', error);
    throw error;
  }
};

// Cambiar estado de mesa
export const changeTableStatus = async (id, status) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error cambiando estado de mesa:', error);
    throw error;
  }
};

// Eliminar mesa
export const deleteTable = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error eliminando mesa:', error);
    throw error;
  }
};

// Obtener secciones únicas
export const getSections = async (tiendaId = null) => {
  try {
    const params = tiendaId ? `?tiendaId=${tiendaId}` : '';
    const response = await axios.get(`${API_URL}/sections${params}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo secciones:', error);
    throw error;
  }
};

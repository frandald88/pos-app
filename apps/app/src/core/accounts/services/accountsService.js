import axios from 'axios';
import API_BASE_URL from '../../../apiConfig';

const API_URL = `${API_BASE_URL}/api/accounts`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Obtener todas las cuentas
export const getAllAccounts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.tiendaId) params.append('tiendaId', filters.tiendaId);
    if (filters.turnoId) params.append('turnoId', filters.turnoId);
    if (filters.status) params.append('status', filters.status);
    if (filters.waiterId) params.append('waiterId', filters.waiterId);
    if (filters.tableId) params.append('tableId', filters.tableId);

    const response = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    throw error;
  }
};

// Obtener cuenta por ID
export const getAccountById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cuenta:', error);
    throw error;
  }
};

// Crear nueva cuenta (abrir mesa)
export const createAccount = async (accountData) => {
  try {
    const response = await axios.post(API_URL, accountData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error creando cuenta:', error);
    throw error;
  }
};

// Agregar orden a cuenta existente
export const addOrderToAccount = async (id, items) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/orders`, { items }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error agregando orden:', error);
    throw error;
  }
};

// Actualizar estado de item
export const updateItemStatus = async (id, orderIndex, itemIndex, status) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/items/status`, {
      orderIndex,
      itemIndex,
      status
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error actualizando estado de item:', error);
    throw error;
  }
};

// Aplicar descuento
export const applyDiscount = async (id, discount) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/discount`, { discount }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error aplicando descuento:', error);
    throw error;
  }
};

// Aplicar propina
export const applyTip = async (id, tipData) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/tip`, tipData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error aplicando propina:', error);
    throw error;
  }
};

// Generar ticket preliminar
export const generatePreliminaryTicket = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/preliminary-ticket`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error generando ticket preliminar:', error);
    throw error;
  }
};

// Configurar división de cuenta
export const configureSplit = async (id, splits) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/split`, { splits }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error configurando división:', error);
    throw error;
  }
};

// Pagar división específica
export const paySplit = async (id, splitNum, paymentData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/split/${splitNum}/pay`, paymentData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error pagando división:', error);
    throw error;
  }
};

// Pagar cuenta completa
export const payAccount = async (id, paymentData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/pay`, paymentData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error pagando cuenta:', error);
    throw error;
  }
};

// Cerrar cuenta (solicitar cuenta)
export const closeAccount = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/close`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error cerrando cuenta:', error);
    throw error;
  }
};

// Cancelar cuenta
export const cancelAccount = async (id, reason) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/cancel`, { reason }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelando cuenta:', error);
    throw error;
  }
};

// Enviar items a cocina
export const sendToKitchen = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/send-to-kitchen`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error enviando a cocina:', error);
    throw error;
  }
};

// Obtener items en cocina
export const getKitchenItems = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.tiendaId) params.append('tiendaId', filters.tiendaId);
    if (filters.status) params.append('status', filters.status);

    const response = await axios.get(`${API_URL}/kitchen/items?${params.toString()}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo items de cocina:', error);
    throw error;
  }
};

// Marcar item como listo
export const markItemReady = async (id, orderIdx, itemIdx) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/mark-ready`, {
      orderIdx,
      itemIdx
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error marcando item como listo:', error);
    throw error;
  }
};

// Cancelar item
export const cancelItem = async (id, orderIdx, itemIdx, reason) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/cancel-item`, {
      orderIdx,
      itemIdx,
      reason
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelando item:', error);
    throw error;
  }
};

// Editar item (solo si está en estado 'pending')
export const editItem = async (id, orderIdx, itemIdx, updates) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/edit-item`, {
      orderIdx,
      itemIdx,
      ...updates
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error editando item:', error);
    throw error;
  }
};

// ============ SUBCUENTAS ============

// Agregar subcuenta
export const addSubcuenta = async (id, name) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/subcuentas`, { name }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error agregando subcuenta:', error);
    throw error;
  }
};

// Eliminar subcuenta
export const removeSubcuenta = async (id, name) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}/subcuentas`, {
      headers: getAuthHeader(),
      data: { name }
    });
    return response.data;
  } catch (error) {
    console.error('Error eliminando subcuenta:', error);
    throw error;
  }
};

// Asignar item a subcuenta
export const assignItemToSubcuenta = async (id, orderIdx, itemIdx, subcuentaName) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/subcuentas/assign`, {
      orderIdx,
      itemIdx,
      subcuentaName
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error asignando item:', error);
    throw error;
  }
};

// Obtener resumen de subcuentas
export const getSubcuentasSummary = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/subcuentas/summary`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    throw error;
  }
};

// Pagar subcuenta
export const paySubcuenta = async (id, paymentData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/subcuentas/pay`, paymentData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error pagando subcuenta:', error);
    throw error;
  }
};

import { useState, useEffect } from 'react';
import clientesService from '../services/clientesService';

export const useClientesData = () => {
  const [clientes, setClientes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');

  // Cargar usuario actual
  const loadCurrentUser = async () => {
    try {
      const userData = await clientesService.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setMsg('Error al cargar el usuario actual ❌');
    }
  };

  // Cargar clientes
  const fetchClientes = async (filters = {}) => {
    try {
      setCargando(true);
      const response = await clientesService.getClientes(filters);
      setClientes(response.data?.clientes || []);
      setCargando(false);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setMsg('Error al cargar clientes ❌');
      setCargando(false);
    }
  };

  // Crear cliente
  const createCliente = async (clienteData) => {
    try {
      setCargando(true);
      const response = await clientesService.createCliente(clienteData);
      setMsg('Cliente guardado exitosamente ✅');
      
      // Recargar clientes
      await fetchClientes();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error creating cliente:', error);
      setMsg('Error al guardar cliente ❌');
      setCargando(false);
      throw error;
    }
  };

  // Actualizar cliente
  const updateCliente = async (id, clienteData) => {
    try {
      setCargando(true);
      const response = await clientesService.updateCliente(id, clienteData);
      setMsg('Cliente actualizado exitosamente ✅');
      
      // Recargar clientes
      await fetchClientes();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error updating cliente:', error);
      setMsg('Error al actualizar cliente ❌');
      setCargando(false);
      throw error;
    }
  };

  // Eliminar cliente
  const deleteCliente = async (id) => {
    try {
      setCargando(true);
      const response = await clientesService.deleteCliente(id);
      setMsg('Cliente eliminado exitosamente ✅');
      
      // Recargar clientes
      await fetchClientes();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error deleting cliente:', error);
      setMsg('Error al eliminar cliente ❌');
      setCargando(false);
      throw error;
    }
  };

  // Buscar clientes
  const searchClientes = async (term, limit = 10) => {
    try {
      const response = await clientesService.searchClientes(term, limit);
      return response.data || [];
    } catch (error) {
      console.error('Error searching clientes:', error);
      return [];
    }
  };

  // Limpiar mensaje
  const clearMessage = () => {
    setMsg('');
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadCurrentUser();
    fetchClientes();
  }, []);

  return {
    // Estados
    clientes,
    currentUser,
    cargando,
    msg,

    // Acciones
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    searchClientes,
    loadCurrentUser,
    clearMessage,

    // Setters
    setMsg,
    setClientes,
    setCurrentUser,
    setCargando
  };
};
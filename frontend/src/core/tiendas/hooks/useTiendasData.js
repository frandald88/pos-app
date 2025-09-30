import { useState, useCallback } from 'react';
import tiendasService from '../services/tiendasService';

export const useTiendasData = () => {
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');
  const [relacionesData, setRelacionesData] = useState(null);
  const [cargandoRelaciones, setCargandoRelaciones] = useState(false);

  // Cargar tiendas
  const fetchTiendas = useCallback(async (filters = {}) => {
    try {
      setCargando(true);
      
      // Por defecto, no incluir archivadas
      const apiFilters = {
        includeArchived: false,
        ...filters
      };
      
      const response = await tiendasService.getTiendas(apiFilters);
      
      // Si viene con estructura de respuesta con paginación
      if (response.tiendas) {
        setTiendas(response.tiendas);
      } else {
        // Si viene directamente como array
        const tiendasArray = Array.isArray(response) ? response : [];
        setTiendas(tiendasArray);
      }
      
      setCargando(false);
    } catch (error) {
      console.error('Error fetching tiendas:', error);
      setMsg('Error al cargar tiendas ❌');
      setCargando(false);
    }
  }, []);

  // Crear tienda
  const createTienda = async (tiendaData) => {
    try {
      setCargando(true);
      const response = await tiendasService.createTienda(tiendaData);
      setMsg('Tienda guardada exitosamente ✅');
      
      // Recargar tiendas
      await fetchTiendas();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error creating tienda:', error);
      setMsg('Error al guardar tienda ❌');
      setCargando(false);
      throw error;
    }
  };

  // Actualizar tienda
  const updateTienda = async (id, tiendaData) => {
    try {
      setCargando(true);
      const response = await tiendasService.updateTienda(id, tiendaData);
      setMsg('Tienda actualizada exitosamente ✅');
      
      // Recargar tiendas
      await fetchTiendas();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error updating tienda:', error);
      setMsg('Error al actualizar tienda ❌');
      setCargando(false);
      throw error;
    }
  };

  // Verificar relaciones de una tienda
  const checkTiendaRelationships = async (id) => {
    try {
      setCargandoRelaciones(true);
      const response = await tiendasService.getTiendaRelationships(id);
      setRelacionesData(response);
      setCargandoRelaciones(false);
      return response;
    } catch (error) {
      console.error('Error checking tienda relationships:', error);
      setMsg('Error al verificar relaciones ❌');
      setCargandoRelaciones(false);
      throw error;
    }
  };

  // Archivar tienda
  const archiveTienda = async (id) => {
    try {
      setCargando(true);
      const response = await tiendasService.archiveTienda(id);
      setMsg('Tienda archivada exitosamente ✅');
      
      // Recargar tiendas
      await fetchTiendas();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error archiving tienda:', error);
      setMsg('Error al archivar tienda ❌');
      setCargando(false);
      throw error;
    }
  };

  // Restaurar tienda
  const restoreTienda = async (id) => {
    try {
      setCargando(true);
      const response = await tiendasService.restoreTienda(id);
      setMsg('Tienda restaurada exitosamente ✅');
      
      // Recargar tiendas
      await fetchTiendas();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error restoring tienda:', error);
      setMsg('Error al restaurar tienda ❌');
      setCargando(false);
      throw error;
    }
  };

  // Eliminar tienda permanentemente
  const deleteTienda = async (id, forceDelete = false) => {
    try {
      setCargando(true);
      const response = await tiendasService.deleteTienda(id, forceDelete);
      
      if (forceDelete) {
        setMsg('Tienda eliminada permanentemente ✅');
      } else {
        setMsg('Tienda eliminada exitosamente ✅');
      }
      
      // Recargar tiendas
      await fetchTiendas();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error deleting tienda:', error);
      setMsg('Error al eliminar tienda ❌');
      setCargando(false);
      throw error;
    }
  };

  // Buscar tiendas
  const searchTiendas = async (term, limit = 10) => {
    try {
      const response = await tiendasService.searchTiendas(term, limit);
      return response.tiendas || response || [];
    } catch (error) {
      console.error('Error searching tiendas:', error);
      return [];
    }
  };

  // Limpiar mensaje
  const clearMessage = () => {
    setMsg('');
  };

  // Limpiar datos de relaciones
  const clearRelacionesData = () => {
    setRelacionesData(null);
  };

  // Efecto para cargar datos iniciales - REMOVIDO
  // Se manejará desde el componente para evitar conflictos

  return {
    // Estados
    tiendas,
    cargando,
    msg,
    relacionesData,
    cargandoRelaciones,

    // Acciones
    fetchTiendas,
    createTienda,
    updateTienda,
    checkTiendaRelationships,
    archiveTienda,
    restoreTienda,
    deleteTienda,
    searchTiendas,
    clearMessage,
    clearRelacionesData,

    // Setters
    setMsg,
    setTiendas,
    setCargando,
    setRelacionesData,
    setCargandoRelaciones
  };
};
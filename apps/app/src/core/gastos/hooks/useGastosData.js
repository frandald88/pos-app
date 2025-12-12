import { useState, useEffect } from 'react';
import gastosService from '../services/gastosService';

export const useGastosData = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingMsg, setEditingMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [defaultStore, setDefaultStore] = useState(null);
  const [canSelectMultipleStores, setCanSelectMultipleStores] = useState(true);
  const [proveedores, setProveedores] = useState([]);

  // Cargar usuario actual
  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      const userData = await gastosService.getCurrentUser();
      setCurrentUser(userData);
      console.log('Current user loaded:', userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setMsg('[ERROR] Error al cargar usuario');
    } finally {
      setUserLoaded(true);
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      const [storesResponse, proveedoresData] = await Promise.all([
        gastosService.getAvailableStores(),
        gastosService.getProviders()
      ]);

      // Extract data from response - backend returns {success, data: {stores, userRole, defaultStore}}
      const storesData = storesResponse?.data || storesResponse || {};
      const { stores = [], userRole = 'vendedor', defaultStore: userDefaultStore = null } = storesData;

      setAvailableStores(stores);
      // Extract array from response - service may return {success, data} or array directly
      const proveedoresArray = proveedoresData?.data || proveedoresData || [];
      setProveedores(Array.isArray(proveedoresArray) ? proveedoresArray : []);
      setCanSelectMultipleStores(userRole === 'admin');
      setDefaultStore(userDefaultStore);
      
      console.log('Available stores loaded:', stores);
      console.log('User role:', userRole);
      console.log('Default store:', userDefaultStore);
      console.log('Can select multiple stores:', userRole === 'admin');
      console.log('Proveedores loaded:', proveedoresData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMsg('[ERROR] Error al cargar datos iniciales');
      setAvailableStores([]);
      setProveedores([]);
      setCanSelectMultipleStores(false);
    }
  };

  // Cargar gastos según el rol del usuario
  const loadExpenses = async (filters = {}) => {
    try {
      setLoading(true);
      setMsg('');

      console.log('Loading expenses with filters:', filters);

      let response;

      // Admin usa /report con filtros, vendedor usa /mine (todos los gastos de su tienda)
      if (currentUser?.role === 'admin') {
        response = await gastosService.getReport(filters);
      } else {
        response = await gastosService.getMyExpenses(100);
      }

      console.log('Expenses response:', response);

      if (response) {
        let expenses = [];

        if (Array.isArray(response)) {
          expenses = response;
        } else if (response.success && response.data) {
          // Standard backend response: {success: true, data: {expenses: [...], summary: {...}}}
          if (Array.isArray(response.data)) {
            expenses = response.data;
          } else if (response.data.expenses && Array.isArray(response.data.expenses)) {
            expenses = response.data.expenses;
          }
        } else if (response.expenses && Array.isArray(response.expenses)) {
          expenses = response.expenses;
        } else if (response.data && Array.isArray(response.data)) {
          expenses = response.data;
        } else {
          console.error('Unexpected response structure:', response);
          setReportData([]);
          setMsg('Estructura de respuesta inesperada');
          return;
        }

        setReportData(expenses);
        setMsg(`[SUCCESS] Reporte cargado exitosamente - ${expenses.length} gastos encontrados`);
      } else {
        setReportData([]);
        setMsg('No se encontraron gastos');
      }

      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setReportData([]);
      setMsg('[ERROR] Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo gasto
  const createExpense = async (expenseData) => {
    try {
      setLoading(true);
      const response = await gastosService.createExpense(expenseData);
      console.log('Expense saved:', response);
      setMsg('[SUCCESS] Gasto guardado exitosamente');

      // Actualizar lista de proveedores y reporte (para todos los roles)
      await fetchProveedores();
      await loadExpenses();

      setTimeout(() => setMsg(''), 3000);
      return response;
    } catch (error) {
      console.error('Error saving expense:', error);
      if (error.response?.data?.message) {
        setMsg(`[ERROR] ${error.response.data.message}`);
      } else {
        setMsg('[ERROR] Error al guardar gasto');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado del gasto
  const updateExpenseStatus = async (gastoId, status, nota = '') => {
    try {
      setLoading(true);
      setEditingMsg('');
      
      const response = await gastosService.updateStatus(gastoId, status, nota);
      console.log('Status updated:', response);
      setEditingMsg('[SUCCESS] Estado actualizado exitosamente');

      await loadExpenses();
      setTimeout(() => setEditingMsg(''), 3000);
      return response;
    } catch (error) {
      console.error('Error updating status:', error);
      setEditingMsg('[ERROR] Error al actualizar estado');
      setTimeout(() => setEditingMsg(''), 3000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar gasto
  const deleteExpense = async (gastoId) => {
    try {
      setLoading(true);
      const response = await gastosService.deleteExpense(gastoId);
      console.log('Expense deleted:', response);
      setMsg('[SUCCESS] Gasto eliminado exitosamente');

      await loadExpenses();
      setTimeout(() => setMsg(''), 3000);
      return response;
    } catch (error) {
      console.error('Error deleting expense:', error);
      setMsg('[ERROR] Error al eliminar gasto');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar proveedores
  const searchProviders = async (query) => {
    try {
      const response = await gastosService.searchProviders(query);
      // Extract array from response
      const providers = response?.data || response || [];
      return Array.isArray(providers) ? providers : [];
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      return [];
    }
  };

  // Actualizar lista de proveedores
  const fetchProveedores = async () => {
    try {
      const providers = await gastosService.getProviders();
      // Extract array from response
      const proveedoresArray = providers?.data || providers || [];
      setProveedores(Array.isArray(proveedoresArray) ? proveedoresArray : []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  // Ver evidencia
  const viewEvidence = async (filename) => {
    try {
      setLoading(true);
      setMsg('Cargando evidencia...');
      
      const response = await gastosService.getEvidence(filename);
      
      const getContentType = (filename) => {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'txt': 'text/plain'
        };
        return mimeTypes[extension] || 'application/octet-stream';
      };

      const contentType = getContentType(filename);
      const blob = new Blob([response], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      if (contentType.startsWith('image/')) {
        const newWindow = window.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #f0f0f0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                background: white; 
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <img src="${url}" alt="${filename}" />
          </body>
          </html>
        `);
      } else if (contentType === 'application/pdf') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMsg('[SUCCESS] Archivo descargado');
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 10000);

      if (contentType.startsWith('image/') || contentType === 'application/pdf') {
        setMsg('[SUCCESS] Evidencia abierta exitosamente');
      }
    } catch (error) {
      console.error('Error viewing evidencia:', error);
      if (error.response?.status === 401) {
        setMsg('[ERROR] Error de autenticación');
      } else if (error.response?.status === 404) {
        setMsg('[ERROR] Archivo no encontrado');
      } else {
        setMsg('[ERROR] Error al cargar evidencia');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar usuario al montar el componente
  useEffect(() => {
    loadCurrentUser();
    loadInitialData();
  }, []);

  // Efecto para cargar gastos cuando el usuario esté cargado (para admin y vendedor)
  useEffect(() => {
    if (userLoaded && currentUser?.role) {
      loadExpenses();
    }
  }, [userLoaded, currentUser]);

  return {
    // Estados
    loading,
    msg,
    editingMsg,
    currentUser,
    userLoaded,
    reportData,
    availableStores,
    defaultStore,
    canSelectMultipleStores,
    proveedores,
    
    // Acciones
    loadExpenses,
    createExpense,
    updateExpenseStatus,
    deleteExpense,
    searchProviders,
    fetchProveedores,
    viewEvidence,
    loadCurrentUser,
    loadInitialData,
    
    // Utilidades
    setMsg,
    setEditingMsg,
    setReportData,
    setProveedores
  };
};
import { useState, useCallback } from 'react';
import empleadosService from '../services/empleadosService';

export const useEmployeeHistoryData = () => {
  const [tiendas, setTiendas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Cargar tiendas
  const loadTiendas = useCallback(async () => {
    try {
      const response = await empleadosService.getAllTiendas();
      // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
      setTiendas(response.data.tiendas);
    } catch (error) {
      setMsg(`Error cargando tiendas: ${error.response?.data?.message || error.message}`);
    }
  }, []);

  // Cargar ranking de faltas
  const loadRanking = useCallback(async (params) => {
    const { rankStartDate, rankEndDate, selectedTienda } = params;

    if (!rankStartDate || !rankEndDate) {
      setMsg('Selecciona rango de fechas para el ranking ❌');
      return;
    }

    setLoading(true);
    try {
      const requestParams = {
        startDate: rankStartDate,
        endDate: rankEndDate
      };

      if (selectedTienda) {
        requestParams.tiendaId = selectedTienda;
      }

      const data = await empleadosService.getRankingFaltas(requestParams);
      setRanking(data);
      setMsg('Ranking generado exitosamente ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      setMsg(`Error al cargar ranking: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar ranking
  const clearRanking = useCallback(() => {
    setRanking([]);
    setMsg('');
  }, []);

  return {
    // Estados
    tiendas,
    ranking,
    loading,
    msg,

    // Acciones
    loadTiendas,
    loadRanking,
    clearRanking,

    // Setters
    setMsg,
    setRanking
  };
};

import { useState, useEffect } from 'react';
import { useTurno } from '../hooks/useTurno';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function IniciarTurnoModal({ onClose, onSuccess }) {
  const [efectivoInicial, setEfectivoInicial] = useState('');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [notasApertura, setNotasApertura] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingSales, setPendingSales] = useState(null);
  const [loadingPending, setLoadingPending] = useState(false);
  const { iniciarTurno } = useTurno();

  useEffect(() => {
    fetchTiendas();
  }, []);

  // Cargar ventas pendientes cuando se selecciona una tienda
  useEffect(() => {
    if (tiendaSeleccionada) {
      fetchPendingSales(tiendaSeleccionada);
    }
  }, [tiendaSeleccionada]);

  const fetchTiendas = async () => {
    try {
      const token = localStorage.getItem('token');
      // Usar el nuevo endpoint que filtra tiendas según el rol del usuario
      const response = await axios.get(`${API_URL}/api/turnos/tiendas-disponibles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tiendasData = response.data.data.tiendas || [];
      setTiendas(tiendasData);

      // Seleccionar la primera tienda por defecto
      if (tiendasData.length > 0) {
        setTiendaSeleccionada(tiendasData[0]._id);
      } else {
        setError('No tienes tiendas asignadas. Contacta al administrador');
      }
    } catch (err) {
      console.error('Error al cargar tiendas:', err);
      setError('No se pudieron cargar las tiendas');
    }
  };

  const fetchPendingSales = async (tiendaId) => {
    try {
      setLoadingPending(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sales/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tiendaId }
      });

      if (response.data.success) {
        setPendingSales(response.data.data.pendingSales);
      }
    } catch (err) {
      console.error('Error al cargar ventas pendientes:', err);
      // No mostrar error al usuario, solo en consola
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!efectivoInicial || parseFloat(efectivoInicial) < 0) {
      setError('El efectivo inicial debe ser mayor o igual a 0');
      return;
    }

    if (!tiendaSeleccionada) {
      setError('Debes seleccionar una tienda');
      return;
    }

    setLoading(true);
    setError('');

    const result = await iniciarTurno(
      parseFloat(efectivoInicial),
      tiendaSeleccionada,
      notasApertura
    );

    setLoading(false);

    if (result.success) {
      onSuccess(result.turno);
    } else {
      setError(result.error || 'Error al iniciar turno');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(35, 51, 78, 0.7)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#23334e' }}>
            🚀 Iniciar Turno
          </h2>
          <p className="text-sm mt-1" style={{ color: '#697487' }}>
            Ingresa la información inicial del turno
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border-l-4 border-red-500 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Tienda */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#23334e' }}>
                🏪 Tienda
              </label>
              {tiendas.length === 0 ? (
                <div className="p-3 rounded-lg border-2 border-yellow-300 bg-yellow-50">
                  <p className="text-sm text-yellow-800">No tienes tiendas asignadas</p>
                </div>
              ) : tiendas.length === 1 ? (
                <div className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50">
                  <p className="text-sm font-semibold text-blue-900">{tiendas[0].nombre}</p>
                  <p className="text-xs text-blue-700 mt-1">Esta es tu tienda asignada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tiendas.map((tienda) => (
                    <button
                      key={tienda._id}
                      type="button"
                      onClick={() => setTiendaSeleccionada(tienda._id)}
                      className="w-full px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all active:scale-95"
                      style={tiendaSeleccionada === tienda._id
                        ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e', color: 'white' }
                        : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                      }
                    >
                      {tienda.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Efectivo Inicial */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#23334e' }}>
                💵 Efectivo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={efectivoInicial}
                onChange={(e) => setEfectivoInicial(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border-2 rounded-lg text-base font-medium"
                style={{ borderColor: '#cbd5e1', color: '#23334e' }}
                required
              />
            </div>

            {/* Notas de Apertura (opcional) */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#23334e' }}>
                📝 Notas (Opcional)
              </label>
              <textarea
                value={notasApertura}
                onChange={(e) => setNotasApertura(e.target.value)}
                placeholder="Alguna observación al abrir el turno..."
                rows={3}
                className="w-full px-4 py-3 border-2 rounded-lg text-sm"
                style={{ borderColor: '#cbd5e1', color: '#23334e' }}
              />
            </div>
          </div>

          {/* Advertencia de ventas pendientes */}
          {loadingPending ? (
            <div className="mb-4 p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Verificando ventas pendientes...</span>
              </div>
            </div>
          ) : pendingSales && pendingSales.total > 0 ? (
            <div className="mb-4 p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Ventas Pendientes Detectadas
                  </h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Hay {pendingSales.total} {pendingSales.total === 1 ? 'venta pendiente' : 'ventas pendientes'} en esta tienda:
                  </p>
                  <div className="space-y-1 text-sm text-orange-800">
                    {pendingSales.en_preparacion > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">👨‍🍳 {pendingSales.en_preparacion}</span>
                        <span>en preparación</span>
                      </div>
                    )}
                    {pendingSales.listo_para_envio > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">📦 {pendingSales.listo_para_envio}</span>
                        <span>listo para entrega</span>
                      </div>
                    )}
                    {pendingSales.enviado > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">🚚 {pendingSales.enviado}</span>
                        <span>enviada{pendingSales.enviado > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-orange-700 mt-3 italic">
                    Al abrir el turno, estas ventas estarán disponibles para continuar procesándolas.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-md active:scale-95"
              style={{ backgroundColor: '#e5e7eb', color: '#697487' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || tiendas.length === 0}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm text-white transition-all hover:shadow-md active:scale-95"
              style={{ background: (loading || tiendas.length === 0) ? '#8c95a4' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {loading ? 'Iniciando...' : tiendas.length === 0 ? 'Sin tiendas' : 'Iniciar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

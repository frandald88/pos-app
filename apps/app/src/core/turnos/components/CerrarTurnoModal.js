import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTurno } from '../hooks/useTurno';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function CerrarTurnoModal({ turno, onClose, onSuccess }) {
  const [efectivoFinal, setEfectivoFinal] = useState('');
  const [notasCierre, setNotasCierre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [pendingSales, setPendingSales] = useState(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const { cerrarTurno } = useTurno();

  // Obtener el ID y nombre del usuario actual desde el token
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
        setCurrentUsername(payload.username || 'Usuario');
      }
    } catch (err) {
      console.error('Error al decodificar token:', err);
    }
  }, []);

  // Cargar ventas pendientes al abrir el modal
  useEffect(() => {
    const fetchPendingSales = async () => {
      if (!turno?.tienda?._id) return;

      try {
        setLoadingPending(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/sales/pending`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tiendaId: turno.tienda._id }
        });

        if (response.data.success) {
          setPendingSales(response.data.data.pendingSales);
        }
      } catch (err) {
        console.error('Error al cargar ventas pendientes:', err);
      } finally {
        setLoadingPending(false);
      }
    };

    fetchPendingSales();
  }, [turno?.tienda?._id]);

  // Verificar si el turno fue abierto por el usuario actual
  const esTurnoPropio = turno?.usuario?._id === currentUserId;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!efectivoFinal || parseFloat(efectivoFinal) < 0) {
      setError('El efectivo final debe ser mayor o igual a 0');
      return;
    }

    setLoading(true);
    setError('');

    const result = await cerrarTurno(
      turno._id,
      parseFloat(efectivoFinal),
      notasCierre
    );

    setLoading(false);

    if (result.success) {
      onSuccess(result.turno);
    } else {
      // Mostrar error específico sin redirigir
      const errorMsg = result.error || 'Error al cerrar turno';
      setError(errorMsg);
      console.error('❌ Error al cerrar turno:', errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(35, 51, 78, 0.7)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#23334e' }}>
            🔒 Cerrar Turno
          </h2>
          <p className="text-sm mt-1" style={{ color: '#697487' }}>
            Registra el efectivo final y cierra el turno
          </p>
        </div>

        {/* Información si el turno no es propio */}
        {!esTurnoPropio && (
          <div className="mb-4 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
            <p className="text-sm font-semibold text-blue-900">
              ℹ️ Este turno fue abierto por {turno.usuario?.username}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Estás cerrando el turno como: {currentUsername}
            </p>
          </div>
        )}

        {/* Información del turno */}
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#697487' }}>👤 Usuario:</span>
              <span className="font-semibold" style={{ color: '#23334e' }}>
                {turno.usuario?.username || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#697487' }}>🏪 Tienda:</span>
              <span className="font-semibold" style={{ color: '#23334e' }}>
                {turno.tienda?.nombre || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#697487' }}>🕐 Inicio:</span>
              <span className="font-semibold" style={{ color: '#23334e' }}>
                {formatDate(turno.fechaApertura)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#697487' }}>💵 Efectivo Inicial:</span>
              <span className="font-semibold" style={{ color: '#23334e' }}>
                {formatCurrency(turno.efectivoInicial)}
              </span>
            </div>
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
                  Estas ventas seguirán disponibles cuando se abra el próximo turno.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="mb-4 p-3 rounded-lg border-l-4 border-red-500 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Efectivo Final */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#23334e' }}>
                💰 Efectivo Final
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={efectivoFinal}
                onChange={(e) => setEfectivoFinal(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border-2 rounded-lg text-base font-medium"
                style={{ borderColor: '#cbd5e1', color: '#23334e' }}
                required
                autoFocus
              />
            </div>

            {/* Notas de Cierre (opcional) */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#23334e' }}>
                📝 Notas de Cierre (Opcional)
              </label>
              <textarea
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Alguna observación al cerrar el turno..."
                rows={3}
                className="w-full px-4 py-3 border-2 rounded-lg text-sm"
                style={{ borderColor: '#cbd5e1', color: '#23334e' }}
              />
            </div>
          </div>

          {/* Advertencia */}
          <div className="mb-6 p-3 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
            <p className="text-sm text-yellow-800">
              ⚠️ Al cerrar el turno se generará el reporte de corte de caja. Esta acción no se puede deshacer.
            </p>
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm text-white transition-all hover:shadow-md active:scale-95"
              style={{ background: loading ? '#8c95a4' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              {loading ? 'Cerrando...' : 'Cerrar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

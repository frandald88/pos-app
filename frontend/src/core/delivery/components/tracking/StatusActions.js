import { useState, useEffect } from 'react';
import axios from 'axios';
import { usePrintComanda } from '../../../../shared/components/PrintComanda';
import { usePrintTicket } from '../../../../shared/components/PrintTicket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function StatusActions({
  sale,
  updatingOrderId,
  updateStatus,
  formatCurrency,
  formatDate,
  turnoActivo // ⭐ Recibir turno activo como prop desde OrderTrackingPage
}) {
  const { printComanda } = usePrintComanda();
  const { printTicket } = usePrintTicket();

  // Estados para el selector de repartidor
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState(sale.deliveryPerson?._id || '');
  const [loadingDeliveryUsers, setLoadingDeliveryUsers] = useState(false);
  const [assigningDeliveryPerson, setAssigningDeliveryPerson] = useState(false);

  // Cargar repartidores disponibles por tienda cuando el estado es listo_para_envio y tipo domicilio
  useEffect(() => {
    if (sale.status === 'listo_para_envio' && sale.type === 'domicilio' && sale.tienda?._id) {
      fetchDeliveryUsers();
    }
  }, [sale.status, sale.type, sale.tienda]);

  const fetchDeliveryUsers = async () => {
    try {
      setLoadingDeliveryUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          role: 'repartidor',
          tienda: sale.tienda._id
        }
      });

      // El backend ya filtra por role y tienda, solo usar los datos directamente
      const users = response.data || [];
      console.log('Repartidores disponibles:', users);
      setDeliveryUsers(users);
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
      alert('Error al cargar repartidores. Verifica la consola para más detalles.');
    } finally {
      setLoadingDeliveryUsers(false);
    }
  };

  // Función para asignar repartidor
  const handleAssignDeliveryPerson = async () => {
    if (!selectedDeliveryPerson) {
      alert('Por favor selecciona un repartidor');
      return;
    }

    try {
      setAssigningDeliveryPerson(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/api/sales/${sale._id}/delivery-person`,
        { deliveryPerson: selectedDeliveryPerson },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el objeto sale localmente con los datos del repartidor
      if (response.data.success && response.data.data.sale) {
        // Actualizar la venta con el nuevo repartidor
        sale.deliveryPerson = response.data.data.sale.deliveryPerson;

        // Mostrar mensaje de éxito
        const repartidorNombre = deliveryUsers.find(u => u._id === selectedDeliveryPerson);
        alert(`✅ Repartidor ${repartidorNombre?.username || ''} asignado correctamente`);

        // Forzar re-render actualizando el estado
        setAssigningDeliveryPerson(false);

        // No recargar la página - solo actualizar localmente
        // El componente se re-renderizará automáticamente con el nuevo deliveryPerson
      } else {
        throw new Error('No se pudo asignar el repartidor');
      }
    } catch (error) {
      console.error('Error al asignar repartidor:', error);
      alert('❌ Error al asignar repartidor. Intenta de nuevo.');
      setAssigningDeliveryPerson(false);
    }
  };
  
  if (sale.status === "parcialmente_devuelta") {
    return (
      <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
        <div className="flex items-center gap-2 text-orange-700 mb-2">
          <span className="text-lg">↩️</span>
          <span className="font-medium">
            Devolución parcial de {formatCurrency(sale.totalReturned)} • Restante: {formatCurrency(sale.total - sale.totalReturned)}
          </span>
        </div>
        {sale.returnedBy && (
          <div className="text-sm text-orange-600 ml-6">
            Procesada por: <span className="font-medium">{sale.returnedBy.username}</span>
            {sale.returnedDate && (
              <span className="ml-2">
                • {formatDate(sale.returnedDate)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (sale.totalReturned > 0 && sale.status === "cancelada") {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <span className="text-lg">🔄</span>
          <span className="font-medium">
            Esta venta fue cancelada debido a una devolución total de {formatCurrency(sale.totalReturned)}
          </span>
        </div>
        {sale.returnedBy && (
          <div className="text-sm text-orange-600 ml-6">
            Procesada por: <span className="font-medium">{sale.returnedBy.username}</span>
            {sale.returnedDate && (
              <span className="ml-2">
                • {formatDate(sale.returnedDate)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Función para reimprimir comanda
  const handlePrintComanda = () => {
    const comandaData = {
      _id: sale._id,
      folio: sale.folio, // ⭐ Usar folio consecutivo del backend
      fecha: sale.date,
      total: sale.total,
      tipo: sale.type,
      items: sale.items.map(item => ({
        cantidad: item.quantity,
        precio: item.price,
        nombre: item.name,
        producto: { nombre: item.name },
        notas: item.note || ''
      })),
      usuario: sale.user || { username: 'N/A' },
      cliente: sale.cliente || null,
      tienda: sale.tienda || { nombre: 'N/A' }
    };
    printComanda(comandaData);
  };

  // Función para imprimir ticket de venta
  const handlePrintTicket = () => {
    const ticketData = {
      _id: sale._id,
      folio: sale.folio, // ⭐ Usar folio consecutivo del backend
      fecha: sale.date,
      total: sale.total,
      subtotal: sale.total - (sale.discount || 0),
      descuento: sale.discount || 0,
      metodoPago: sale.paymentType === 'single'
        ? (sale.method === 'efectivo' ? 'Efectivo' :
           sale.method === 'transferencia' ? 'Transferencia' : 'Tarjeta')
        : 'Pago mixto',
      items: sale.items.map(item => ({
        cantidad: item.quantity,
        precio: item.price,
        nombre: item.name,
        producto: { nombre: item.name },
        notas: item.note || ''
      })),
      usuario: sale.user || { nombre: 'N/A' },
      cliente: sale.cliente || null,
      type: sale.type || sale.tipo, // ⭐ Tipo de venta para mostrar dirección en domicilio
      tienda: sale.tienda || { nombre: 'MI NEGOCIO', direccion: '', telefono: '' }
    };
    printTicket(ticketData);
  };

  if (sale.status === "en_preparacion") {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => updateStatus(sale._id, "listo_para_envio")}
          className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
          style={{ backgroundColor: '#3b82f6' }}
          disabled={updatingOrderId === sale._id}
        >
          {updatingOrderId === sale._id ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Procesando...
            </div>
          ) : (
            "📦 Listo para Entrega"
          )}
        </button>

        {/* Botón para reimprimir comanda */}
        <button
          onClick={handlePrintComanda}
          className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
        >
          👨‍🍳 Reimprimir Comanda
        </button>

        <button
          onClick={() => updateStatus(sale._id, "cancelada")}
          className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-lg hover:bg-red-600"
          disabled={updatingOrderId === sale._id}
        >
          ❌ Cancelar Pedido
        </button>
      </div>
    );
  }

  if (sale.status === "listo_para_envio") {
    const hasDeliveryPerson = sale.deliveryPerson && sale.deliveryPerson._id;
    const canMarkAsDelivered = turnoActivo !== null;

    // Para ventas a domicilio, SIEMPRE requiere repartidor para avanzar
    const requiresDeliveryPerson = sale.type === "domicilio";
    const canProceed = requiresDeliveryPerson ? (hasDeliveryPerson && canMarkAsDelivered) : canMarkAsDelivered;

    return (
      <div className="space-y-3">
        {/* Selector de repartidor para domicilio */}
        {sale.type === "domicilio" && !hasDeliveryPerson && (
          <div className="p-4 rounded-lg border-2 border-yellow-400 bg-yellow-50">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 mb-2">Asignar Repartidor</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Debe asignar un repartidor antes de continuar con esta venta a domicilio
                </p>
                <div className="flex gap-2">
                  <select
                    value={selectedDeliveryPerson}
                    onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                    className="flex-1 px-3 py-2 border border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    disabled={loadingDeliveryUsers}
                  >
                    <option value="">-- Seleccionar Repartidor --</option>
                    {deliveryUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} {user.nombre ? `- ${user.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignDeliveryPerson}
                    disabled={!selectedDeliveryPerson || assigningDeliveryPerson}
                    className="px-4 py-2 rounded-lg font-medium text-white transition-all"
                    style={{
                      backgroundColor: selectedDeliveryPerson && !assigningDeliveryPerson ? '#10b981' : '#9ca3af',
                      cursor: selectedDeliveryPerson && !assigningDeliveryPerson ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {assigningDeliveryPerson ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia si es domicilio sin repartidor y hay turno activo */}
        {sale.type === "domicilio" && !hasDeliveryPerson && canMarkAsDelivered && (
          <div className="p-4 rounded-lg border-2 border-orange-400 bg-orange-50">
            <div className="flex items-center gap-2 text-orange-700">
              <span className="text-xl">🚚</span>
              <span className="font-medium">
                Esta es una venta a domicilio. Debes asignar un repartidor antes de marcar como enviado o entregado.
              </span>
            </div>
          </div>
        )}

        {/* Advertencia si no hay turno activo */}
        {!canMarkAsDelivered && (
          <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-xl">🔒</span>
              <span className="font-medium">
                No se puede marcar como entregado sin un turno activo. Debes iniciar un turno primero.
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {sale.type === "domicilio" && (
            <button
              onClick={() => updateStatus(sale._id, "enviado")}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{
                backgroundColor: hasDeliveryPerson ? '#8b5cf6' : '#9ca3af',
                cursor: hasDeliveryPerson ? 'pointer' : 'not-allowed'
              }}
              disabled={updatingOrderId === sale._id || !hasDeliveryPerson}
              title={!hasDeliveryPerson ? 'Debe asignar un repartidor primero' : ''}
            >
              {updatingOrderId === sale._id ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                "🚚 Marcar como Enviado"
              )}
            </button>
          )}
          <button
            onClick={() => updateStatus(sale._id, "entregado_y_cobrado")}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            style={{
              backgroundColor: canProceed ? '#10b981' : '#9ca3af',
              cursor: canProceed ? 'pointer' : 'not-allowed'
            }}
            disabled={updatingOrderId === sale._id || !canProceed}
            title={
              !canMarkAsDelivered ? 'Debe haber un turno activo para marcar como entregado' :
              (requiresDeliveryPerson && !hasDeliveryPerson) ? 'Debe asignar un repartidor primero para ventas a domicilio' : ''
            }
          >
            ✅ Marcar como Entregado
          </button>

          {/* Botón para imprimir ticket */}
          <button
            onClick={handlePrintTicket}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            🧾 Imprimir Ticket
          </button>

          <button
            onClick={() => updateStatus(sale._id, "cancelada")}
            className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-lg hover:bg-red-600"
            disabled={updatingOrderId === sale._id}
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (sale.status === "enviado") {
    const canMarkAsDelivered = turnoActivo !== null;

    return (
      <div className="space-y-3">
        {/* Advertencia si no hay turno activo */}
        {!canMarkAsDelivered && (
          <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-xl">🔒</span>
              <span className="font-medium">
                No se puede marcar como entregado sin un turno activo. Debes iniciar un turno primero.
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => updateStatus(sale._id, "entregado_y_cobrado")}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            style={{
              backgroundColor: canMarkAsDelivered ? '#10b981' : '#9ca3af',
              cursor: canMarkAsDelivered ? 'pointer' : 'not-allowed'
            }}
            disabled={updatingOrderId === sale._id || !canMarkAsDelivered}
            title={!canMarkAsDelivered ? 'Debe haber un turno activo para marcar como entregado' : ''}
          >
            {updatingOrderId === sale._id ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Confirmando...
              </div>
            ) : (
              "✅ Confirmar Entrega"
            )}
          </button>

          {/* Botón para imprimir ticket */}
          <button
            onClick={handlePrintTicket}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            🧾 Imprimir Ticket
          </button>
        </div>
      </div>
    );
  }

  return null;
}
import React from 'react';
import { usePrintComanda } from '../../../shared/components/PrintComanda';
import { usePrintTicket } from '../../../shared/components/PrintTicket';

const SuccessModal = ({ isOpen, saleDetails, onClose }) => {
  const { printComanda } = usePrintComanda();
  const { printTicket } = usePrintTicket();

  if (!isOpen || !saleDetails) return null;

  // Función para imprimir la comanda de cocina
  const handlePrintComanda = () => {
    // Transformar saleDetails al formato esperado por PrintComanda
    const comandaData = {
      _id: saleDetails.id,
      folio: saleDetails.folio, // ⭐ Usar folio consecutivo del backend
      fecha: saleDetails.fecha || new Date(),
      total: saleDetails.total,
      tipo: saleDetails.type, // mostrador, domicilio, recoger

      // Transformar items al formato de la comanda
      items: (saleDetails.itemsDetalle || []).map(item => ({
        cantidad: item.quantity,
        precio: item.price,
        nombre: item.name,
        producto: {
          nombre: item.name
        },
        notas: item.note || ''
      })),

      // Usuario que registró la venta - usar el del backend si existe
      usuario: saleDetails.usuario || {
        nombre: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).nombre : 'Cajero',
        username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'cajero'
      },

      // Cliente
      cliente: saleDetails.cliente !== 'Cliente general' ? {
        nombre: saleDetails.cliente
      } : null,

      // Información de la tienda
      tienda: saleDetails.tienda || {
        nombre: 'MI RESTAURANTE',
        direccion: 'Dirección del negocio',
        telefono: '(XXX) XXX-XXXX'
      }
    };

    printComanda(comandaData);
  };

  // Función para imprimir el ticket de venta (para el cliente)
  const handlePrintTicket = () => {
    // Transformar saleDetails al formato esperado por PrintTicket
    const ticketData = {
      _id: saleDetails.id,
      folio: saleDetails.folio, // ⭐ Usar folio consecutivo del backend
      fecha: saleDetails.fecha || new Date(),
      total: saleDetails.total,
      subtotal: saleDetails.subtotal || saleDetails.total,
      descuento: saleDetails.descuento || 0,
      metodoPago: saleDetails.paymentType === 'single'
        ? (saleDetails.method === 'efectivo' ? 'Efectivo' :
           saleDetails.method === 'transferencia' ? 'Transferencia' : 'Tarjeta')
        : 'Pago mixto',
      pagoCon: saleDetails.amountPaid,

      // Transformar items al formato del ticket
      items: (saleDetails.itemsDetalle || []).map(item => ({
        cantidad: item.quantity,
        precio: item.price,
        nombre: item.name,
        producto: {
          nombre: item.name
        },
        notas: item.note || ''
      })),

      // Usuario - usar el del backend si existe
      usuario: saleDetails.usuario || {
        username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Cajero'
      },

      // Cliente - pasar objeto completo con dirección si existe
      cliente: saleDetails.clienteDetalle || (saleDetails.cliente !== 'Cliente general' ? {
        nombre: saleDetails.cliente,
        direccion: saleDetails.clienteDireccion || null
      } : null),

      // Tipo de venta
      type: saleDetails.type || saleDetails.tipo,

      // Información de la tienda
      tienda: saleDetails.tienda || {
        nombre: 'MI NEGOCIO',
        direccion: 'Dirección del negocio',
        telefono: '(XXX) XXX-XXXX',
        rfc: 'XXXXXXXXXXXXX'
      }
    };

    printTicket(ticketData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full transform transition-all duration-300 scale-100">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce" 
               style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#23334e' }}>
          ¡Venta Registrada! ✅
        </h2>
        <p className="text-center mb-6" style={{ color: '#697487' }}>
          La venta se ha procesado exitosamente
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>ID de Venta:</span>
            <span className="text-sm font-mono" style={{ color: '#23334e' }}>#{String(saleDetails.id).slice(-6)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>Cliente:</span>
            <span className="text-sm" style={{ color: '#23334e' }}>{saleDetails.cliente}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>Artículos:</span>
            <span className="text-sm" style={{ color: '#23334e' }}>{saleDetails.items} productos</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>Método de pago:</span>
            <span className="text-sm capitalize" style={{ color: '#23334e' }}>
              {saleDetails.paymentType === 'single' 
                ? (saleDetails.method === 'efectivo' ? '💵 Efectivo' : 
                   saleDetails.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta')
                : '🔀 Pago mixto'
              }
            </span>
          </div>

          {/* Mostrar detalles de pagos mixtos */}
          {saleDetails.paymentType === 'mixed' && saleDetails.mixedPayments && (
            <div className="border-t pt-2 mt-2">
              <span className="text-xs font-medium" style={{ color: '#46546b' }}>Detalles del pago:</span>
              {saleDetails.mixedPayments.map((payment, index) => (
                <div key={index} className="flex justify-between text-xs mt-1">
                  <span style={{ color: '#697487' }}>
                    {payment.method === 'efectivo' ? '💵' : payment.method === 'transferencia' ? '🏦' : '💳'} {payment.method}:
                  </span>
                  <span style={{ color: '#23334e' }}>${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>Tipo de venta:</span>
            <span className="text-sm capitalize" style={{ color: '#23334e' }}>
              {saleDetails.type === 'mostrador' ? '🏪 Mostrador' : 
               saleDetails.type === 'recoger' ? '📦 A recoger' : '🚚 A domicilio'}
            </span>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold" style={{ color: '#23334e' }}>Total:</span>
              <span className="text-lg font-bold" style={{ color: '#10b981' }}>${saleDetails.total.toFixed(2)}</span>
            </div>
            
            {saleDetails.change > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>Cambio:</span>
                <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>${saleDetails.change.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botones de impresión */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={handlePrintComanda}
            className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border hover:shadow-md"
            style={{
              color: '#fff',
              borderColor: '#f59e0b',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }}
            title="Imprimir comanda para cocina"
          >
            👨‍🍳 Comanda
          </button>

          <button
            onClick={handlePrintTicket}
            className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border hover:shadow-md"
            style={{
              color: '#fff',
              borderColor: '#10b981',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
            title="Imprimir ticket para cliente"
          >
            🧾 Ticket
          </button>
        </div>

        {/* Botón continuar */}
        <div>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
          >
            Continuar Vendiendo
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ color: '#8c95a4' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-b-2xl animate-pulse" 
             style={{ 
               width: '100%',
               animation: 'shrink 5s linear forwards'
             }}>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
import StatusActions from './StatusActions';

export default function OrderCard({ 
  sale, 
  statusConfig, 
  formatCurrency, 
  formatDate,
  updatingOrderId,
  updateStatus 
}) {
  
  return (
    <div className="bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl">
      {/* Header del pedido */}
      <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                Pedido #{sale._id.slice(-8)}
              </h3>
              <span
                className="px-3 py-1 text-sm rounded-full font-medium text-white"
                style={{ backgroundColor: statusConfig.color }}
              >
                {sale.status === 'parcialmente_devuelta' ? `↩️ ${statusConfig.label}` : 
                 sale.totalReturned > 0 && sale.status === 'cancelada' ? '🔄 Cancelada por Devolución' : 
                 `${statusConfig.icon} ${statusConfig.label}`}
              </span>
            </div>
            <p className="text-sm" style={{ color: '#697487' }}>
              {formatDate(sale.date)}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
              {formatCurrency(sale.total)}
            </div>
            {sale.discount > 0 && (
              <div className="text-sm text-green-600">
                Descuento: {formatCurrency(sale.discount)}
              </div>
            )}
            {sale.totalReturned > 0 && (
              <div className="text-sm text-orange-600">
                Devuelto: {formatCurrency(sale.totalReturned)}
                {sale.status === 'parcialmente_devuelta' && (
                  <div className="text-sm text-green-600">
                    Restante: {formatCurrency(sale.total - sale.totalReturned)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del pedido */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="text-sm font-medium" style={{ color: '#697487' }}>
              Tipo de Venta
            </div>
            <div className="font-bold" style={{ color: '#23334e' }}>
              {sale.type === 'domicilio' ? '🏠 A Domicilio' : 
               sale.type === 'mostrador' ? '🏪 Mostrador' :
               sale.type === 'recoger' ? '📦 A Recoger' : sale.type}
            </div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="text-sm font-medium" style={{ color: '#697487' }}>
              Método de Pago
            </div>
            <div className="font-bold" style={{ color: '#23334e' }}>
              {sale.paymentType === 'mixed' && sale.mixedPayments ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">🔄 Pago Mixto</span>
                  </div>
                  {sale.mixedPayments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span>
                        {payment.method === 'efectivo' ? '💵 Efectivo' : 
                         payment.method === 'tarjeta' ? '💳 Tarjeta' : 
                         payment.method === 'transferencia' ? '🏦 Transferencia' : payment.method}
                      </span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span>
                  {sale.method === 'efectivo' ? '💵 Efectivo' : 
                   sale.method === 'tarjeta' ? '💳 Tarjeta' : 
                   sale.method === 'transferencia' ? '🏦 Transferencia' : sale.method}
                </span>
              )}
            </div>
          </div>
          
          {sale.tienda?.nombre && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Tienda
              </div>
              <div className="font-bold" style={{ color: '#23334e' }}>
                🏪 {sale.tienda.nombre}
              </div>
            </div>
          )}
          
          {sale.cliente?.nombre && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Cliente
              </div>
              <div className="font-bold" style={{ color: '#23334e' }}>
                👤 {sale.cliente.nombre}
              </div>
            </div>
          )}
          
          {sale.deliveryPerson?.username && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Repartidor
              </div>
              <div className="font-bold" style={{ color: '#23334e' }}>
                🚚 {sale.deliveryPerson.username}
              </div>
            </div>
          )}
        </div>

        {/* Items del pedido */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
            Productos del Pedido
          </h4>
          <div className="space-y-3">
            {sale.items.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-start p-4 rounded-lg border"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium" style={{ color: '#23334e' }}>
                      {item.name}
                    </span>
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: '#e5e7eb', color: '#46546b' }}
                    >
                      x{item.quantity}
                    </span>
                  </div>
                  {item.note && (
                    <div className="text-sm italic p-2 rounded mt-2" style={{ color: '#697487', backgroundColor: '#f4f6fa' }}>
                      💬 {item.note}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: '#23334e' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    {formatCurrency(item.price)} c/u
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valor total del inventario */}
        <div className="mb-6 p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
          <div className="text-sm text-blue-800">
            💰 Valor total en stock: <span className="font-bold">{formatCurrency(sale.total)}</span>
          </div>
        </div>

        {/* Acciones según estado */}
        <StatusActions
          sale={sale}
          updatingOrderId={updatingOrderId}
          updateStatus={updateStatus}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}
import StatusActions from './StatusActions';

// SVG Icons
const Icons = {
  arrowReturn: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  refresh: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  home: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  store: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  package: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  cash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  creditCard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  bank: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  user: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  truck: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  chat: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  currencyDollar: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function OrderCard({
  sale,
  statusConfig,
  formatCurrency,
  formatDate,
  updatingOrderId,
  updateStatus,
  turnoActivo
}) {
  
  return (
    <div className="bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl">
      {/* Header del pedido */}
      <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                Pedido #{sale.folio || sale._id.slice(-8)}
              </h3>
              <span
                className="px-3 py-1 text-sm rounded-full font-medium text-white flex items-center gap-1.5"
                style={{ backgroundColor: statusConfig.color }}
              >
                {sale.status === 'parcialmente_devuelta' ? (
                  <><Icons.arrowReturn /> {statusConfig.label}</>
                ) : sale.totalReturned > 0 && sale.status === 'cancelada' ? (
                  <><Icons.refresh /> Cancelada por Devolución</>
                ) : (
                  <>{statusConfig.icon} {statusConfig.label}</>
                )}
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
            <div className="font-bold flex items-center gap-2" style={{ color: '#23334e' }}>
              {sale.type === 'domicilio' ? (
                <><Icons.home /> A Domicilio</>
              ) : sale.type === 'mostrador' ? (
                <><Icons.store /> Mostrador</>
              ) : sale.type === 'recoger' ? (
                <><Icons.package /> A Recoger</>
              ) : sale.type}
            </div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="text-sm font-medium" style={{ color: '#697487' }}>
              Método de Pago
            </div>
            <div className="font-bold" style={{ color: '#23334e' }}>
              {sale.paymentType === 'mixed' && sale.mixedPayments ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icons.refresh />
                    <span className="text-sm">Pago Mixto</span>
                  </div>
                  {sale.mixedPayments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5">
                        {payment.method === 'efectivo' ? (
                          <><Icons.cash /> Efectivo</>
                        ) : payment.method === 'tarjeta' ? (
                          <><Icons.creditCard /> Tarjeta</>
                        ) : payment.method === 'transferencia' ? (
                          <><Icons.bank /> Transferencia</>
                        ) : payment.method}
                      </span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="flex items-center gap-1.5">
                  {sale.method === 'efectivo' ? (
                    <><Icons.cash /> Efectivo</>
                  ) : sale.method === 'tarjeta' ? (
                    <><Icons.creditCard /> Tarjeta</>
                  ) : sale.method === 'transferencia' ? (
                    <><Icons.bank /> Transferencia</>
                  ) : sale.method}
                </span>
              )}
            </div>
          </div>
          
          {sale.tienda?.nombre && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Tienda
              </div>
              <div className="font-bold flex items-center gap-2" style={{ color: '#23334e' }}>
                <Icons.store /> {sale.tienda.nombre}
              </div>
            </div>
          )}
          
          {sale.cliente?.nombre && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Cliente
              </div>
              <div className="font-bold flex items-center gap-2" style={{ color: '#23334e' }}>
                <Icons.user /> {sale.cliente.nombre}
              </div>
            </div>
          )}
          
          {sale.deliveryPerson?.username && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                Repartidor
              </div>
              <div className="font-bold flex items-center gap-2" style={{ color: '#23334e' }}>
                <Icons.truck /> {sale.deliveryPerson.username}
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
                    <div className="text-sm italic p-2 rounded mt-2 flex items-start gap-2" style={{ color: '#697487', backgroundColor: '#f4f6fa' }}>
                      <Icons.chat />
                      <span>{item.note}</span>
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
          <div className="text-sm text-blue-800 flex items-center gap-2">
            <Icons.currencyDollar />
            <span>Valor total en stock: <span className="font-bold">{formatCurrency(sale.total)}</span></span>
          </div>
        </div>

        {/* Acciones según estado */}
        <StatusActions
          sale={sale}
          updatingOrderId={updatingOrderId}
          updateStatus={updateStatus}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          turnoActivo={turnoActivo}
        />
      </div>
    </div>
  );
}
export default function StatusActions({ 
  sale, 
  updatingOrderId, 
  updateStatus, 
  formatCurrency,
  formatDate 
}) {
  
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
    return (
      <div className="flex flex-wrap gap-3">
        {sale.type === "domicilio" && (
          <button
            onClick={() => updateStatus(sale._id, "enviado")}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            style={{ backgroundColor: '#8b5cf6' }}
            disabled={updatingOrderId === sale._id}
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
          style={{ backgroundColor: '#10b981' }}
          disabled={updatingOrderId === sale._id}
        >
          ✅ Marcar como Entregado
        </button>
        <button
          onClick={() => updateStatus(sale._id, "cancelada")}
          className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-lg hover:bg-red-600"
          disabled={updatingOrderId === sale._id}
        >
          ❌ Cancelar
        </button>
      </div>
    );
  }

  if (sale.status === "enviado") {
    return (
      <button
        onClick={() => updateStatus(sale._id, "entregado_y_cobrado")}
        className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
        style={{ backgroundColor: '#10b981' }}
        disabled={updatingOrderId === sale._id}
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
    );
  }

  return null;
}
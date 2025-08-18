import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function OrderTrackingPage() {
  const [sales, setSales] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("en_preparacion");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");
  const [allSales, setAllSales] = useState([]); 

  const fetchSales = () => {
  setLoading(true);
  setError("");
  
  // Cargar todas las ventas una vez
  axios
    .get(`${apiBaseUrl}/api/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      let allSalesData = [];
      
      if (res.data && res.data.sales) {
        allSalesData = res.data.sales;
      } else if (Array.isArray(res.data)) {
        allSalesData = res.data;
      }
      
      setAllSales(allSalesData); // Para estadísticas
      
      // Filtrar por estado seleccionado
      const filteredSales = allSalesData.filter(sale => sale.status === selectedStatus);
      setSales(filteredSales);
      
      console.log(`Loaded ${allSalesData.length} total sales, ${filteredSales.length} with status ${selectedStatus}`);
    })
    .catch((err) => {
      console.error("Error cargando ventas:", err);
      setSales([]);
      setAllSales([]);
      setError("Error al cargar las ventas");
    })
    .finally(() => {
      setLoading(false);
    });
};

  useEffect(() => {
    fetchSales();
  }, [selectedStatus]);

  const updateStatus = (saleId, newStatus) => {
    setUpdatingOrderId(saleId);
    setError("");
    
    console.log(`Updating sale ${saleId} to status ${newStatus}`);
    
    axios
      .put(
        `${apiBaseUrl}/api/sales/${saleId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('Status update response:', response.data);
        fetchSales();
      })
      .catch((err) => {
        console.error("Error actualizando estado:", err);
        setError("Error al actualizar el estado del pedido");
      })
      .finally(() => {
        setUpdatingOrderId(null);
      });
  };

  const statusOptions = [
    { value: "en_preparacion", label: "En preparación", icon: "⏳", color: "#f59e0b" },
    { value: "listo_para_envio", label: "Listo para entrega", icon: "📦", color: "#3b82f6" },
    { value: "enviado", label: "Enviado", icon: "🚚", color: "#8b5cf6" },
    { value: "entregado_y_cobrado", label: "Entregado", icon: "✅", color: "#10b981" },
    { value: "cancelada", label: "Cancelada", icon: "❌", color: "#ef4444" },
  ];

  const getStatusConfig = (status) => {
    const config = statusOptions.find(s => s.value === status);
    return config || { label: status, icon: "📋", color: "#6b7280" };
  };

  // Filtrar ventas por término de búsqueda
  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale._id.toLowerCase().includes(searchLower) ||
      sale.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      sale.tienda?.nombre?.toLowerCase().includes(searchLower) ||
      sale.items.some(item => item.name.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: '#23334e' }}
              >
                Seguimiento de Pedidos
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona y monitorea el estado de todos los pedidos en tiempo real
              </p>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="flex gap-4">
              {statusOptions.map((status) => {
                const count = allSales.filter(sale => sale.status === status.value).length;
                return (
                  <div 
                    key={status.value}
                    className="text-center p-3 bg-white rounded-lg shadow-sm border"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="text-xl">{status.icon}</div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {count}
                    </div>
                    <div className="text-xs" style={{ color: '#697487' }}>
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Controles de filtro y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  disabled={loading}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                    {filteredSales.length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    {loading ? "Cargando..." : "Pedidos"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Buscar pedidos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por ID, cliente, tienda o producto..."
                  className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
                <div className="absolute left-3 top-3.5">
                  <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
            <p style={{ color: '#697487' }}>Cargando pedidos...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              No hay pedidos
            </h3>
            <p style={{ color: '#697487' }}>
              {searchTerm 
                ? `No se encontraron resultados para "${searchTerm}"`
                : `No hay pedidos con estado "${getStatusConfig(selectedStatus).label}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSales.map((sale) => {
              const statusConfig = getStatusConfig(sale.status);
              
              return (
                <div key={sale._id} className="bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl">
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
                            {statusConfig.icon} {statusConfig.label}
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
                          {sale.type === 'domicilio' ? '🏠 Domicilio' : '🏪 En tienda'}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Método de Pago
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          {sale.method === 'efectivo' ? '💵 Efectivo' : 
                           sale.method === 'tarjeta' ? '💳 Tarjeta' : 
                           sale.method === 'transferencia' ? '🏦 Transferencia' : sale.method}
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

                    {/* Acciones según estado */}
                    <div className="flex flex-wrap gap-3">
                      {sale.status === "en_preparacion" && (
                        <>
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
                        </>
                      )}

                      {sale.status === "listo_para_envio" && (
                        <>
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
                        </>
                      )}

                      {sale.status === "enviado" && (
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
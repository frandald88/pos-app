import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    proveedor: "",
    producto: "",
    cantidad: "",
    unidad: "pza",
    fechaEmision: "",
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editFechaEntrega, setEditFechaEntrega] = useState("");
  const [editNota, setEditNota] = useState("");

  const token = localStorage.getItem("token");

  const fetchOrders = () => {
    setCargando(true);
    axios
      .get(`${apiBaseUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Backend response:', res.data);
        
        if (res.data && res.data.orders) {
          setOrders(res.data.orders);
        } else if (Array.isArray(res.data)) {
          setOrders(res.data);
        } else {
          console.error('Unexpected response format:', res.data);
          setOrders([]);
          setMsg("Formato de respuesta inesperado ❌");
        }
        setCargando(false);
      })
      .catch((error) => {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setMsg("Error al cargar órdenes ❌");
        setCargando(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!form.proveedor || !form.producto || !form.cantidad) {
      setMsg("Por favor completa todos los campos requeridos ❌");
      return;
    }

    setCargando(true);
    axios
      .post(`${apiBaseUrl}/api/orders`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log('Create response:', response.data);
        setMsg("Orden creada exitosamente ✅");
        setForm({ proveedor: "", producto: "", cantidad: "", unidad: "pza", fechaEmision: "" });
        setMostrarFormulario(false);
        fetchOrders();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Error creating order:', error);
        setMsg("Error al crear orden ❌");
        setCargando(false);
      });
  };

  const handleUpdate = () => {
    setCargando(true);
    axios
      .put(`${apiBaseUrl}/api/orders/${editingOrder._id}`, {
        status: editStatus,
        fechaEntrega: editFechaEntrega,
        nota: editNota,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log('Update response:', response.data);
        setMsg("Orden actualizada exitosamente ✅");
        setEditingOrder(null);
        setEditStatus("");
        setEditFechaEntrega("");
        setEditNota("");
        fetchOrders();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Error updating order:', error);
        setMsg("Error al actualizar orden ❌");
        setCargando(false);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta orden?")) {
      setCargando(true);
      axios
        .delete(`${apiBaseUrl}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          console.log('Delete response:', response.data);
          setMsg("Orden eliminada exitosamente ✅");
          fetchOrders();
          setTimeout(() => setMsg(""), 3000);
        })
        .catch((error) => {
          console.error('Error deleting order:', error);
          setMsg("Error al eliminar orden ❌");
          setCargando(false);
        });
    }
  };

  const statusOptions = [
    { value: "pendiente", label: "Pendiente", icon: "⏳", color: "#f59e0b" },
    { value: "completada", label: "Completada", icon: "✅", color: "#10b981" },
    { value: "cancelada", label: "Cancelada", icon: "❌", color: "#ef4444" },
  ];

  const unidadOptions = [
    { value: "pza", label: "Piezas", icon: "📦" },
    { value: "kg", label: "Kilogramos", icon: "⚖️" },
    { value: "lts", label: "Litros", icon: "🥤" },
    { value: "mxn", label: "Pesos MXN", icon: "💰" },
  ];

  const getStatusConfig = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, icon: "📋", color: "#6b7280" };
  };

  const getUnidadConfig = (unidad) => {
    return unidadOptions.find(u => u.value === unidad) || { label: unidad, icon: "📋" };
  };

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filtroStatus === "todos" || order.status === filtroStatus;
    const matchesSearch = searchTerm === "" || 
      order.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.nota && order.nota.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Estadísticas
  const getOrderStats = () => {
    return {
      total: orders.length,
      pendiente: orders.filter(o => o.status === "pendiente").length,
      completada: orders.filter(o => o.status === "completada").length,
      cancelada: orders.filter(o => o.status === "cancelada").length,
    };
  };

  const stats = getOrderStats();

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
                Órdenes de Compra
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona las órdenes de compra a proveedores y controla el inventario
              </p>
            </div>
            
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={cargando}
            >
              {mostrarFormulario ? "Cancelar" : "Nueva Orden"}
            </button>
          </div>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Formulario para nueva orden */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Crear Nueva Orden de Compra
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Proveedor *
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  placeholder="Nombre del proveedor"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Producto *
                </label>
                <input
                  type="text"
                  name="producto"
                  value={form.producto}
                  onChange={handleChange}
                  placeholder="Descripción del producto"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={form.cantidad}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Unidad
                </label>
                <select
                  name="unidad"
                  value={form.unidad}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                >
                  {unidadOptions.map(unidad => (
                    <option key={unidad.value} value={unidad.value}>
                      {unidad.icon} {unidad.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  name="fechaEmision"
                  value={form.fechaEmision}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={cargando}
              >
                {cargando ? "Creando..." : "Crear Orden"}
              </button>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                style={{ 
                  backgroundColor: '#8c95a4',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas y filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Estadísticas */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {stats.total}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Total Órdenes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendiente}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Pendientes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completada}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Completadas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.cancelada}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Canceladas
                </div>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por estado
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                >
                  <option value="todos">Todos los estados</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Buscar órdenes
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por proveedor, producto o nota..."
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
        </div>

        {/* Lista de órdenes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando órdenes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay órdenes
              </h3>
              <p style={{ color: '#697487' }}>
                {searchTerm || filtroStatus !== "todos"
                  ? "No se encontraron resultados para los filtros aplicados"
                  : "Comienza creando tu primera orden de compra"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const unidadConfig = getUnidadConfig(order.unidad);
                
                return (
                  <div 
                    key={order._id} 
                    className="border rounded-xl p-6 transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    {/* Header de la orden */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1" style={{ color: '#23334e' }}>
                          🏢 {order.proveedor}
                        </h3>
                        <p className="text-lg" style={{ color: '#46546b' }}>
                          📦 {order.producto}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span
                          className="px-4 py-2 text-sm rounded-full font-medium text-white"
                          style={{ backgroundColor: statusConfig.color }}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Detalles de la orden */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Cantidad
                        </div>
                        <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                          {unidadConfig.icon} {order.cantidad} {order.unidad}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Fecha de Emisión
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          📅 {formatDate(order.fechaEmision)}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Fecha de Entrega
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          🚚 {formatDate(order.fechaEntrega)}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          ID de Orden
                        </div>
                        <div className="font-mono text-sm" style={{ color: '#23334e' }}>
                          #{order._id.slice(-8)}
                        </div>
                      </div>
                    </div>

                    {/* Nota si existe */}
                    {order.nota && (
                      <div className="mb-4 p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          💬 Nota
                        </div>
                        <div className="text-blue-700">
                          {order.nota}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setEditStatus(order.status);
                          setEditFechaEntrega(order.fechaEntrega ? order.fechaEntrega.substring(0, 10) : "");
                          setEditNota(order.nota || "");
                        }}
                        className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                        style={{ backgroundColor: '#46546b' }}
                      >
                        ✏️ Actualizar
                      </button>
                      
                      {(order.status === "completada" || order.status === "cancelada") && (
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="px-6 py-2 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-md hover:bg-red-600"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de edición */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#23334e' }}>
                Actualizar Orden
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Estado
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    value={editFechaEntrega}
                    onChange={(e) => setEditFechaEntrega(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nota
                  </label>
                  <textarea
                    value={editNota}
                    onChange={(e) => setEditNota(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    rows="3"
                    placeholder="Ej. Se canceló por falta de stock"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
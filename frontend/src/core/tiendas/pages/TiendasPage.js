import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function TiendasPage() {
  const token = localStorage.getItem("token");
  const [tiendas, setTiendas] = useState([]);
  const [nuevaTienda, setNuevaTienda] = useState({ nombre: "", direccion: "", telefono: "" });
  const [msg, setMsg] = useState("");
  const [editTienda, setEditTienda] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [tiendaEditando, setTiendaEditando] = useState({ nombre: "", direccion: "", telefono: "" });
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [tiendaEliminar, setTiendaEliminar] = useState(null);
  const [relacionesData, setRelacionesData] = useState(null);
  const [cargandoRelaciones, setCargandoRelaciones] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTiendas = () => {
    setCargando(true);
    axios.get(`${apiBaseUrl}/api/tiendas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setTiendas(res.data);
      setCargando(false);
    })
    .catch(() => {
      setMsg("Error al cargar tiendas ❌");
      setCargando(false);
    });
  };

  useEffect(() => {
    fetchTiendas();
  }, []);

  const handleChange = (e) => {
    setNuevaTienda({ ...nuevaTienda, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!nuevaTienda.nombre || !nuevaTienda.direccion) {
      setMsg("Por favor completa los campos requeridos ❌");
      return;
    }

    setCargando(true);
    axios.post(`${apiBaseUrl}/api/tiendas`, nuevaTienda, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMsg("Tienda guardada exitosamente ✅");
      setNuevaTienda({ nombre: "", direccion: "", telefono: "" });
      setMostrarFormulario(false);
      fetchTiendas();
      setTimeout(() => setMsg(""), 3000);
    })
    .catch(() => {
      setMsg("Error al guardar tienda ❌");
      setCargando(false);
    });
  };

  // ✅ NUEVO: Iniciar proceso de eliminación con verificaciones
  const handleDelete = async (tienda) => {
    setTiendaEliminar(tienda);
    setCargandoRelaciones(true);
    setMostrarModalEliminar(true);
    
    try {
      const res = await axios.get(`${apiBaseUrl}/api/tiendas/${tienda._id}/relationships`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelacionesData(res.data);
    } catch (error) {
      setMsg("Error al verificar relaciones ❌");
      setMostrarModalEliminar(false);
    } finally {
      setCargandoRelaciones(false);
    }
  };

  // ✅ NUEVO: Archivar tienda (soft delete)
  const handleArchivarTienda = async () => {
    setCargando(true);
    try {
      await axios.patch(`${apiBaseUrl}/api/tiendas/${tiendaEliminar._id}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Tienda archivada exitosamente ✅");
      setMostrarModalEliminar(false);
      fetchTiendas();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg("Error al archivar tienda ❌");
    } finally {
      setCargando(false);
    }
  };

  // ✅ NUEVO: Eliminar permanentemente con confirmación
  const handleEliminarPermanente = async () => {
    if (!window.confirm("⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE. ¿Confirmas eliminar permanentemente?")) {
      return;
    }
    
    setCargando(true);
    try {
      await axios.delete(`${apiBaseUrl}/api/tiendas/${tiendaEliminar._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { forceDelete: true }
      });
      setMsg("Tienda eliminada permanentemente ✅");
      setMostrarModalEliminar(false);
      fetchTiendas();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg("Error al eliminar tienda ❌");
    } finally {
      setCargando(false);
    }
  };

  // ✅ NUEVO: Cerrar modal de eliminación
  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setTiendaEliminar(null);
    setRelacionesData(null);
  };

  const handleEdit = (tienda) => {
    setEditTienda(tienda);
    setNuevaTienda(tienda);
    setMostrarFormulario(true);
  };

  // ✅ Nuevas funciones para modal de edición
  const handleEditModal = (tienda) => {
    setTiendaEditando({ ...tienda });
    setEditTienda(tienda);
    setMostrarModalEdicion(true);
  };

  const handleCerrarModal = () => {
    setMostrarModalEdicion(false);
    setTiendaEditando({ nombre: "", direccion: "", telefono: "" });
    setEditTienda(null);
  };

  const handleChangeModal = (e) => {
    setTiendaEditando({ ...tiendaEditando, [e.target.name]: e.target.value });
  };

  const handleUpdateModal = () => {
    if (!tiendaEditando.nombre || !tiendaEditando.direccion) {
      setMsg("Por favor completa los campos requeridos ❌");
      return;
    }

    setCargando(true);
    axios.put(`${apiBaseUrl}/api/tiendas/${editTienda._id}`, tiendaEditando, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMsg("Tienda actualizada exitosamente ✅");
      handleCerrarModal();
      fetchTiendas();
      setCargando(false);
      setTimeout(() => setMsg(""), 3000);
    })
    .catch(() => {
      setMsg("Error al actualizar tienda ❌");
      setCargando(false);
    });
  };

  const handleUpdate = () => {
    if (!nuevaTienda.nombre || !nuevaTienda.direccion) {
      setMsg("Por favor completa los campos requeridos ❌");
      return;
    }

    setCargando(true);
    axios.put(`${apiBaseUrl}/api/tiendas/${editTienda._id}`, nuevaTienda, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMsg("Tienda actualizada exitosamente ✅");
      setEditTienda(null);
      setNuevaTienda({ nombre: "", direccion: "", telefono: "" });
      setMostrarFormulario(false);
      fetchTiendas();
      setTimeout(() => setMsg(""), 3000);
    })
    .catch(() => {
      setMsg("Error al actualizar tienda ❌");
      setCargando(false);
    });
  };

  const handleCancelar = () => {
    setEditTienda(null);
    setNuevaTienda({ nombre: "", direccion: "", telefono: "" });
    setMostrarFormulario(false);
  };

  // Filtrar tiendas por término de búsqueda
  const filteredTiendas = tiendas.filter(tienda => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tienda.nombre.toLowerCase().includes(searchLower) ||
      tienda.direccion.toLowerCase().includes(searchLower) ||
      tienda.telefono.includes(searchTerm)
    );
  });

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
                Gestión de Tiendas
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Administra las ubicaciones y sucursales de tu negocio
              </p>
            </div>
            
            <button
              onClick={() => {
                setMostrarFormulario(!mostrarFormulario);
                if (mostrarFormulario) {
                  handleCancelar();
                }
              }}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={cargando}
            >
              {mostrarFormulario ? "Cancelar" : "Nueva Tienda"}
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

        {/* Formulario para nueva/editar tienda */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              {editTienda ? "Editar Tienda" : "Agregar Nueva Tienda"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Nombre de la Tienda *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevaTienda.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Sucursal Centro"
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
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevaTienda.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Av. Principal 123, Col. Centro"
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
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={nuevaTienda.telefono}
                  onChange={handleChange}
                  placeholder="Ej: (644) 123-4567"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {editTienda ? (
                <button
                  onClick={handleUpdate}
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? "Actualizando..." : "Actualizar Tienda"}
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? "Guardando..." : "Guardar Tienda"}
                </button>
              )}
              <button
                onClick={handleCancelar}
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

        {/* Estadísticas y buscador */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {tiendas.length}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Total Tiendas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {filteredTiendas.length}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Resultados
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, dirección o teléfono..."
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

        {/* Lista de tiendas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando tiendas...</p>
            </div>
          ) : filteredTiendas.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay tiendas
              </h3>
              <p style={{ color: '#697487' }}>
                {searchTerm 
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza agregando tu primera tienda o sucursal"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredTiendas.map((tienda, index) => (
                <div 
                  key={tienda._id} 
                  className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Información de la tienda */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e' }}>
                          🏪
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                            {tienda.nombre}
                          </h3>
                          <p className="text-sm" style={{ color: '#697487' }}>
                            ID: #{tienda._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                            📍
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                              Dirección
                            </div>
                            <div style={{ color: '#23334e' }}>
                              {tienda.direccion}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                            📞
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                              Teléfono
                            </div>
                            <div style={{ color: '#23334e' }}>
                              {tienda.telefono || "No especificado"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditModal(tienda)}
                        className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                        style={{ backgroundColor: '#46546b' }}
                        disabled={cargando}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tienda)}
                        className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-md hover:bg-red-600"
                        disabled={cargando}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Modal de Edición */}
        {mostrarModalEdicion && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCerrarModal}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    Editar Tienda
                  </h2>
                  <button
                    onClick={handleCerrarModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Formulario */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Nombre de la Tienda *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={tiendaEditando.nombre}
                      onChange={handleChangeModal}
                      placeholder="Ingresa el nombre"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={tiendaEditando.direccion}
                      onChange={handleChangeModal}
                      placeholder="Ingresa la dirección"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={tiendaEditando.telefono}
                      onChange={handleChangeModal}
                      placeholder="Ingresa el teléfono"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-6 mt-6 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <button
                    onClick={handleCerrarModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50"
                    disabled={cargando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateModal}
                    className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#23334e' }}
                    disabled={cargando}
                  >
                    {cargando ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal de Eliminación Inteligente */}
        {mostrarModalEliminar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCerrarModalEliminar}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-red-600">
                    ⚠️ Eliminar Tienda
                  </h2>
                  <button
                    onClick={handleCerrarModalEliminar}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Información de la tienda */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Tienda a eliminar:
                  </h3>
                  <div className="text-sm text-gray-600">
                    <div><strong>Nombre:</strong> {tiendaEliminar?.nombre}</div>
                    <div><strong>Dirección:</strong> {tiendaEliminar?.direccion}</div>
                    {tiendaEliminar?.telefono && (
                      <div><strong>Teléfono:</strong> {tiendaEliminar.telefono}</div>
                    )}
                  </div>
                </div>

                {/* Verificación de relaciones */}
                {cargandoRelaciones ? (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="text-gray-600">Verificando datos asociados...</p>
                  </div>
                ) : relacionesData ? (
                  <div className="mb-6">
                    {relacionesData.hasRelationships ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h4 className="text-yellow-800 font-medium mb-3 flex items-center gap-2">
                          ⚠️ Esta tienda tiene datos asociados
                        </h4>
                        <div className="space-y-2 text-sm">
                          {relacionesData.details.usuarios > 0 && (
                            <div className="text-yellow-700">
                              • <strong>{relacionesData.details.usuarios}</strong> usuario(s)
                            </div>
                          )}
                          {relacionesData.details.empleadosHistorial > 0 && (
                            <div className="text-yellow-700">
                              • <strong>{relacionesData.details.empleadosHistorial}</strong> registro(s) de historial laboral
                            </div>
                          )}
                          {relacionesData.details.asistencias > 0 && (
                            <div className="text-yellow-700">
                              • <strong>{relacionesData.details.asistencias}</strong> registro(s) de asistencia
                            </div>
                          )}
                          {relacionesData.details.horarios > 0 && (
                            <div className="text-yellow-700">
                              • <strong>{relacionesData.details.horarios}</strong> horario(s) configurado(s)
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-yellow-600">
                          Total: <strong>{relacionesData.total}</strong> registros asociados
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="text-green-800 font-medium mb-2 flex items-center gap-2">
                          ✅ Tienda sin datos asociados
                        </h4>
                        <p className="text-green-700 text-sm">
                          Esta tienda puede eliminarse de forma segura.
                        </p>
                      </div>
                    )}

                    {/* Opciones de eliminación */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Opciones disponibles:</h4>
                      
                      {/* Opción recomendada: Archivar */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="text-blue-800 font-medium mb-2">📁 Archivar Tienda (Recomendado)</h5>
                        <p className="text-blue-700 text-sm mb-3">
                          La tienda se ocultará del sistema pero todos los datos se conservan para auditoría.
                          Puede restaurarse más tarde si es necesario.
                        </p>
                        <button
                          onClick={handleArchivarTienda}
                          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={cargando}
                        >
                          {cargando ? "Archivando..." : "📁 Archivar Tienda"}
                        </button>
                      </div>

                      {/* Opción peligrosa: Eliminar permanente */}
                      {!relacionesData.hasRelationships && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h5 className="text-red-800 font-medium mb-2">🗑️ Eliminar Permanentemente</h5>
                          <p className="text-red-700 text-sm mb-3">
                            ⚠️ Esta acción es IRREVERSIBLE. La tienda será eliminada completamente.
                          </p>
                          <button
                            onClick={handleEliminarPermanente}
                            className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            disabled={cargando}
                          >
                            {cargando ? "Eliminando..." : "🗑️ Eliminar Permanentemente"}
                          </button>
                        </div>
                      )}

                      {/* Mensaje para tiendas con datos */}
                      {relacionesData.hasRelationships && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-700 text-sm">
                            <strong>💡 Sugerencia:</strong> Para eliminar permanentemente, 
                            primero reasigna los usuarios a otras tiendas y limpia los datos asociados.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Botón cancelar */}
                <div className="border-t pt-4">
                  <button
                    onClick={handleCerrarModalEliminar}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50"
                    disabled={cargando}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
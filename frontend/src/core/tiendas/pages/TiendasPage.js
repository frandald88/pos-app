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

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta tienda?")) {
      setCargando(true);
      axios.delete(`${apiBaseUrl}/api/tiendas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setMsg("Tienda eliminada exitosamente ✅");
        fetchTiendas();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => {
        setMsg("Error al eliminar tienda ❌");
        setCargando(false);
      });
    }
  };

  const handleEdit = (tienda) => {
    setEditTienda(tienda);
    setNuevaTienda(tienda);
    setMostrarFormulario(true);
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
                        onClick={() => handleEdit(tienda)}
                        className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                        style={{ backgroundColor: '#46546b' }}
                        disabled={cargando}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tienda._id)}
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

        {/* Vista de tabla para pantallas grandes (opcional) */}
        {filteredTiendas.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8 hidden xl:block">
            <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                Vista de Tabla
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#f4f6fa' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Tienda
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Dirección
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTiendas.map((tienda, index) => (
                    <tr 
                      key={tienda._id} 
                      className={`border-t hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#23334e', color: 'white' }}>
                            🏪
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {tienda.nombre}
                            </div>
                            <div className="text-sm" style={{ color: '#697487' }}>
                              ID: #{tienda._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#46546b' }}>
                        {tienda.direccion}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#46546b' }}>
                        {tienda.telefono || "No especificado"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(tienda)}
                            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{ backgroundColor: '#46546b' }}
                            disabled={cargando}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(tienda._id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-red-600"
                            disabled={cargando}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
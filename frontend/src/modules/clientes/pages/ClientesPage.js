import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function ClientesPage() {
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [msg, setMsg] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editCliente, setEditCliente] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);

  const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};  
  const fetchClientes = () => {
    setCargando(true);
    axios
      .get(`${apiBaseUrl}/api/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClientes(res.data.data.clientes);
        setCargando(false);
      })
      .catch(() => {
        setMsg("Error al cargar clientes ❌");
        setCargando(false);
      });
  };


  const handleEditChange = (e, field) => {
  const { value } = e.target;
  
  if (field === 'telefono') {
    const telefonoLimpio = value.replace(/\D/g, '').slice(0, 10);
    setEditCliente({ ...editCliente, [field]: telefonoLimpio });
  } else {
    setEditCliente({ ...editCliente, [field]: value });
  }
};
  useEffect(() => {
    fetchClientes();

    // Obtener el usuario actual
    axios
      .get(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data))
      .catch(() => setMsg("Error al cargar el usuario actual ❌"));
  }, [token]);

const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Validar teléfono: solo números y máximo 10 dígitos
  if (name === 'telefono') {
    const telefonoLimpio = value.replace(/\D/g, '').slice(0, 10);
    setNuevoCliente({
      ...nuevoCliente,
      [name]: telefonoLimpio,
    });
  } else {
    setNuevoCliente({
      ...nuevoCliente,
      [name]: value,
    });
  }
};

const handleGuardarCliente = () => {
  if (!nuevoCliente.nombre || !nuevoCliente.telefono) {
    setMsg("Por favor completa los campos requeridos ❌");
    return;
  }

  // Validar email si se proporciona
  if (nuevoCliente.email && !isValidEmail(nuevoCliente.email)) {
    setMsg("Por favor ingresa un email válido ❌");
    return;
  }

    setCargando(true);
    axios
      .post(`${apiBaseUrl}/api/clientes`, nuevoCliente, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Cliente guardado exitosamente ✅");
        setNuevoCliente({
          nombre: "",
          direccion: "",
          telefono: "",
          email: "",
        });
        setMostrarFormulario(false);
        fetchClientes();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => {
        setMsg("Error al guardar cliente ❌");
        setCargando(false);
      });
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      setCargando(true);
      axios
        .delete(`${apiBaseUrl}/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setMsg("Cliente eliminado exitosamente ✅");
          fetchClientes();
          setTimeout(() => setMsg(""), 3000);
        })
        .catch(() => {
          setMsg("Error al eliminar cliente ❌");
          setCargando(false);
        });
    }
  };

  const handleEditar = (cliente) => {
    setEditandoId(cliente._id);
    setEditCliente({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
    });
  };

const handleGuardarEdicion = () => {
  if (!editCliente.nombre || !editCliente.telefono) {
    setMsg("Por favor completa los campos requeridos ❌");
    return;
  }

  // Validar email si se proporciona
  if (editCliente.email && !isValidEmail(editCliente.email)) {
    setMsg("Por favor ingresa un email válido ❌");
    return;
  }

    setCargando(true);
    axios
      .put(`${apiBaseUrl}/api/clientes/${editandoId}`, editCliente, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Cliente actualizado exitosamente ✅");
        setEditandoId(null);
        fetchClientes();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => {
        setMsg("Error al actualizar cliente ❌");
        setCargando(false);
      });
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
      c.telefono.includes(clienteFiltro) ||
      c.email.toLowerCase().includes(clienteFiltro.toLowerCase())
  );

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
                Directorio de Clientes
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona tu base de datos de clientes de forma eficiente
              </p>
            </div>
            
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={cargando}
              >
                {mostrarFormulario ? "Cancelar" : "Nuevo Cliente"}
              </button>
            )}
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

        {/* Formulario para nuevo cliente */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Agregar Nuevo Cliente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoCliente.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo del cliente"
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
                  Teléfono *
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={nuevoCliente.telefono}
                  onChange={handleChange}
                  placeholder="Número de teléfono (10 dígitos)"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  maxLength="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={nuevoCliente.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevoCliente.direccion}
                  onChange={handleChange}
                  placeholder="Dirección completa"
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
                onClick={handleGuardarCliente}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={cargando}
              >
                {cargando ? "Guardando..." : "Guardar Cliente"}
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

        {/* Estadísticas y buscador */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {clientes.length}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Total Clientes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {clientesFiltrados.length}
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
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o email..."
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

        {/* Tabla de clientes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay clientes
              </h3>
              <p style={{ color: '#697487' }}>
                {clienteFiltro 
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza agregando tu primer cliente"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#f4f6fa' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente, index) => (
                    <tr 
                      key={cliente._id} 
                      className={`border-t hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <td className="px-6 py-4">
                        {editandoId === cliente._id ? (
                          <input
                            type="text"
                            value={editCliente.nombre}
                            onChange={(e) => handleEditChange(e, 'nombre')}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                          />
                        ) : (
                          <div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {cliente.nombre}
                            </div>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {editandoId === cliente._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editCliente.telefono}
                              onChange={(e) => handleEditChange(e, 'telefono')}
                              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                              style={{ 
                                borderColor: '#e5e7eb',
                                focusRingColor: '#23334e'
                              }}
                              maxLength="10"
                            />
                            <input
                              type="email"
                              value={editCliente.email}
                              onChange={(e) => handleEditChange(e, 'email')} 
                              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                              style={{ 
                                borderColor: '#e5e7eb',
                                focusRingColor: '#23334e'
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {cliente.telefono}
                            </div>
                            {cliente.email && (
                              <div className="text-sm" style={{ color: '#697487' }}>
                                {cliente.email}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {editandoId === cliente._id ? (
                          <input
                            type="text"
                            value={editCliente.direccion}
                            onChange={(e) => handleEditChange(e, 'direccion')}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                          />
                        ) : (
                          <div style={{ color: '#697487' }}>
                            {cliente.direccion || "No especificada"}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {editandoId === cliente._id ? (
                            <>
                              <button
                                onClick={handleGuardarEdicion}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                style={{ backgroundColor: '#23334e' }}
                                disabled={cargando}
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditandoId(null)}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                style={{ backgroundColor: '#8c95a4' }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  localStorage.setItem("clienteSeleccionado", cliente._id);
                                  window.location.href = "/admin/ventas";
                                }}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                style={{ backgroundColor: '#23334e' }}
                              >
                                Vender
                              </button>
                              
                              {currentUser?.role === "admin" && (
                                <>
                                  <button
                                    onClick={() => handleEditar(cliente)}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                    style={{ backgroundColor: '#46546b' }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(cliente._id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-red-600"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
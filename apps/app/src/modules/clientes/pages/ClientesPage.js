import { useState } from "react";
import { useClientesData } from "../hooks/useClientesData";
import { useClientesForm } from "../hooks/useClientesForm";
import { useClientesFilters } from "../hooks/useClientesFilters";
import { useClientesUtils } from "../hooks/useClientesUtils";
import ClienteModal from "../components/ClienteModal";

export default function ClientesPage() {
  const [modalError, setModalError] = useState("");

  // Hooks
  const {
    clientes,
    currentUser,
    cargando,
    msg,
    createCliente,
    updateCliente,
    deleteCliente,
    setMsg,
    getNombreCompleto // ⭐ NUEVO: Helper para nombre completo
  } = useClientesData();

  const {
    nuevoCliente,
    editandoId,
    editCliente,
    mostrarFormulario,
    handleChange,
    handleEditChange,
    getNewClienteData,
    getEditClienteData,
    clearNewClienteForm,
    startEdit,
    cancelEdit,
    toggleForm,
    setMostrarFormulario
  } = useClientesForm();

  const {
    clienteFiltro,
    setClienteFiltro,
    filterClientes
  } = useClientesFilters();

  const { isValidEmail } = useClientesUtils();

  // Handler para el submit del formulario (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const clienteData = editandoId ? editCliente : nuevoCliente;

    if (!clienteData.nombre || !clienteData.telefono) {
      setModalError("Por favor completa los campos requeridos ❌");
      return;
    }

    if (clienteData.email && !isValidEmail(clienteData.email)) {
      setModalError("Por favor ingresa un email válido ❌");
      return;
    }

    try {
      if (editandoId) {
        await updateCliente(editandoId, getEditClienteData());
        cancelEdit();
        setMostrarFormulario(false);
      } else {
        await createCliente(getNewClienteData());
        clearNewClienteForm();
        setMostrarFormulario(false);
      }
      setModalError("");
    } catch (error) {
      setModalError("Error al guardar cliente ❌");
    }
  };

  // Manejar eliminación
  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteCliente(id);
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  };

  // Handler para abrir modal de edición
  const handleEditarCliente = (cliente) => {
    startEdit(cliente);
    setMostrarFormulario(true);
    setModalError("");
  };

  // Handler para cerrar modal
  const handleCerrarModal = () => {
    if (editandoId) {
      cancelEdit();
    } else {
      clearNewClienteForm();
    }
    setMostrarFormulario(false);
    setModalError("");
  };

  // Filtrar clientes
  const clientesFiltrados = filterClientes(clientes);

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
            
            {/* ⭐ ACTUALIZADO: Permitir a admin, vendedor y repartidor crear clientes */}
            {(currentUser?.role === "admin" || currentUser?.role === "vendedor" || currentUser?.role === "repartidor") && (
              <button
                onClick={toggleForm}
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
                        <div>
                          <div className="font-medium" style={{ color: '#23334e' }}>
                            {getNombreCompleto(cliente)}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
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
                      </td>

                      <td className="px-6 py-4">
                        <div style={{ color: '#697487' }}>
                          {cliente.direccion || "No especificada"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
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

                          {/* ⭐ ACTUALIZADO: Permitir editar a admin, vendedor y repartidor */}
                          {(currentUser?.role === "admin" || currentUser?.role === "vendedor" || currentUser?.role === "repartidor") && (
                            <button
                              onClick={() => handleEditarCliente(cliente)}
                              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                              style={{ backgroundColor: '#46546b' }}
                            >
                              Editar
                            </button>
                          )}

                          {/* ⭐ Solo admin puede eliminar */}
                          {currentUser?.role === "admin" && (
                            <button
                              onClick={() => handleEliminar(cliente._id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-red-600"
                            >
                              Eliminar
                            </button>
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

        {/* Modal para crear/editar cliente */}
        <ClienteModal
          isOpen={mostrarFormulario}
          onClose={handleCerrarModal}
          onSubmit={handleSubmit}
          cliente={editandoId ? editCliente : nuevoCliente}
          onChange={editandoId ? handleEditChange : handleChange}
          isEditing={!!editandoId}
          cargando={cargando}
          modalError={modalError}
          setModalError={setModalError}
        />
      </div>
    </div>
  );
}
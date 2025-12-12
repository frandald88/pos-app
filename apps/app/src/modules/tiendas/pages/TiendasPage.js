import { useState, useEffect } from "react";
import { useTiendasData } from "../hooks/useTiendasData";
import { useTiendasForm } from "../hooks/useTiendasForm";
import { useTiendasFilters } from "../hooks/useTiendasFilters";
import TiendaModal from "../components/TiendaModal";
import TicketConfigModal from "../components/TicketConfigModal";

// SVG Icons
const Icons = {
  store: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  warning: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  trash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  archive: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  lightbulb: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  palette: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
};

export default function TiendasPage() {
  const [modalError, setModalError] = useState("");
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [mostrarConfigTicket, setMostrarConfigTicket] = useState(false);
  const [tiendaConfig, setTiendaConfig] = useState(null);

  // Hooks
  const {
    tiendas,
    cargando,
    msg,
    relacionesData,
    cargandoRelaciones,
    fetchTiendas,
    createTienda,
    updateTienda,
    checkTiendaRelationships,
    archiveTienda,
    restoreTienda,
    deleteTienda,
    clearRelacionesData,
    setMsg
  } = useTiendasData();

  const {
    nuevaTienda,
    editTienda,
    mostrarFormulario,
    mostrarModalEdicion,
    tiendaEditando,
    mostrarModalEliminar,
    tiendaEliminar,
    handleChange,
    handleChangeModal,
    getNewTiendaData,
    getEditTiendaData,
    clearNewTiendaForm,
    handleEditModal,
    handleCerrarModal,
    handleDelete,
    handleCerrarModalEliminar,
    toggleForm,
    setMostrarFormulario,
    setEditTienda
  } = useTiendasForm();

  const {
    searchTerm,
    setSearchTerm,
    filterTiendas
  } = useTiendasFilters();

  // Cargar tiendas al montar y cuando cambia el filtro de archivadas
  useEffect(() => {
    fetchTiendas({ includeArchived: mostrarArchivadas });
  }, [fetchTiendas, mostrarArchivadas]);

  // Handler para el submit del formulario (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const tiendaData = editTienda ? tiendaEditando : nuevaTienda;

    if (!tiendaData.nombre || !tiendaData.direccion) {
      setModalError("[ERROR] Por favor completa los campos requeridos");
      return;
    }

    try {
      if (editTienda) {
        const dataToUpdate = getEditTiendaData();

        // Si el evento tiene teléfono del modal, usarlo
        if (e.telefonoCompleto !== undefined) {
          dataToUpdate.telefono = e.telefonoCompleto;
        }

        console.log('[INFO] Enviando al backend (EDITAR):', dataToUpdate);
        await updateTienda(editTienda._id, dataToUpdate);
        handleCerrarModal();
      } else {
        const dataToCreate = getNewTiendaData();

        // Si el evento tiene teléfono del modal, usarlo
        if (e.telefonoCompleto !== undefined) {
          dataToCreate.telefono = e.telefonoCompleto;
        }

        console.log('[INFO] Enviando al backend (CREAR):', dataToCreate);
        await createTienda(dataToCreate);
        clearNewTiendaForm();
      }
      setMostrarFormulario(false);
      setModalError("");
    } catch (error) {
      console.error('Error al guardar tienda:', error);
      const errorMessage = error.response?.data?.message || "[ERROR] Error al guardar tienda";
      setModalError(errorMessage);
    }
  };

  // Handler para abrir modal de edición
  const handleEditarTienda = (tienda) => {
    handleEditModal(tienda);
    setModalError("");
  };

  // Handler para abrir modal de nuevo
  const handleNuevaTienda = () => {
    setEditTienda(null);
    setMostrarFormulario(true);
    setModalError("");
  };

  // Handler para cerrar modal
  const handleCerrarTiendaModal = () => {
    if (editTienda) {
      handleCerrarModal();
    } else {
      clearNewTiendaForm();
    }
    setModalError("");
  };

  // Handler para iniciar eliminación (con verificación de relaciones)
  const handleIniciarEliminacion = async (tienda) => {
    handleDelete(tienda);
    try {
      const relaciones = await checkTiendaRelationships(tienda._id);
      console.log('[INFO] Relaciones recibidas:', relaciones);
    } catch (error) {
      setMsg("[ERROR] Error al verificar relaciones");
      handleCerrarModalEliminar();
    }
  };

  // Handler para archivar tienda
  const handleArchivarTienda = async () => {
    if (!tiendaEliminar) return;

    try {
      await archiveTienda(tiendaEliminar._id);
      handleCerrarModalEliminar();
      clearRelacionesData();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Handler para eliminar permanentemente
  const handleEliminarPermanente = async () => {
    if (!tiendaEliminar) return;

    if (!window.confirm("ADVERTENCIA: Esta acción es IRREVERSIBLE. ¿Confirmas eliminar permanentemente?")) {
      return;
    }

    try {
      await deleteTienda(tiendaEliminar._id, true);
      handleCerrarModalEliminar();
      clearRelacionesData();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Handler para restaurar tienda archivada
  const handleRestaurarTienda = async (tiendaId) => {
    try {
      await restoreTienda(tiendaId);
    } catch (error) {
      console.error('Error restaurando tienda:', error);
    }
  };

  // Handler para abrir configuración de ticket
  const handleConfigTicket = (tienda) => {
    setTiendaConfig(tienda);
    setMostrarConfigTicket(true);
  };

  // Handler para guardar configuración de ticket
  const handleGuardarConfigTicket = async (config) => {
    try {
      await updateTienda(tiendaConfig._id, {
        ...tiendaConfig,
        ticketConfig: config
      });
      setMsg('[SUCCESS] Configuración de ticket actualizada');
      setMostrarConfigTicket(false);
      setTiendaConfig(null);
      fetchTiendas();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMsg('[ERROR] Error al guardar configuración');
    }
  };

  // Filtrar tiendas
  const tiendasFiltradas = filterTiendas(tiendas);

  // Determinar si el modal debe mostrar en modo edición
  const isEditingModal = !!(editTienda && (mostrarFormulario || mostrarModalEliminar));

  // Obtener los datos correctos para el modal
  const modalTiendaData = editTienda ? tiendaEditando : nuevaTienda;
  const modalOnChange = editTienda ? handleChangeModal : handleChange;

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
                Administra las sucursales de tu negocio
              </p>
            </div>

            <button
              onClick={handleNuevaTienda}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={cargando}
            >
              Nueva Tienda
            </button>
          </div>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('[SUCCESS]')
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
                  {tiendas.length}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Total Tiendas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {tiendasFiltradas.length}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Resultados
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 max-w-md">
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

              {/* Toggle para mostrar archivadas */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarArchivadas}
                    onChange={(e) => setMostrarArchivadas(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                  Mostrar tiendas archivadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de tiendas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando tiendas...</p>
            </div>
          ) : tiendasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center" style={{ color: '#697487' }}>
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay tiendas
              </h3>
              <p style={{ color: '#697487' }}>
                {searchTerm
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza agregando tu primera tienda"
                }
              </p>
            </div>
          ) : (
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
                  {tiendasFiltradas.map((tienda, index) => (
                    <tr
                      key={tienda._id}
                      className={`border-t hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium" style={{ color: '#23334e' }}>
                            {tienda.nombre}
                          </div>
                          {tienda.activa === false && (
                            <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                              Archivada
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div style={{ color: '#697487' }}>
                          {tienda.direccion || "No especificada"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div style={{ color: '#697487' }}>
                          {tienda.telefono || "No especificado"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {tienda.activa === false ? (
                            // Botones para tiendas archivadas
                            <>
                              <button
                                onClick={() => handleRestaurarTienda(tienda._id)}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                style={{ backgroundColor: '#10b981' }}
                              >
                                Restaurar
                              </button>
                              <button
                                onClick={() => handleIniciarEliminacion(tienda)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-red-600"
                              >
                                Eliminar
                              </button>
                            </>
                          ) : (
                            // Botones para tiendas activas
                            <>
                              <button
                                onClick={() => handleConfigTicket(tienda)}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-2"
                                style={{ backgroundColor: '#10b981' }}
                                title="Configurar diseño del ticket"
                              >
                                <Icons.palette /> Ticket
                              </button>
                              <button
                                onClick={() => handleEditarTienda(tienda)}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md"
                                style={{ backgroundColor: '#46546b' }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleIniciarEliminacion(tienda)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-red-600"
                              >
                                Eliminar
                              </button>
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

        {/* Modal para crear/editar tienda */}
        <TiendaModal
          isOpen={mostrarFormulario || mostrarModalEdicion}
          onClose={handleCerrarTiendaModal}
          onSubmit={handleSubmit}
          tienda={modalTiendaData}
          onChange={modalOnChange}
          isEditing={!!editTienda}
          cargando={cargando}
          modalError={modalError}
          setModalError={setModalError}
        />

        {/* Modal de eliminación con verificación de relaciones */}
        {mostrarModalEliminar && tiendaEliminar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCerrarModalEliminar();
                clearRelacionesData();
              }
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                    <Icons.warning /> Eliminar Tienda
                  </h2>
                  <button
                    onClick={() => {
                      handleCerrarModalEliminar();
                      clearRelacionesData();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-lg font-semibold mb-2" style={{ color: '#23334e' }}>
                    ¿Estás seguro de eliminar la tienda "{tiendaEliminar.nombre}"?
                  </p>
                </div>

                {cargandoRelaciones ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
                    <p style={{ color: '#697487' }}>Verificando relaciones...</p>
                  </div>
                ) : relacionesData ? (
                  <div className="space-y-4">
                    {/* Información de relaciones */}
                    {relacionesData.data?.hasRelationships ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-2">Relaciones encontradas:</h3>
                        <ul className="space-y-2 text-sm text-yellow-700">
                          {relacionesData.data?.data?.users > 0 && (
                            <li>• {relacionesData.data.data.users} usuario(s) asignado(s)</li>
                          )}
                          {relacionesData.data?.data?.products > 0 && (
                            <li>• {relacionesData.data.data.products} producto(s) registrado(s)</li>
                          )}
                          {relacionesData.data?.data?.sales > 0 && (
                            <li>• {relacionesData.data.data.sales} venta(s) realizada(s)</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 flex items-start gap-2">
                          <Icons.check /> <span><strong>Sin relaciones:</strong> Esta tienda no tiene usuarios, productos ni ventas asociadas.
                          Puede eliminarse de forma segura.</span>
                        </p>
                      </div>
                    )}

                    {/* Opciones de eliminación */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <Icons.lightbulb /> <span><strong>Recomendación:</strong> Archivar la tienda en lugar de eliminarla permanentemente.
                        Esto mantiene el historial y permite restaurarla más tarde si es necesario.</span>
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col gap-3 mt-6">
                      <button
                        onClick={handleArchivarTienda}
                        disabled={cargando}
                        className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#f59e0b' }}
                      >
                        <Icons.archive /> Archivar Tienda (Recomendado)
                      </button>

                      <button
                        onClick={handleEliminarPermanente}
                        disabled={cargando}
                        className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-red-600 transition-all duration-200 hover:shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Icons.trash /> Eliminar Permanentemente
                      </button>

                      <button
                        onClick={() => {
                          handleCerrarModalEliminar();
                          clearRelacionesData();
                        }}
                        disabled={cargando}
                        className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#46546b', backgroundColor: '#f4f6fa' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuración de Ticket */}
        {mostrarConfigTicket && tiendaConfig && (
          <TicketConfigModal
            tienda={tiendaConfig}
            onClose={() => {
              setMostrarConfigTicket(false);
              setTiendaConfig(null);
            }}
            onSave={handleGuardarConfigTicket}
          />
        )}
      </div>
    </div>
  );
}
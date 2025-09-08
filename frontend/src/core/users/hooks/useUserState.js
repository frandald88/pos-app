import { useState } from 'react';

export const useUserState = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRole, setFiltroRole] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");

  // Estados consolidados para historial laboral
  const [historialLaboral, setHistorialLaboral] = useState({
    sueldoDiario: "",
    seguroSocial: false,
    startDate: "",
    position: "Empleado",
    notes: ""
  });

  // Estados consolidados para edición de historial
  const [editHistorial, setEditHistorial] = useState({
    id: null,
    endDate: "",
    seguro: false,
    motivo: "",
    razon: "",
    sueldo: "",
    position: "",
    notes: ""
  });

  // Estados consolidados para modales y UI
  const [uiState, setUiState] = useState({
    showScheduleModal: false,
    showTemplateForm: false,
    editingTemplateId: null,
    showDeleteModal: false,
    deleteCandidate: null,
    deleteError: null,
    selectedEmployeeForSchedule: null,
    editingScheduleId: null,
    showDeletedUsers: false
  });

  // Estados consolidados para datos personales
  const [personalData, setPersonalData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    rfc: "",
    curp: "",
    numeroSeguroSocial: "",
    attachments: []
  });

  // Estados consolidados para edición de datos personales
  const [editPersonalData, setEditPersonalData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    rfc: "",
    curp: "",
    numeroSeguroSocial: ""
  });

  const [deletedUsers, setDeletedUsers] = useState([]);

  // Formulario principal
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "vendedor",
    tienda: "",
    telefono: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(null);

  return {
    // Estados principales
    users, setUsers,
    tiendas, setTiendas,
    historyData, setHistoryData,
    msg, setMsg,
    cargando, setCargando,
    mostrarFormulario, setMostrarFormulario,
    searchTerm, setSearchTerm,
    filtroRole, setFiltroRole,
    filtroTienda, setFiltroTienda,

    // Estados de historial
    historialLaboral, setHistorialLaboral,
    editHistorial, setEditHistorial,

    // Estados de UI
    uiState, setUiState,

    // Estados de datos personales
    personalData, setPersonalData,
    editPersonalData, setEditPersonalData,

    // Otros estados
    deletedUsers, setDeletedUsers,
    form, setForm,
    editingId, setEditingId,
    token, setToken
  };
};
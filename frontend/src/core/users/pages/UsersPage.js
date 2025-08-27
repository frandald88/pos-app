import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

// ✅ Función pura movida fuera del componente para mejor rendimiento
const formatPhoneNumber = (value, previousValue = '') => {
  // Remover todo lo que no sea número
  const numbers = value.replace(/\D/g, '');
  
  // No permitir que empiece con 0
  if (numbers.startsWith('0')) {
    return previousValue; // Mantener el valor anterior
  }
  
  // Limitar a máximo 10 dígitos
  const limitedNumbers = numbers.slice(0, 10);
  
  // Formatear como (xxx) xxx-xxxx
  if (limitedNumbers.length >= 6) {
    return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
  } else if (limitedNumbers.length >= 3) {
    return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3)}`;
  } else if (limitedNumbers.length > 0) {
    return `(${limitedNumbers}`;
  }
  
  return limitedNumbers;
};

function UsersPage() {
  // ✅ Estados principales (reducidos y organizados)
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRole, setFiltroRole] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");
  
  // ✅ Estados consolidados para historial laboral
  const [historialLaboral, setHistorialLaboral] = useState({
    sueldoDiario: "",
    seguroSocial: false,
    startDate: "",
    position: "Empleado",
    notes: ""
  });

  // ✅ Estados consolidados para edición de historial
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

  // ✅ Estados consolidados para modales y UI
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

  // ✅ Estados consolidados para datos de plantillas y horarios
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleData, setScheduleData] = useState({
    templates: [],
    employeeSchedules: [],
    defaultTolerance: 15,
    notes: "",
    schedule: {
      0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
      1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
    },
    editingTemplateData: {
      name: "",
      description: "",
      defaultTolerance: 15,
      notes: "",
      schedule: {
        0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
        1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
      }
    }
  });

  // ✅ Estados consolidados para datos personales
  const [personalData, setPersonalData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    rfc: "",
    curp: "",
    numeroSeguroSocial: "",
    attachments: []
  });

  // ✅ Estados consolidados para edición de datos personales
  const [editPersonalData, setEditPersonalData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    rfc: "",
    curp: "",
    numeroSeguroSocial: ""
  });

  const [deletedUsers, setDeletedUsers] = useState([]);
  const deletedUsersRef = useRef(null); 

  // ✅ Estados consolidados para formularios de horario
  const [scheduleFormType, setScheduleFormType] = useState('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // ✅ Estados consolidados para plantillas
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    defaultTolerance: 15,
    notes: "",
    schedule: {
      0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
      1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
    }
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "vendedor",
    tienda: "",
    telefono: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(null);

  // Inicializar token y escuchar cambios
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    
    // Escuchar cambios en localStorage (opcional)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setToken(newToken);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Constante para nombres de días
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // ✅ Handlers optimizados para mejorar rendimiento del formulario
  const handleUsernameChange = useCallback((e) => {
    setForm(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const handleRoleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, role: e.target.value, tienda: "" }));
  }, []);

  const handleTiendaChange = useCallback((e) => {
    setForm(prev => ({ ...prev, tienda: e.target.value }));
  }, []);

  const handleTelefonoChange = useCallback((e) => {
    setForm(prev => {
      const formattedPhone = formatPhoneNumber(e.target.value, prev.telefono);
      return { ...prev, telefono: formattedPhone };
    });
  }, []);

  // ✅ Handlers optimizados para datos personales
  const handlePersonalDataChange = useCallback((field) => (e) => {
    setPersonalData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // ✅ Handlers optimizados para historial laboral
  const handleHistorialLaboralChange = useCallback((field) => (e) => {
    const value = field === 'seguroSocial' ? e.target.checked : e.target.value;
    setHistorialLaboral(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Handlers optimizados para UI state
  const handleUIStateChange = useCallback((field, value) => {
    setUiState(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Handlers optimizados para edición de historial
  const handleEditHistorialChange = useCallback((field) => (e) => {
    const value = field === 'seguro' ? e.target.checked : e.target.value;
    setEditHistorial(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Handlers optimizados para edición de datos personales
  const handleEditPersonalDataChange = useCallback((field) => (e) => {
    setEditPersonalData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // ✅ Handlers optimizados para datos de horarios y plantillas
  const handleScheduleDataChange = useCallback((field, value) => {
    console.log(`🔄 Actualizando scheduleData.${field}:`, value);
    setScheduleData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Todas las funciones existentes (fetchUsers, fetchTiendas, etc.)
  const fetchUsers = () => {
    setCargando(true);
    axios
      .get(`${apiBaseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data);
        setCargando(false);
      })
      .catch(() => {
        setMsg("Error al cargar usuarios ❌");
        setCargando(false);
      });
  };

const handleNewUser = () => {
  if (mostrarFormulario) {
    // Si está abierto, cancelar
    handleCancelar();
  } else {
    // Si está cerrado, abrir modal para nuevo usuario
    setEditingId(null); // Asegurar que no esté en modo edición
    clearAllForms(); // Limpiar el formulario
    setMostrarFormulario(true);
    // ✅ REMOVIDO: Ya no necesitamos scroll porque usamos modal
  }
};

  const fetchTiendas = () => {
    axios
      .get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTiendas(res.data))
      .catch(() => console.error("Error al cargar tiendas"));
  };

  const loadHistory = () => {
    if (!token) return;

    axios.get(`${apiBaseUrl}/api/employees/history`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      setHistoryData(res.data);
    })
    .catch(err => {
      console.error("Error cargando historial:", err);
    });
  };

  const loadScheduleTemplates = useCallback(async (retryCount = 0) => {
    if (!token) {
      console.log("🔍 No token disponible para cargar plantillas");
      return;
    }

    console.log("🔄 Cargando plantillas de horarios...");
    setLoadingSchedules(true);
    
    try {
      const res = await axios.get(`${apiBaseUrl}/api/schedules/templates`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log("✅ Plantillas cargadas:", res.data);
      // Filtrar templates válidos antes de almacenar
      const validTemplates = (res.data || []).filter(template => 
        template && 
        template._id && 
        typeof template === 'object'
      );
      handleScheduleDataChange('templates', validTemplates);
    } catch (err) {
      console.error("❌ Error cargando plantillas:", err);
      
      // Retry hasta 2 veces en caso de error de red
      if (retryCount < 2 && (err.code === 'NETWORK_ERROR' || err.response?.status >= 500)) {
        console.log(`🔄 Reintentando cargar plantillas (intento ${retryCount + 1}/2)...`);
        setTimeout(() => loadScheduleTemplates(retryCount + 1), 1000);
      }
    }
  }, [token, handleScheduleDataChange]);

  const loadEmployeeSchedules = useCallback(async (retryCount = 0) => {
    if (!token) {
      console.log("🔍 No token disponible para cargar horarios de empleados");
      return;
    }

    console.log("🔄 Cargando horarios de empleados...");
    
    try {
      const res = await axios.get(`${apiBaseUrl}/api/schedules?type=assignments`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log("✅ Horarios de empleados cargados:", res.data);
      // Filtrar schedules válidos antes de almacenar
      const validSchedules = (res.data || []).filter(schedule => 
        schedule && 
        schedule._id && 
        typeof schedule === 'object'
      );
      handleScheduleDataChange('employeeSchedules', validSchedules);
    } catch (err) {
      console.error("❌ Error cargando horarios de empleados:", err);
      
      // Retry hasta 2 veces en caso de error de red
      if (retryCount < 2 && (err.code === 'NETWORK_ERROR' || err.response?.status >= 500)) {
        console.log(`🔄 Reintentando cargar horarios de empleados (intento ${retryCount + 1}/2)...`);
        setTimeout(() => loadEmployeeSchedules(retryCount + 1), 1000);
      }
    }
  }, [token, handleScheduleDataChange]);

  // ✅ Función helper para recargar horarios con loading
  const reloadScheduleData = useCallback(async () => {
    console.log("🔄 Recargando datos de horarios...");
    setLoadingSchedules(true);
    
    try {
      // Crear versiones que no manejen loading interno
      const loadTemplatesWithoutLoading = async () => {
        if (!token) return;
        const res = await axios.get(`${apiBaseUrl}/api/schedules/templates`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log("✅ Plantillas cargadas:", res.data);
        // Filtrar templates válidos antes de almacenar
        const validTemplates = (res.data || []).filter(template => 
          template && 
          template._id && 
          typeof template === 'object'
        );
        handleScheduleDataChange('templates', validTemplates);
      };

      const loadEmployeeSchedulesWithoutLoading = async () => {
        if (!token) return;
        const res = await axios.get(`${apiBaseUrl}/api/schedules?type=assignments`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log("✅ Horarios de empleados cargados:", res.data);
        // Filtrar schedules válidos antes de almacenar
        const validSchedules = (res.data || []).filter(schedule => 
          schedule && 
          schedule._id && 
          typeof schedule === 'object'
        );
        handleScheduleDataChange('employeeSchedules', validSchedules);
      };

      await Promise.all([
        loadTemplatesWithoutLoading(),
        loadEmployeeSchedulesWithoutLoading()
      ]);
    } finally {
      setLoadingSchedules(false);
      console.log("🏁 Recarga de horarios completada");
    }
  }, [token, apiBaseUrl, handleScheduleDataChange]);

  useEffect(() => {
    console.log("🚀 Iniciando carga de datos en UsersPage");
    console.log("🔑 Token disponible:", !!token);
    
    if (token) {
      fetchUsers();
      fetchTiendas();
      loadHistory();
      
      // Cargar datos de horarios de forma paralela
      Promise.all([
        loadScheduleTemplates(),
        loadEmployeeSchedules()
      ]).finally(() => {
        setLoadingSchedules(false);
        console.log("🏁 Carga de horarios completada");
      });
    } else {
      console.log("⏳ Esperando token para cargar datos...");
      setLoadingSchedules(false);
    }
  }, [token]); // ✅ Ahora depende del token

  // ✅ NUEVO: Cerrar modales con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (mostrarFormulario) {
          handleCancelar();
        }
        if (editHistorial.id) {
          setEditHistorial(prev => ({...prev, id: null}));
          clearEditStates();
        }
        if (uiState.showScheduleModal) {
          clearScheduleForm();
        }
        if (uiState.editingTemplateId) {
          handleCancelEditTemplate();
        }
        if (uiState.showDeleteModal) {
          cancelDeleteSchedule();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mostrarFormulario, editHistorial.id, uiState.showScheduleModal, uiState.editingTemplateId, uiState.showDeleteModal]);

  // Aquí irían todas las demás funciones como handleCreateTemplate, handleCreateSchedule, etc.
  // Por brevedad, las omito pero deben estar incluidas

  const handleCreateTemplate = async () => {
    if (!templateData.name.trim()) {
      setMsg("El nombre de la plantilla es requerido ❌");
      return;
    }

    setCargando(true);

    try {
      await axios.post(`${apiBaseUrl}/api/schedules/template`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Plantilla de horario creada exitosamente ✅");
      handleUIStateChange('showTemplateForm', false);
      clearTemplateForm();
      loadScheduleTemplates();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al crear plantilla: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  const clearTemplateForm = () => {
    setTemplateData({
      name: "",
      description: "",
      defaultTolerance: 15,
      notes: "",
      schedule: {
        0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
        1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
      }
    });
    handleUIStateChange('editingScheduleId', null);
    handleUIStateChange('showTemplateForm', false);
  };

  const clearScheduleForm = () => {
    // ✅ CORREGIDO: Solo limpiar campos del formulario, conservar templates y employeeSchedules
    handleScheduleDataChange('defaultTolerance', 15);
    handleScheduleDataChange('notes', "");
    handleScheduleDataChange('schedule', {
      0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
      1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
      6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
    });
    
    setScheduleFormType('template');
    setSelectedTemplateId('');
    handleUIStateChange('showScheduleModal', false);
    handleUIStateChange('selectedEmployeeForSchedule', null);
    handleUIStateChange('editingScheduleId', null);
  };

  const handleOpenScheduleForm = (user) => {
    handleUIStateChange('selectedEmployeeForSchedule', user);
    handleUIStateChange('showScheduleModal', true);
  };

  // Funciones para edición inline de plantillas
  const handleEditTemplateInline = (template) => {
    handleUIStateChange('editingTemplateId', template._id);
    handleScheduleDataChange('editingTemplateData', {
      name: template.name || "",
      description: template.description || "",
      defaultTolerance: template.defaultTolerance || 15,
      notes: template.notes || "",
      schedule: template.schedule || {
        0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
        1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
      }
    });
  };

  const handleCancelEditTemplate = () => {
    handleUIStateChange('editingTemplateId', null);
    handleScheduleDataChange('editingTemplateData', {});
    
    // ✅ NUEVO: Recargar horarios después de cancelar edición
    console.log("🔄 Recargando horarios después de cancelar edición de plantilla...");
    reloadScheduleData();
  };

  const handleSaveTemplateInline = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${apiBaseUrl}/api/schedules/${uiState.editingTemplateId}`, scheduleData.editingTemplateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Plantilla actualizada exitosamente ✅");
      handleUIStateChange('editingTemplateId', null);
      handleScheduleDataChange('editingTemplateData', {});
      loadScheduleTemplates();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al actualizar plantilla: ${error.response?.data?.message || error.message} ❌`);
      setTimeout(() => setMsg(""), 5000);
    } finally {
      setCargando(false);
    }
  };

  const templateFormRef = useRef(null);
  
  const handleOpenTemplateForm = () => {
    handleUIStateChange('showTemplateForm', !uiState.showTemplateForm);
    if (!uiState.showTemplateForm) {
      // Si se está abriendo el formulario, hacer scroll
      setTimeout(() => {
        if (templateFormRef.current) {
          templateFormRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users/deleted`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletedUsers(response.data);
    } catch (error) {
      console.error('Error obteniendo usuarios eliminados:', error);
      setMsg("Error al cargar usuarios eliminados ❌");
    }
  };

  const handleRestore = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de restaurar al usuario ${username}?`)) return;
    
    try {
      setCargando(true);
      await axios.patch(`${apiBaseUrl}/api/users/${userId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMsg("Usuario restaurado exitosamente ✅");
      fetchUsers();
      fetchDeletedUsers();
      
      // ✅ NUEVO: Recargar también los datos de horarios
      await reloadScheduleData();
      
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al restaurar usuario: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${username}?`)) return;
    
    setCargando(true);
    try {
      await axios.delete(`${apiBaseUrl}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMsg("Usuario eliminado exitosamente ✅");
      fetchUsers();
      loadHistory();
      
      // ✅ Usar función helper para recargar horarios
      await reloadScheduleData();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    setEditingId(null);
    clearAllForms();
    setMostrarFormulario(false);
    
    // ✅ NUEVO: Recargar horarios después de cancelar creación/edición de usuario
    console.log("🔄 Recargando horarios después de cancelar usuario...");
    reloadScheduleData();
  };

  // ✅ Optimizado: Función de limpieza consolidada
  const clearAllForms = useCallback(() => {
    setForm({
      username: "",
      password: "",
      role: "vendedor",
      tienda: "",
      telefono: "",
    });
    setHistorialLaboral({
      sueldoDiario: "",
      seguroSocial: false,
      startDate: "",
      position: "Empleado",
      notes: ""
    });
    setPersonalData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      rfc: "",
      curp: "",
      numeroSeguroSocial: "",
      attachments: []
    });
    clearScheduleForm();
    clearTemplateForm();
  }, []);

  // ✅ Optimizado: Filtrar usuarios con useMemo para evitar recálculos innecesarios
  const filteredUsers = useMemo(() => {
    return (users || []).filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.telefono?.includes(searchTerm) ||
        user.tienda?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filtroRole === "" || user.role === filtroRole;
      const matchesTienda = filtroTienda === "" || user.tienda?._id === filtroTienda;
      
      return matchesSearch && matchesRole && matchesTienda;
    });
  }, [users, searchTerm, filtroRole, filtroTienda]);

  // ✅ Optimizado: Estadísticas de usuarios con useMemo
  const userStats = useMemo(() => {
    const safeUsers = users || [];
    return {
      total: safeUsers.length,
      vendedores: safeUsers.filter(u => u.role === 'vendedor').length,
      administradores: safeUsers.filter(u => u.role === 'admin').length,
      repartidores: safeUsers.filter(u => u.role === 'repartidor').length,
    };
  }, [users]);

  const stats = userStats;

  const getRoleConfig = (role) => {
    const configs = {
      'admin': { icon: '👑', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Administrador' },
      'vendedor': { icon: '🛒', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Vendedor' },
      'repartidor': { icon: '🚚', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Repartidor' }
    };
    return configs[role] || { icon: '👤', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', label: role };
  };
  
  // ✅ Función para crear horario personalizado
  const handleCreateSchedule = async (employeeId, tiendaId) => {
    if (!employeeId || !tiendaId) {
      setMsg("Se requiere empleado y tienda para crear horario ❌");
      return;
    }

    setCargando(true);

    try {
      const payload = {
        employee: employeeId,
        tienda: tiendaId,
        schedule: scheduleData.schedule,
        defaultTolerance: scheduleData.defaultTolerance,
        notes: scheduleData.notes
      };

      await axios.post(`${apiBaseUrl}/api/schedules`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Horario creado exitosamente ✅");
      clearScheduleForm();
      loadEmployeeSchedules();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al crear horario: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // ✅ Asignar horario a empleado (usando plantilla o personalizado)
  const handleAssignSchedule = async (employeeId, tiendaId) => {
    if (!employeeId || !tiendaId) {
      setMsg("Se requiere empleado y tienda para asignar horario ❌");
      return;
    }

    setCargando(true);

    try {
      const payload = {
        employeeId
      };

      if (scheduleFormType === 'template' && selectedTemplateId) {
        payload.templateId = selectedTemplateId;
      } else if (scheduleFormType === 'custom') {
        payload.customSchedule = scheduleData;
      } else {
        setMsg("Selecciona una plantilla o configura un horario personalizado ❌");
        setCargando(false);
        return;
      }

      await axios.post(`${apiBaseUrl}/api/schedules/assign`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Horario asignado exitosamente ✅");
      clearScheduleForm();
      loadEmployeeSchedules();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al asignar horario: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // ✅ Actualizar horario existente
  const handleUpdateSchedule = async (scheduleId) => {
    setCargando(true);

    try {
      await axios.put(`${apiBaseUrl}/api/schedules/${scheduleId}`, scheduleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Horario actualizado exitosamente ✅");
      handleUIStateChange('editingScheduleId', null);
      clearScheduleForm();
      loadEmployeeSchedules();
      loadScheduleTemplates();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al actualizar horario: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // ✅ Eliminar horario o plantilla
  const handleDeleteSchedule = (scheduleId, isTemplate = false) => {
    const scheduleToDelete = isTemplate 
      ? (scheduleData.templates || []).find(t => t._id === scheduleId)
      : (scheduleData.employeeSchedules || []).find(s => s._id === scheduleId);
    
    handleUIStateChange('deleteCandidate', {
      id: scheduleId,
      isTemplate,
      data: scheduleToDelete
    });
    handleUIStateChange('deleteError', null);
    handleUIStateChange('showDeleteModal', true);
  };

  const confirmDeleteSchedule = async () => {
    if (!uiState.deleteCandidate) return;

    setCargando(true);
    handleUIStateChange('showDeleteModal', false);

    try {
      await axios.delete(`${apiBaseUrl}/api/schedules/${uiState.deleteCandidate.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const successText = uiState.deleteCandidate.isTemplate ? "Plantilla eliminada exitosamente ✅" : "Horario eliminado exitosamente ✅";
      setMsg(successText);
      
      if (uiState.deleteCandidate.isTemplate) {
        loadScheduleTemplates();
      } else {
        loadEmployeeSchedules();
      }
      
      handleUIStateChange('deleteCandidate', null);
      handleUIStateChange('deleteError', null);
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      // Mostrar error específico en el modal
      const errorMessage = error.response?.data?.message || error.message;
      handleUIStateChange('deleteError', errorMessage);
    } finally {
      setCargando(false);
    }
  };

  const cancelDeleteSchedule = () => {
    handleUIStateChange('showDeleteModal', false);
    handleUIStateChange('deleteCandidate', null);
    handleUIStateChange('deleteError', null);
  };

  // ✅ Función para actualizar día específico del horario
  const updateScheduleDay = (day, field, value, isTemplate = false) => {
    if (isTemplate) {
      setTemplateData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            [field]: value
          }
        }
      }));
    } else {
      setScheduleData(prev => ({
        ...prev,
        schedule: {
          ...(prev.schedule || {}),
          [day]: {
            ...(prev.schedule?.[day] || {}),
            [field]: value
          }
        }
      }));
    }
  };

  // ✅ Función para ver detalles de un horario
  const handleViewScheduleDetails = (schedule) => {
    alert(`Detalles del horario de ${schedule.employee?.username}:\n\n` +
      Object.entries(schedule.schedule || {})
        .map(([dayIndex, dayInfo]) => 
          `${dayNames[parseInt(dayIndex)]}: ${
            dayInfo.isWorkday 
              ? `${dayInfo.startTime} - ${dayInfo.endTime} (±${dayInfo.tolerance}min)`
              : 'Descanso'
          }`
        ).join('\n') +
      `\n\nTolerancia por defecto: ${schedule.defaultTolerance} minutos` +
      (schedule.notes ? `\nNotas: ${schedule.notes}` : '') +
      (schedule.templateName ? `\nBasado en plantilla: ${schedule.templateName}` : '')
    );
  };

  // ✅ Función helper para verificar si un usuario tiene horario asignado activo
  const userHasActiveSchedule = (userId) => {
    return (scheduleData.employeeSchedules || []).some(schedule => 
      schedule.employee?._id === userId && schedule.isActive === true
    );
  };

  // ✅ Cargar datos para edición
// ✅ Cargar datos para edición CON SCROLL AUTOMÁTICO
const loadScheduleForEdit = (schedule, isTemplate = false) => {
  if (isTemplate) {
    // Usar edición inline para plantillas
    handleEditTemplateInline(schedule);
  } else {
    // Cargar horario de empleado para edición
    handleScheduleDataChange('defaultTolerance', schedule.defaultTolerance || 15);
    handleScheduleDataChange('notes', schedule.notes || "");
    handleScheduleDataChange('schedule', schedule.schedule || {});
    handleUIStateChange('editingScheduleId', schedule._id);
    handleUIStateChange('selectedEmployeeForSchedule', schedule.employee);
    handleUIStateChange('showScheduleModal', true);
    setScheduleFormType('custom');
  }
};

  // ✅ Función para actualizar plantilla
  const handleUpdateTemplate = async (templateId) => {
    if (!templateData.name.trim()) {
      setMsg("El nombre de la plantilla es requerido ❌");
      return;
    }

    setCargando(true);

    try {
      await axios.put(`${apiBaseUrl}/api/schedules/${templateId}`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Plantilla actualizada exitosamente ✅");
      handleUIStateChange('editingScheduleId', null);
      handleUIStateChange('showTemplateForm', false);
      clearTemplateForm();
      loadScheduleTemplates();
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al actualizar plantilla: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // Función handleSubmit para crear/actualizar usuarios
  const handleSubmit = async (e) => {
    e.preventDefault();

   if (!form.username || (!editingId && !form.password)) {
    setMsg("Por favor completa todos los campos requeridos ❌");
    return;
  }

  const phoneNumbers = getPhoneNumbers(form.telefono);
  if (form.telefono && phoneNumbers.length !== 10) {
    setMsg("El teléfono debe tener exactamente 10 dígitos ❌");
    return;
  }
  if (form.telefono && phoneNumbers.startsWith('0')) {
    setMsg("El teléfono no puede empezar con 0 ❌");
    return;
  }

    if (!editingId) {
      if (!historialLaboral.sueldoDiario || !historialLaboral.startDate || !personalData.nombre || !personalData.apellidoPaterno || !personalData.apellidoMaterno) {
        setMsg("Se requieren todos los campos obligatorios: sueldo, fecha de ingreso, nombre y apellidos ❌");
        return;
      }
      
      if (parseFloat(historialLaboral.sueldoDiario) <= 0) {
        setMsg("El sueldo diario debe ser mayor a 0 ❌");
        return;
      }
    }

    setCargando(true);

    const payload = {
      username: form.username,
      role: form.role,
      telefono: phoneNumbers,
    };

    if (!editingId) payload.password = form.password;

    if (form.role !== "admin") {
      payload.tienda = form.tienda;
    }

    const url = editingId
      ? `${apiBaseUrl}/api/users/${editingId}`
      : `${apiBaseUrl}/api/users`;

    const method = editingId ? "put" : "post";

    try {
      const userResponse = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!editingId) {
        const historyPayload = {
          employee: userResponse.data._id || userResponse.data.id,
          tienda: form.tienda,
          sueldoDiario: parseFloat(historialLaboral.sueldoDiario),
          seguroSocial: historialLaboral.seguroSocial,
          startDate: historialLaboral.startDate,
          position: historialLaboral.position.trim() || "Empleado",
          nombre: personalData.nombre.trim(),
          apellidoPaterno: personalData.apellidoPaterno.trim(),
          apellidoMaterno: personalData.apellidoMaterno.trim(),
          rfc: personalData.rfc.trim() || null,
          curp: personalData.curp.trim() || null,
          numeroSeguroSocial: personalData.numeroSeguroSocial.trim() || null,
        };


        if (historialLaboral.notes && historialLaboral.notes.trim()) {
          historyPayload.notes = historialLaboral.notes.trim();
        }

        await axios.post(`${apiBaseUrl}/api/employees/history`, historyPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setMsg(editingId ? "Usuario actualizado exitosamente ✅" : "Usuario y registro laboral creados exitosamente ✅");
      clearAllForms();
      setMostrarFormulario(false);
      fetchUsers();
      loadHistory();
      
      // ✅ NUEVO: Recargar también los datos de horarios
      await reloadScheduleData();
      
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error("Error detallado:", error.response?.data || error);
      setMsg(`Error al ${editingId ? "actualizar" : "crear"} usuario: ${error.response?.data?.message || error.message} ❌`);
      setCargando(false);
    }
  };

  const handleUpdateHistory = async (id) => {
    setCargando(true);
    const payload = {
      // Datos laborales existentes
      endDate: editHistorial.endDate || null,
      seguroSocial: editHistorial.seguro,
      motivoBaja: editHistorial.motivo,
      razonBaja: editHistorial.razon,
      sueldoDiario: editHistorial.sueldo ? parseFloat(editHistorial.sueldo) : undefined,
      position: editHistorial.position,
      notes: editHistorial.notes,
      
      // ✅ CAMPOS PERSONALES QUE FALTABAN
      nombre: editPersonalData.nombre?.trim() || null,
      apellidoPaterno: editPersonalData.apellidoPaterno?.trim() || null,
      apellidoMaterno: editPersonalData.apellidoMaterno?.trim() || null,
      rfc: editPersonalData.rfc?.trim() || null,
      curp: editPersonalData.curp?.trim() || null,
      numeroSeguroSocial: editPersonalData.numeroSeguroSocial?.trim() || null
    };

    try {
      await axios.put(`${apiBaseUrl}/api/employees/history/${id}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setMsg("Historial actualizado exitosamente ✅");
      setEditHistorial(prev => ({...prev, id: null}));
      loadHistory();
      
      // ✅ NUEVO: Recargar también los datos de horarios
      await reloadScheduleData();
      
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Error al actualizar historial:", err);
      setMsg(`Error al actualizar historial: ${err.response?.data?.message || err.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // ✅ FUNCIÓN AUXILIAR para limpiar estados de edición
  // ✅ Función optimizada para limpiar estados de edición
  const clearEditStates = useCallback(() => {
    setEditHistorial({
      id: null,
      endDate: "",
      seguro: false,
      motivo: "",
      razon: "",
      sueldo: "",
      position: "",
      notes: ""
    });
    setEditPersonalData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      rfc: "",
      curp: "",
      numeroSeguroSocial: ""
    });
    
    // ✅ NUEVO: Recargar horarios después de limpiar estados
    console.log("🔄 Recargando horarios después de cancelar edición...");
    reloadScheduleData();
  }, [reloadScheduleData]);

  const handleDeleteHistory = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro laboral?")) return;

    setCargando(true);
    try {
      await axios.delete(`${apiBaseUrl}/api/employees/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Historial eliminado exitosamente ✅");
      loadHistory();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(`Error al eliminar historial: ${err.response?.data?.message || err.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

const handleEdit = (user) => {
  setForm({
    username: user.username,
    password: "",
    role: user.role,
    tienda: user.tienda?._id || "",
    telefono: user.telefono || "",
  });
  setEditingId(user._id);
  setMostrarFormulario(true);
  // ✅ REMOVIDO: Ya no necesitamos scroll porque usamos modal
};

const getPhoneNumbers = (formattedPhone) => {
  return formattedPhone.replace(/\D/g, '');
};

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
                Gestión de Usuarios
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Administra usuarios, roles, permisos y registros laborales del sistema
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleOpenTemplateForm}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#8b5cf6' }}
                disabled={cargando}
              >
                {uiState.showTemplateForm ? "Cancelar" : "Nueva Jornada"}
              </button>
              
              <button
                onClick={() => {
                  handleUIStateChange('showDeletedUsers', !uiState.showDeletedUsers);
                  if (!uiState.showDeletedUsers) {
                    fetchDeletedUsers();
                    // Scroll automático a la sección de usuarios eliminados
                    setTimeout(() => {
                      if (deletedUsersRef.current) {
                        deletedUsersRef.current.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }
                    }, 100);
                  }
                }}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ 
                  backgroundColor: uiState.showDeletedUsers ? '#ef4444' : '#6b7280',
                  color: 'white'
                }}
                disabled={cargando}
              >
                {uiState.showDeletedUsers ? "Ocultar Eliminados" : "Ver Eliminados"}
              </button>
              
              <button
                onClick={handleNewUser}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={cargando}
              >
                {mostrarFormulario ? "Cancelar" : "Nuevo Usuario"}
              </button>
            </div>
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

        {/* Estadísticas de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e' }}>
                👥
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {stats.total}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Total Usuarios
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-100">
                🛒
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.vendedores}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Vendedores
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-purple-100">
                👑
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.administradores}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Administradores
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-blue-100">
                🚚
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.repartidores}
                </div>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Repartidores
                </div>
              </div>
            </div>
          </div>
        </div>

{/* Formulario de plantilla de horario */}
        {uiState.showTemplateForm && (
          <div ref={templateFormRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              {uiState.editingScheduleId ? "Editar Plantilla de Horario" : "Crear Nueva Plantilla de Horario"}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nombre de la plantilla *
                  </label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                    placeholder="Ej: Horario Matutino"
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
                    Tolerancia por defecto (minutos)
                  </label>
                  <input
                    type="number"
                    value={templateData.defaultTolerance}
                    onChange={(e) => setTemplateData({...templateData, defaultTolerance: parseInt(e.target.value) || 0})}
                    min="0"
                    max="60"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Descripción de la plantilla
                </label>
                <input
                  type="text"
                  value={templateData.description}
                  onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                  placeholder="Ej: Horario de lunes a viernes de 9:00 a 18:00"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Notas adicionales
                </label>
                <input
                  type="text"
                  value={templateData.notes}
                  onChange={(e) => setTemplateData({...templateData, notes: e.target.value})}
                  placeholder="Notas opcionales sobre esta plantilla"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
              </div>

              {/* Horarios por día de la semana para plantillas */}
              <div>
                <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                  Configuración de Horarios por Día
                </h3>
                
                <div className="space-y-4">
                  {dayNames.map((dayName, dayIndex) => (
                    <div key={dayIndex} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={templateData.schedule[dayIndex]?.isWorkday || false}
                            onChange={(e) => updateScheduleDay(dayIndex, 'isWorkday', e.target.checked, true)}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                            style={{ accentColor: '#23334e' }}
                          />
                          <span className="text-lg font-medium" style={{ color: '#23334e' }}>
                            {dayName}
                          </span>
                        </label>
                        {templateData.schedule[dayIndex]?.isWorkday && (
                          <div className="ml-auto text-sm" style={{ color: '#697487' }}>
                            Día laboral activo
                          </div>
                        )}
                      </div>
                      
                      {templateData.schedule[dayIndex]?.isWorkday && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                              Hora de entrada
                            </label>
                            <input
                              type="time"
                              value={templateData.schedule[dayIndex]?.startTime || ""}
                              onChange={(e) => updateScheduleDay(dayIndex, 'startTime', e.target.value, true)}
                              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                              style={{ 
                                borderColor: '#e5e7eb',
                                focusRingColor: '#23334e'
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                              Hora de salida
                            </label>
                            <input
                              type="time"
                              value={templateData.schedule[dayIndex]?.endTime || ""}
                              onChange={(e) => updateScheduleDay(dayIndex, 'endTime', e.target.value, true)}
                              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                              style={{ 
                                borderColor: '#e5e7eb',
                                focusRingColor: '#23334e'
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                              Tolerancia específica (min)
                            </label>
                            <input
                              type="number"
                              value={templateData.schedule[dayIndex]?.tolerance === 0 ? "" : (templateData.schedule[dayIndex]?.tolerance || "")}
                              onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                              updateScheduleDay(dayIndex, 'tolerance', value, true);
                            }}
                              min="0"
                              max="60"
                              placeholder={`Por defecto: ${templateData.defaultTolerance}`}
                              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                              style={{ 
                                borderColor: '#e5e7eb',
                                focusRingColor: '#23334e'
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {!templateData.schedule[dayIndex]?.isWorkday && (
                        <div className="text-center py-4 text-gray-500">
                          <span className="text-2xl">😴</span>
                          <div className="text-sm mt-2">Día de descanso</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de la plantilla */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-3">📊 Resumen de la Plantilla</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Días laborales:</span>
                    <div className="text-purple-800">
                      {Object.values(templateData.schedule || {}).filter(day => day.isWorkday).length} días
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Días de descanso:</span>
                    <div className="text-purple-800">
                      {Object.values(templateData.schedule || {}).filter(day => !day.isWorkday).length} días
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Tolerancia general:</span>
                    <div className="text-purple-800">
                      {templateData.defaultTolerance} minutos
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {uiState.editingScheduleId ? (
                  <button
                    onClick={() => handleUpdateTemplate(uiState.editingScheduleId)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando}
                  >
                    {cargando ? "Actualizando..." : "Actualizar Plantilla"}
                  </button>
                ) : (
                  <button
                    onClick={handleCreateTemplate}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando}
                  >
                    {cargando ? "Creando..." : "Crear Plantilla"}
                  </button>
                )}
                <button
                  onClick={clearTemplateForm}
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
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por rol
                </label>
                <select
                  value={filtroRole}
                  onChange={(e) => setFiltroRole(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">👑 Administrador</option>
                  <option value="vendedor">🛒 Vendedor</option>
                  <option value="repartidor">🚚 Repartidor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por tienda
                </label>
                <select
                  value={filtroTienda}
                  onChange={(e) => setFiltroTienda(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                >
                  <option value="">Todas las tiendas</option>
                  {(tiendas || []).map((t) => (
                    <option key={t._id} value={t._id}>
                      🏪 {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                    {filteredUsers.length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Resultados
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Buscar usuarios
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por usuario, teléfono o tienda..."
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

        {/* Lista de usuarios */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay usuarios
              </h3>
              <p style={{ color: '#697487' }}>
                {searchTerm || filtroRole || filtroTienda
                  ? "No se encontraron resultados para los filtros aplicados"
                  : "Comienza agregando tu primer usuario al sistema"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {(filteredUsers || []).map((user, index) => {
                const roleConfig = getRoleConfig(user.role);
                
                return (
                  <div 
                    key={user._id} 
                    className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Información del usuario */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: roleConfig.color }}>
                            {roleConfig.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                              {user.username}
                            </h3>
                            <p className="text-sm" style={{ color: '#697487' }}>
                              ID: #{user._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                              🏷️
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                Rol
                              </div>
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${roleConfig.bgColor} ${roleConfig.textColor}`}>
                                {roleConfig.icon} {roleConfig.label}
                              </span>
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
                                {user.telefono || "No especificado"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                              🏪
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                Tienda Asignada
                              </div>
                              <div style={{ color: '#23334e' }}>
                                {user.tienda?.nombre || (user.role === 'admin' ? 'Todas las tiendas' : 'Sin asignar')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* ✅ Indicador de horario asignado para no-admins */}
                        {user.role !== 'admin' && (
                          <div className="flex items-center gap-2 mt-3">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" 
                                 style={{ backgroundColor: userHasActiveSchedule(user._id) ? '#dcfce7' : '#fef3c7', 
                                          color: userHasActiveSchedule(user._id) ? '#166534' : '#92400e' }}>
                              {userHasActiveSchedule(user._id) ? '✅' : '⏰'}
                            </div>
                            <div>
                              <div className="text-xs font-medium" style={{ color: '#46546b' }}>
                                Estado de Horario
                              </div>
                              <div className="text-sm" style={{ 
                                color: userHasActiveSchedule(user._id) ? '#166534' : '#92400e' 
                              }}>
                                {userHasActiveSchedule(user._id) ? 'Horario Asignado' : 'Sin Horario'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                     {/* Acciones del usuario */}
                      <div className="flex gap-3">
                        {/* ✅ Solo mostrar botón de horario para vendedores/repartidores SIN horario asignado */}
                        {user.role !== 'admin' && !userHasActiveSchedule(user._id) && (
                          <button
                            onClick={() => handleOpenScheduleForm(user)}
                            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            style={{ 
                              backgroundColor: '#8b5cf6',
                              color: 'white'
                            }}
                            disabled={cargando}
                          >
                            📅 Horario
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                          style={{ 
                            backgroundColor: '#f59e0b',
                            color: 'white'
                          }}
                          disabled={cargando}
                        >
                          ✏️ Editar
                        </button>
                        
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                          style={{ 
                            backgroundColor: '#ef4444',
                            color: 'white'
                          }}
                          disabled={cargando}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal para editar usuario */}
        {mostrarFormulario && editingId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelar();
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    Editar Usuario
                  </h2>
                  <button
                    onClick={handleCancelar}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Sección de datos de usuario */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                      Información del Usuario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Nombre de Usuario *
                        </label>
                        <input
                          type="text"
                          value={form.username}
                          onChange={handleUsernameChange}
                          placeholder="Ej: juan.perez"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                          disabled={cargando}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Teléfono de Contacto *
                        </label>
                        <input
                          type="text"
                          value={form.telefono}
                          onChange={handleTelefonoChange}
                          placeholder="Ej: (644) 123-4567"
                          maxLength="14"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                          disabled={cargando}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Solo números, 10 dígitos, no puede empezar con 0
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Rol del Usuario *
                        </label>
                        <select
                          value={form.role}
                          onChange={handleRoleChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                          disabled={cargando}
                        >
                          <option value="vendedor">🛒 Vendedor</option>
                          <option value="admin">👑 Administrador</option>
                          <option value="repartidor">🚚 Repartidor</option>
                        </select>
                      </div>

                      {form.role !== "admin" && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                            Tienda Asignada *
                          </label>
                          <select
                            value={form.tienda}
                            onChange={handleTiendaChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                            disabled={cargando}
                            required={form.role !== "admin"}
                          >
                            <option value="">-- Selecciona tienda --</option>
                            {(tiendas || []).map((t) => (
                              <option key={t._id} value={t._id}>
                                🏪 {t.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCancelar}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50"
                      disabled={cargando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#23334e' }}
                      disabled={cargando}
                    >
                      {cargando ? 'Guardando...' : 'Actualizar Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear nuevo usuario */}
        {mostrarFormulario && !editingId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelar();
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    Crear Nuevo Usuario
                  </h2>
                  <button
                    onClick={handleCancelar}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
            
            <form onSubmit={handleSubmit}>
              {/* Sección de datos de usuario */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                  Información del Usuario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={handleUsernameChange}
                      placeholder="Ej: juan.perez"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                      required
                    />
                  </div>

                  {!editingId && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={handlePasswordChange}
                        placeholder="Contraseña segura"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={handleTelefonoChange}
                      placeholder="Ej: (644) 123-4567"
                      maxLength="14" // (xxx) xxx-xxxx = 14 caracteres
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Solo números, 10 dígitos, no puede empezar con 0
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Rol del Usuario *
                    </label>
                    <select
                      value={form.role}
                      onChange={handleRoleChange}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    >
                      <option value="vendedor">🛒 Vendedor</option>
                      <option value="admin">👑 Administrador</option>
                      <option value="repartidor">🚚 Repartidor</option>
                    </select>
                  </div>

                  {form.role !== "admin" && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Tienda Asignada {form.role !== "admin" ? "*" : ""}
                      </label>
                      <select
                        value={form.tienda}
                        onChange={handleTiendaChange}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                        required={form.role !== "admin"}
                      >
                        <option value="">-- Selecciona tienda --</option>
                        {(tiendas || []).map((t) => (
                          <option key={t._id} value={t._id}>
                            🏪 {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección de datos laborales (solo para nuevos usuarios) */}
              {!editingId && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                    Registro Laboral (Requerido)
                  </h3>

                  {/* Datos personales */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-3" style={{ color: '#46546b' }}>
                      Datos Personales
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={personalData.nombre}
                          onChange={handlePersonalDataChange('nombre')}
                          placeholder="Nombre(s)"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Apellido Paterno *
                        </label>
                        <input
                          type="text"
                          value={personalData.apellidoPaterno}
                          onChange={handlePersonalDataChange('apellidoPaterno')}
                          placeholder="Apellido paterno"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Apellido Materno *
                        </label>
                        <input
                          type="text"
                          value={personalData.apellidoMaterno}
                          onChange={handlePersonalDataChange('apellidoMaterno')}
                          placeholder="Apellido materno"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          RFC
                        </label>
                        <input
                          type="text"
                          value={personalData.rfc}
                          onChange={(e) => setPersonalData(prev => ({...prev, rfc: e.target.value.toUpperCase()}))}
                          placeholder="AAAA000000AAA"
                          maxLength="13"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          CURP
                        </label>
                        <input
                          type="text"
                          value={personalData.curp}
                          onChange={(e) => setPersonalData(prev => ({...prev, curp: e.target.value.toUpperCase()}))}
                          placeholder="AAAA000000AAAAAA00"
                          maxLength="18"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Número de Seguro Social
                        </label>
                        <input
                          type="text"
                          value={personalData.numeroSeguroSocial}
                          onChange={(e) => setPersonalData(prev => ({...prev, numeroSeguroSocial: e.target.value}))}
                          placeholder="00000000000"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          disabled={cargando}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Sueldo Diario *
                      </label>
                      <input
                        type="number"
                        value={historialLaboral.sueldoDiario}
                        onChange={handleHistorialLaboralChange('sueldoDiario')}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Fecha de Ingreso *
                      </label>
                      <input
                        type="date"
                        value={historialLaboral.startDate}
                        onChange={(e) => setHistorialLaboral(prev => ({...prev, startDate: e.target.value}))}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Posición
                      </label>
                      <input
                        type="text"
                        value={historialLaboral.position}
                        onChange={(e) => setHistorialLaboral(prev => ({...prev, position: e.target.value}))}
                        placeholder="Ej: Empleado, Supervisor"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                      />
                    </div>
					

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Notas Adicionales
                      </label>
                      <textarea
                        value={historialLaboral.notes}
                        onChange={(e) => setHistorialLaboral(prev => ({...prev, notes: e.target.value}))}
                        placeholder="Comentarios adicionales sobre el empleado"
                        rows="3"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={historialLaboral.seguroSocial}
                          onChange={(e) => setHistorialLaboral(prev => ({...prev, seguroSocial: e.target.checked}))}
                          className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                          style={{ accentColor: '#23334e' }}
                          disabled={cargando}
                        />
                        <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                          Seguro Social
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? (editingId ? "Actualizando..." : "Creando...") : (editingId ? "Actualizar Usuario" : "Crear Usuario y Registro")}
                </button>
                <button
                  type="button"
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
            </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar historial laboral */}
        {editHistorial.id && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditHistorial(prev => ({...prev, id: null}));
                clearEditStates();
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    📝 Editar Historial Laboral
                  </h2>
                  <button
                    onClick={() => {
                      setEditHistorial(prev => ({...prev, id: null}));
                      clearEditStates();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Datos Personales */}
                  <div>
                    <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                      👤 Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Nombre *
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.nombre} 
                          onChange={handleEditPersonalDataChange('nombre')} 
                          placeholder="Nombre"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Apellido Paterno *
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.apellidoPaterno} 
                          onChange={handleEditPersonalDataChange('apellidoPaterno')} 
                          placeholder="Apellido Paterno"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Apellido Materno *
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.apellidoMaterno} 
                          onChange={handleEditPersonalDataChange('apellidoMaterno')} 
                          placeholder="Apellido Materno"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          RFC
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.rfc} 
                          onChange={handleEditPersonalDataChange('rfc')} 
                          placeholder="RFC"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          CURP
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.curp} 
                          onChange={handleEditPersonalDataChange('curp')} 
                          placeholder="CURP"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Número de Seguro Social
                        </label>
                        <input 
                          type="text"
                          value={editPersonalData.numeroSeguroSocial} 
                          onChange={handleEditPersonalDataChange('numeroSeguroSocial')} 
                          placeholder="Número de Seguro Social"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información Laboral */}
                  <div>
                    <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                      💼 Información Laboral
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Sueldo Diario ($) *
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={editHistorial.sueldo} 
                          onChange={handleEditHistorialChange('sueldo')} 
                          placeholder="0.00"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Posición/Cargo
                        </label>
                        <input 
                          type="text"
                          value={editHistorial.position} 
                          onChange={handleEditHistorialChange('position')} 
                          placeholder="Ej: Vendedor, Cajero, etc."
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Fecha de Salida
                        </label>
                        <input 
                          type="date" 
                          value={editHistorial.endDate} 
                          onChange={handleEditHistorialChange('endDate')} 
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                          style={{ 
                            borderColor: '#e5e7eb',
                            focusRingColor: '#23334e'
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editHistorial.seguro} 
                            onChange={handleEditHistorialChange('seguro')} 
                            className="w-5 h-5 rounded border-gray-300 focus:ring-2"
                            style={{ accentColor: '#23334e' }}
                          />
                          <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                            🏥 Seguro Social
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Motivos de Baja (solo si hay fecha de salida) */}
                  {editHistorial.endDate && (
                    <div>
                      <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                        📋 Información de Baja
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                            Motivo de Baja
                          </label>
                          <select 
                            value={editHistorial.motivo} 
                            onChange={handleEditHistorialChange('motivo')}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                          >
                            <option value="">Seleccionar motivo</option>
                            <option value="renuncia">Renuncia</option>
                            <option value="despido">Despido</option>
                            <option value="termino-contrato">Término de contrato</option>
                            <option value="reduccion-personal">Reducción de personal</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                            Razón de Baja
                          </label>
                          <textarea 
                            value={editHistorial.razon} 
                            onChange={handleEditHistorialChange('razon')} 
                            placeholder="Descripción detallada..."
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                            rows="3"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      📝 Notas Adicionales
                    </label>
                    <textarea 
                      value={editHistorial.notes} 
                      onChange={handleEditHistorialChange('notes')} 
                      placeholder="Observaciones, comentarios adicionales..."
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      rows="3"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-6 border-t mt-6">
                  <button 
                    onClick={() => {
                      setEditHistorial(prev => ({...prev, id: null}));
                      clearEditStates();
                    }} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50"
                    disabled={cargando}
                  >
                    ❌ Cancelar
                  </button>
                  <button 
                    onClick={() => handleUpdateHistory(editHistorial.id)} 
                    className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#23334e' }}
                    disabled={cargando}
                  >
                    {cargando ? "💾 Guardando..." : "💾 Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
		
		{/* ✅ Modal de asignación/edición de horarios */}
        {uiState.showScheduleModal && uiState.selectedEmployeeForSchedule && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={clearScheduleForm}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header con botón de cerrar */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    {uiState.editingScheduleId ? "Editar Horario" : `Asignar Horario a: ${uiState.selectedEmployeeForSchedule.username}`}
                  </h2>
                  <button
                    onClick={clearScheduleForm}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>
            
            <div className="space-y-6">
              {/* Tipo de asignación */}
              {!uiState.editingScheduleId && (
                <div>
                  <label className="block text-sm font-medium mb-4" style={{ color: '#46546b' }}>
                    Tipo de horario
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      scheduleFormType === 'template' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="template"
                        checked={scheduleFormType === 'template'}
                        onChange={(e) => setScheduleFormType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          scheduleFormType === 'template' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                        }`}>
                          {scheduleFormType === 'template' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: '#23334e' }}>Usar Plantilla</div>
                          <div className="text-sm" style={{ color: '#697487' }}>Seleccionar de plantillas predefinidas</div>
                        </div>
                      </div>
                    </label>

                    <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      scheduleFormType === 'custom' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="custom"
                        checked={scheduleFormType === 'custom'}
                        onChange={(e) => setScheduleFormType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          scheduleFormType === 'custom' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                        }`}>
                          {scheduleFormType === 'custom' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: '#23334e' }}>Horario Personalizado</div>
                          <div className="text-sm" style={{ color: '#697487' }}>Configurar horario específico</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Selección de plantilla */}
              {scheduleFormType === 'template' && !uiState.editingScheduleId && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Seleccionar Plantilla
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  >
                    <option value="">-- Seleccionar plantilla --</option>
                    {(scheduleData.templates || []).filter(template => template && template._id).map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name || 'Sin nombre'} - {template.description || 'Sin descripción'}
                      </option>
                    ))}
                  </select>
                  
                  {/* Preview de la plantilla seleccionada */}
                  {selectedTemplateId && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      {(() => {
                        const selectedTemplate = (scheduleData.templates || []).find(t => t && t._id === selectedTemplateId);
                        if (!selectedTemplate) return null;
                        
                        return (
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">Vista Previa: {selectedTemplate.name || 'Sin nombre'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {Object.entries(selectedTemplate.schedule || {}).map(([dayIndex, dayInfo]) => (
                                <div key={dayIndex} className="flex justify-between">
                                  <span className="text-purple-700">{dayNames[parseInt(dayIndex)]}:</span>
                                  <span className="text-purple-800 font-medium">
                                    {dayInfo.isWorkday 
                                      ? `${dayInfo.startTime} - ${dayInfo.endTime}`
                                      : 'Descanso'
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Configuración personalizada o edición */}
              {(scheduleFormType === 'custom' || uiState.editingScheduleId) && (
                <>
                  {/* Configuración general */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Tolerancia por defecto (minutos)
                      </label>
                      <input
                        type="number"
                        value={scheduleData.defaultTolerance}
                        onChange={(e) => handleScheduleDataChange('defaultTolerance', parseInt(e.target.value) || 0)}
                        min="0"
                        max="60"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Notas del horario
                      </label>
                      <input
                        type="text"
                        value={scheduleData.notes}
                        onChange={(e) => handleScheduleDataChange('notes', e.target.value)}
                        placeholder="Notas adicionales"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                      />
                    </div>
                  </div>

                  {/* Horarios por día */}
                  <div>
                    <h3 className="text-lg font-medium mb-4" style={{ color: '#46546b' }}>
                      Horarios por día de la semana
                    </h3>
                    
                    <div className="space-y-4">
                      {dayNames.map((dayName, dayIndex) => (
                        <div key={dayIndex} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={scheduleData.schedule?.[dayIndex]?.isWorkday || false}
                                onChange={(e) => updateScheduleDay(dayIndex, 'isWorkday', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                                style={{ accentColor: '#23334e' }}
                              />
                              <span className="text-lg font-medium" style={{ color: '#23334e' }}>
                                {dayName}
                              </span>
                            </label>
                            {scheduleData.schedule?.[dayIndex]?.isWorkday && (
                              <div className="ml-auto text-sm" style={{ color: '#697487' }}>
                                Día laboral activo
                              </div>
                            )}
                          </div>
                          
                          {scheduleData.schedule?.[dayIndex]?.isWorkday && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                                  Hora de entrada
                                </label>
                                <input
                                  type="time"
                                  value={scheduleData.schedule?.[dayIndex]?.startTime || ""}
                                  onChange={(e) => updateScheduleDay(dayIndex, 'startTime', e.target.value)}
                                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                  style={{ 
                                    borderColor: '#e5e7eb',
                                    focusRingColor: '#23334e'
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                                  Hora de salida
                                </label>
                                <input
                                  type="time"
                                  value={scheduleData.schedule?.[dayIndex]?.endTime || ""}
                                  onChange={(e) => updateScheduleDay(dayIndex, 'endTime', e.target.value)}
                                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                  style={{ 
                                    borderColor: '#e5e7eb',
                                    focusRingColor: '#23334e'
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                                  Tolerancia específica (min)
                                </label>
                                <input
                                  type="number"
                                  value={scheduleData.schedule?.[dayIndex]?.tolerance || 0}
                                  onChange={(e) => updateScheduleDay(dayIndex, 'tolerance', parseInt(e.target.value) || 0)}
                                  min="0"
                                  max="60"
                                  placeholder={`Por defecto: ${scheduleData.defaultTolerance}`}
                                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                  style={{ 
                                    borderColor: '#e5e7eb',
                                    focusRingColor: '#23334e'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {!scheduleData.schedule?.[dayIndex]?.isWorkday && (
                            <div className="text-center py-4 text-gray-500">
                              <span className="text-2xl">😴</span>
                              <div className="text-sm mt-2">Día de descanso</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen del horario */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">📊 Resumen del Horario</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Días laborales:</span>
                        <div className="text-blue-800">
                          {Object.values(scheduleData.schedule || {}).filter(day => day.isWorkday).length} días
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Días de descanso:</span>
                        <div className="text-blue-800">
                          {Object.values(scheduleData.schedule || {}).filter(day => !day.isWorkday).length} días
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Tolerancia general:</span>
                        <div className="text-blue-800">
                          {scheduleData.defaultTolerance} minutos
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4">
                {uiState.editingScheduleId ? (
                  <button
                    onClick={() => handleUpdateSchedule(uiState.editingScheduleId)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando}
                  >
                    {cargando ? "Actualizando..." : "Actualizar Horario"}
                  </button>
                ) : scheduleFormType === 'template' ? (
                  <button
                    onClick={() => handleAssignSchedule(uiState.selectedEmployeeForSchedule._id, uiState.selectedEmployeeForSchedule.tienda?._id)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando || !selectedTemplateId || !uiState.selectedEmployeeForSchedule.tienda}
                  >
                    {cargando ? "Asignando..." : "Asignar Plantilla"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCreateSchedule(uiState.selectedEmployeeForSchedule._id, uiState.selectedEmployeeForSchedule.tienda?._id)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando || !uiState.selectedEmployeeForSchedule.tienda}
                  >
                    {cargando ? "Creando..." : "Crear Horario"}
                  </button>
                )}
                <button
                  onClick={clearScheduleForm}
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
              </div>
            </div>
          </div>
        )}
		{/* Historial Laboral */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              Historial Laboral de Empleados
            </h2>
            <p className="text-sm mt-1" style={{ color: '#697487' }}>
              Registro completo de empleados, sueldos y datos laborales
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {(historyData || []).length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  No hay registros laborales
                </h3>
                <p style={{ color: '#697487' }}>
                  Los registros aparecerán cuando agregues empleados al sistema
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f4f6fa' }}>
                  <tr>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Empleado</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Tienda</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Posición</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Sueldo Diario</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Seguro Social</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Fecha Ingreso</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Fecha Salida</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Estado</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyData || []).map((h, index) => (
                    <tr key={h._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* COLUMNA EMPLEADO */}
                      <td className="p-4" style={{ color: '#23334e' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#23334e', color: 'white' }}>
                            {h.employee?.username?.charAt(0).toUpperCase() || h.nombre?.charAt(0).toUpperCase() || 'N'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{h.employee?.username || 'N/A'}</div>
                            {(h.nombre || h.apellidoPaterno || h.apellidoMaterno) && (
                              <div className="text-xs text-gray-500">
                                {`${h.nombre || ''} ${h.apellidoPaterno || ''} ${h.apellidoMaterno || ''}`.trim()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* COLUMNA TIENDA */}
                      <td className="p-4" style={{ color: '#697487' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                            🏪
                          </div>
                          <span className="font-medium" style={{ color: '#23334e' }}>
                            {h.tienda?.nombre || 'Sin asignar'}
                          </span>
                        </div>
                      </td>
                      
                      {/* COLUMNA POSICIÓN */}
                      <td className="p-4" style={{ color: '#697487' }}>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                          {h.position || 'Empleado'}
                        </span>
                      </td>
                      
                      {/* COLUMNA SUELDO */}
                      <td className="p-4" style={{ color: '#697487' }}>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">💰</span>
                          <span className="font-semibold" style={{ color: '#23334e' }}>
                            ${(h.sueldoDiario || h.salary || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      
                      {/* COLUMNA SEGURO */}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.seguroSocial === 'Sí' || h.seguroSocial === true 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {h.seguroSocial === 'Sí' || h.seguroSocial === true ? "✅ Sí" : "❌ No"}
                        </span>
                      </td>
                      
                      {/* COLUMNA FECHA INGRESO */}
                      <td className="p-4" style={{ color: '#697487' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📅</span>
                          <span className="text-sm">
                            {new Date(h.startDate).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      
                      {/* COLUMNA FECHA SALIDA */}
                      <td className="p-4" style={{ color: '#697487' }}>
                        {h.endDate ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📤</span>
                            <span className="text-sm">
                              {new Date(h.endDate).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      
                      {/* COLUMNA ESTADO */}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {h.isActive ? "🟢 Activo" : "⚪ Inactivo"}
                        </span>
                      </td>
                      
                      {/* COLUMNA ACCIONES - MEJORADA CON ETIQUETAS */}
                          <td className="p-4">
                            {editHistorial.id === h._id ? (
                              <div className="text-center py-4 px-6 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="mb-2">
                                  <svg className="mx-auto h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </div>
                                <p className="text-blue-700 font-medium text-sm">
                                  📝 Editando en modal
                                </p>
                                <p className="text-blue-600 text-xs mt-1">
                                  El formulario se abrió en una ventana separada
                                </p>
                                <button 
                                  onClick={() => {
                                    setEditHistorial(prev => ({...prev, id: null}));
                                    clearEditStates();
                                  }} 
                                  className="mt-3 px-3 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-colors"
                                >
                                  ❌ Cerrar
                                </button>
                              </div>
                            
                            
                            ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditHistorial({
                                  id: h._id,
                                  sueldo: h.sueldoDiario || h.salary || "",
                                  position: h.position || "",
                                  endDate: h.endDate && typeof h.endDate === 'string' ? h.endDate.split('T')[0] : "",
                                  seguro: h.seguroSocial === 'Sí' || h.seguroSocial === true,
                                  motivo: h.motivoBaja || "",
                                  razon: h.razonBaja || "",
                                  notes: h.notes || ""
                                });
                                setEditPersonalData({
                                  nombre: h.nombre || "",
                                  apellidoPaterno: h.apellidoPaterno || "",
                                  apellidoMaterno: h.apellidoMaterno || "",
                                  rfc: h.rfc || "",
                                  curp: h.curp || "",
                                  numeroSeguroSocial: h.numeroSeguroSocial || ""
                                });
                              }}
                              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 hover:bg-blue-50 border border-blue-200"
                              style={{ color: '#23334e' }}
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteHistory(h._id)} 
                              className="px-4 py-2 text-sm font-medium text-red-600 rounded-lg transition-colors duration-200 hover:bg-red-50 border border-red-200"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sección de Horarios Configurados */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              Horarios de Trabajo Asignados
            </h2>
            <p className="text-sm mt-1" style={{ color: '#697487' }}>
              Gestión de horarios personalizados para cada empleado
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {loadingSchedules ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  Cargando horarios...
                </h3>
                <p className="text-sm" style={{ color: '#697487' }}>
                  Por favor espera mientras se cargan los datos
                </p>
              </div>
            ) : (scheduleData.employeeSchedules || []).length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  No hay horarios configurados
                </h3>
                <p style={{ color: '#697487' }}>
                  Usa el botón "Horario" en cada empleado para configurar sus horarios de trabajo
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f4f6fa' }}>
                  <tr>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Empleado</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Tienda</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Días Laborales</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Horario Típico</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Tolerancia</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Estado</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(scheduleData.employeeSchedules || []).map((schedule, index) => {
                    const workdays = Object.entries(schedule.schedule || {})
                      .filter(([day, info]) => info.isWorkday)
                      .map(([day]) => dayNames[parseInt(day)].substring(0, 3))
                      .join(', ');
                    
                    const firstWorkday = Object.values(schedule.schedule).find(day => day.isWorkday);
                    const typicalSchedule = firstWorkday ? 
                      `${firstWorkday.startTime} - ${firstWorkday.endTime}` : 
                      'N/A';
                    
                    return (
                      <tr key={schedule._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-4" style={{ color: '#23334e' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
                              {schedule.employee?.username?.charAt(0).toUpperCase() || 'N'}
                            </div>
                            {schedule.employee?.username || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4" style={{ color: '#697487' }}>
                          {schedule.tienda?.nombre || 'N/A'}
                        </td>
                        <td className="p-4" style={{ color: '#697487' }}>
                          {workdays || 'Ninguno'}
                        </td>
                        <td className="p-4" style={{ color: '#697487' }}>
                          {typicalSchedule}
                        </td>
                        <td className="p-4" style={{ color: '#697487' }}>
                          {schedule.defaultTolerance} min
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => loadScheduleForEdit(schedule, false)}
                              className="px-3 py-1 text-sm font-medium rounded transition-colors duration-200 hover:bg-purple-50"
                              style={{ color: '#8b5cf6', border: '1px solid #e5e7eb' }}
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => handleViewScheduleDetails(schedule)}
                              className="px-3 py-1 text-sm font-medium rounded transition-colors duration-200 hover:bg-blue-50"
                              style={{ color: '#3b82f6', border: '1px solid #e5e7eb' }}
                            >
                              👁️ Ver
                            </button>
                            <button 
                              onClick={() => handleDeleteSchedule(schedule._id, false)}
                              className="px-3 py-1 text-sm font-medium text-red-600 rounded transition-colors duration-200 hover:bg-red-50"
                              style={{ border: '1px solid #fee2e2' }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sección de Usuarios Eliminados */}
        {uiState.showDeletedUsers && (
          <div ref={deletedUsersRef} className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-red-200">
            <div className="p-6 border-b bg-red-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-red-800">
                    🗑️ Usuarios Eliminados (Soft Delete)
                  </h2>
                  <p className="text-sm mt-1 text-red-600">
                    Usuarios que fueron eliminados pero se pueden restaurar
                  </p>
                </div>
                <div className="text-sm text-red-600">
                  Total: {deletedUsers.length} usuarios eliminados
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {deletedUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                    No hay usuarios eliminados
                  </h3>
                  <p style={{ color: '#697487' }}>
                    Todos los usuarios están activos en el sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {(deletedUsers || []).map((user, index) => {
                    const roleConfig = getRoleConfig(user.role);
                    
                    return (
                      <div 
                        key={user._id} 
                        className="border rounded-xl p-6 transition-all duration-200 border-red-200 bg-red-50"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl opacity-60" style={{ backgroundColor: roleConfig.color }}>
                                {roleConfig.icon}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-red-800">
                                  {user.username} <span className="text-sm font-normal text-red-600">(Eliminado)</span>
                                </h3>
                                <p className="text-sm text-red-600">
                                  ID: #{user._id.slice(-8)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-red-100 text-red-600">
                                  🏷️
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-red-700">
                                    Rol
                                  </div>
                                  <span className="px-3 py-1 text-sm rounded-full font-medium bg-red-100 text-red-800">
                                    {roleConfig.icon} {roleConfig.label}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-red-100 text-red-600">
                                  📅
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-red-700">
                                    Eliminado el
                                  </div>
                                  <div className="text-red-800">
                                    {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('es-MX', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : "N/A"}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-red-100 text-red-600">
                                  👤
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-red-700">
                                    Eliminado por
                                  </div>
                                  <div className="text-red-800">
                                    {user.deletedBy?.username || "Sistema"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRestore(user._id, user.username)}
                              className="px-6 py-3 rounded-lg font-medium text-white bg-green-600 transition-all duration-200 hover:shadow-md hover:bg-green-700"
                              disabled={cargando}
                            >
                              ↩️ Restaurar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
		
		{/* Plantillas de Horarios Disponibles */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                  Plantillas de Horarios Disponibles
                </h2>
                <p className="text-sm mt-1" style={{ color: '#697487' }}>
                  Plantillas predefinidas que pueden ser asignadas a empleados
                </p>
              </div>
              <div className="text-sm" style={{ color: '#697487' }}>
                Total: {(scheduleData.templates || []).length} plantillas
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loadingSchedules ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  Cargando plantillas...
                </h3>
                <p className="text-sm" style={{ color: '#697487' }}>
                  Por favor espera mientras se cargan los datos
                </p>
              </div>
            ) : (scheduleData.templates || []).length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  No hay plantillas disponibles
                </h3>
                <p style={{ color: '#697487' }}>
                  Crea tu primera plantilla usando el botón "Nueva Jornada"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {(scheduleData.templates || []).filter(template => template && template._id).map((template, index) => {
                  const workdays = Object.entries(template.schedule || {})
                    .filter(([day, info]) => info.isWorkday)
                    .map(([day]) => dayNames[parseInt(day)].substring(0, 3))
                    .join(', ');
                  
                  const firstWorkday = Object.values(template.schedule).find(day => day.isWorkday);
                  const typicalSchedule = firstWorkday ? 
                    `${firstWorkday.startTime} - ${firstWorkday.endTime}` : 
                    'Sin horarios';
                  
                  return (
                    <div 
                      key={template._id} 
                      className="border rounded-xl p-6 transition-all duration-200 hover:shadow-lg bg-gradient-to-br from-white to-purple-50"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      {uiState.editingTemplateId === template._id ? (
                        // Modo edición inline
                        <>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#8b5cf6' }}>
                                📋
                              </div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={scheduleData.editingTemplateData.name || ''}
                                  onChange={(e) => handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, name: e.target.value})}
                                  className="w-full text-lg font-bold border-b-2 border-purple-300 bg-transparent focus:outline-none focus:border-purple-500"
                                  style={{ color: '#23334e' }}
                                  placeholder="Nombre de plantilla"
                                />
                                <input
                                  type="text"
                                  value={scheduleData.editingTemplateData.description || ''}
                                  onChange={(e) => handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, description: e.target.value})}
                                  className="w-full text-sm border-b border-gray-300 bg-transparent focus:outline-none focus:border-purple-400 mt-1"
                                  style={{ color: '#697487' }}
                                  placeholder="Descripción"
                                />
                              </div>
                            </div>
                            
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Editando
                            </span>
                          </div>
                          
                          <div className="space-y-4 mb-4">
                            {/* Configuración general */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                  ⏱️
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                    Tolerancia por defecto (min)
                                  </div>
                                  <input
                                    type="number"
                                    value={scheduleData.editingTemplateData.defaultTolerance || 15}
                                    onChange={(e) => handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, defaultTolerance: parseInt(e.target.value) || 15})}
                                    className="w-20 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-purple-400"
                                    style={{ color: '#23334e' }}
                                    min="0"
                                    max="60"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                  📝
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                                    Notas
                                  </div>
                                  <textarea
                                    value={scheduleData.editingTemplateData.notes || ''}
                                    onChange={(e) => handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, notes: e.target.value})}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-purple-400 resize-none"
                                    style={{ color: '#23334e' }}
                                    placeholder="Notas adicionales..."
                                    rows="2"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Configuración de horarios por día */}
                            <div>
                              <div className="text-sm font-medium mb-3" style={{ color: '#46546b' }}>
                                📅 Configuración de horarios por día
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, dayIndex) => (
                                  <div key={dayIndex} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                                          {dayName}
                                        </span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={scheduleData.editingTemplateData.schedule?.[dayIndex]?.isWorkday || false}
                                            onChange={(e) => {
                                              const newSchedule = {...(scheduleData.editingTemplateData.schedule || {})};
                                              newSchedule[dayIndex] = {
                                                ...newSchedule[dayIndex],
                                                isWorkday: e.target.checked,
                                                startTime: e.target.checked ? (newSchedule[dayIndex]?.startTime || "09:00") : "",
                                                endTime: e.target.checked ? (newSchedule[dayIndex]?.endTime || "18:00") : "",
                                                tolerance: e.target.checked ? (newSchedule[dayIndex]?.tolerance || scheduleData.editingTemplateData.defaultTolerance || 15) : 0
                                              };
                                              handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, schedule: newSchedule});
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                                            style={{ accentColor: '#8b5cf6' }}
                                          />
                                          <span className="text-xs" style={{ color: '#8b5cf6' }}>
                                            Día laboral
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                    
                                    {scheduleData.editingTemplateData.schedule?.[dayIndex]?.isWorkday && (
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium mb-1" style={{ color: '#46546b' }}>
                                            Entrada
                                          </label>
                                          <input
                                            type="time"
                                            value={scheduleData.editingTemplateData.schedule?.[dayIndex]?.startTime || '09:00'}
                                            onChange={(e) => {
                                              const newSchedule = {...(scheduleData.editingTemplateData.schedule || {})};
                                              newSchedule[dayIndex] = {
                                                ...newSchedule[dayIndex],
                                                startTime: e.target.value
                                              };
                                              handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, schedule: newSchedule});
                                            }}
                                            className="w-full text-xs border border-purple-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium mb-1" style={{ color: '#46546b' }}>
                                            Salida
                                          </label>
                                          <input
                                            type="time"
                                            value={scheduleData.editingTemplateData.schedule?.[dayIndex]?.endTime || '18:00'}
                                            onChange={(e) => {
                                              const newSchedule = {...(scheduleData.editingTemplateData.schedule || {})};
                                              newSchedule[dayIndex] = {
                                                ...newSchedule[dayIndex],
                                                endTime: e.target.value
                                              };
                                              handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, schedule: newSchedule});
                                            }}
                                            className="w-full text-xs border border-purple-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium mb-1" style={{ color: '#46546b' }}>
                                            Tolerancia
                                          </label>
                                          <input
                                            type="number"
                                            value={scheduleData.editingTemplateData.schedule?.[dayIndex]?.tolerance || scheduleData.editingTemplateData.defaultTolerance || 15}
                                            onChange={(e) => {
                                              const newSchedule = {...(scheduleData.editingTemplateData.schedule || {})};
                                              newSchedule[dayIndex] = {
                                                ...newSchedule[dayIndex],
                                                tolerance: parseInt(e.target.value) || 0
                                              };
                                              handleScheduleDataChange('editingTemplateData', {...scheduleData.editingTemplateData, schedule: newSchedule});
                                            }}
                                            className="w-full text-xs border border-purple-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                                            min="0"
                                            max="60"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {!scheduleData.editingTemplateData.schedule?.[dayIndex]?.isWorkday && (
                                      <div className="text-center py-2">
                                        <span className="text-xs text-gray-500">
                                          😴 Día de descanso
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <button 
                              onClick={handleSaveTemplateInline}
                              className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 hover:opacity-90"
                              style={{ backgroundColor: '#8b5cf6' }}
                              disabled={cargando || !scheduleData.editingTemplateData.name?.trim()}
                            >
                              {cargando ? "Guardando..." : "💾 Guardar"}
                            </button>
                            <button 
                              onClick={handleCancelEditTemplate}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                              style={{ border: '1px solid #e5e7eb' }}
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        // Modo visualización normal
                        <>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#8b5cf6' }}>
                                📋
                              </div>
                              <div>
                                <h3 className="text-lg font-bold" style={{ color: '#23334e' }}>
                                  {template.name || 'Sin nombre'}
                                </h3>
                                <p className="text-sm" style={{ color: '#697487' }}>
                                  {template.description || 'Sin descripción'}
                                </p>
                              </div>
                            </div>
                            
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Plantilla
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                📅
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                  Días laborales
                                </div>
                                <div className="text-sm" style={{ color: '#23334e' }}>
                                  {workdays || 'Ninguno'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                ⏰
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                  Horario típico
                                </div>
                                <div className="text-sm" style={{ color: '#23334e' }}>
                                  {typicalSchedule}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                ⏱️
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                  Tolerancia
                                </div>
                                <div className="text-sm" style={{ color: '#23334e' }}>
                                  {template.defaultTolerance} minutos
                                </div>
                              </div>
                            </div>
                            
                            {template.notes && (
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: '#f4f6fa', color: '#46546b' }}>
                                  📝
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                                    Notas
                                  </div>
                                  <div className="text-sm" style={{ color: '#23334e' }}>
                                    {template.notes}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      
                      <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                        <div className="text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Horarios detallados:
                        </div>
                        <div className="space-y-1">
                          {Object.entries(template.schedule || {}).map(([dayIndex, dayInfo]) => (
                            <div key={dayIndex} className="flex justify-between items-center text-xs">
                              <span style={{ color: '#697487' }}>
                                {dayNames[parseInt(dayIndex)]}:
                              </span>
                              <span style={{ color: dayInfo.isWorkday ? '#23334e' : '#9ca3af' }}>
                                {dayInfo.isWorkday 
                                  ? `${dayInfo.startTime} - ${dayInfo.endTime} (±${dayInfo.tolerance}min)`
                                  : 'Descanso'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {uiState.editingTemplateId !== template._id && (
                        <>
                          <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                            <div className="text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                              Horarios detallados:
                            </div>
                            <div className="space-y-1">
                              {Object.entries(template.schedule || {}).map(([dayIndex, dayInfo]) => (
                                <div key={dayIndex} className="flex justify-between items-center text-xs">
                                  <span style={{ color: '#697487' }}>
                                    {dayNames[parseInt(dayIndex)]}:
                                  </span>
                                  <span style={{ color: dayInfo.isWorkday ? '#23334e' : '#9ca3af' }}>
                                    {dayInfo.isWorkday 
                                      ? `${dayInfo.startTime} - ${dayInfo.endTime} (±${dayInfo.tolerance}min)`
                                      : 'Descanso'
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <button 
                              onClick={() => handleEditTemplateInline(template)}
                              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 hover:bg-purple-50"
                              style={{ color: '#8b5cf6', border: '1px solid #e5e7eb' }}
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteSchedule(template._id, true)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 rounded-lg transition-colors duration-200 hover:bg-red-50"
                              style={{ border: '1px solid #fee2e2' }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        {/* Modal de confirmación para eliminar */}
        {uiState.showDeleteModal && uiState.deleteCandidate && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cancelDeleteSchedule}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-red-600">
                    🗑️ Confirmar Eliminación
                  </h2>
                  <button
                    onClick={cancelDeleteSchedule}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    ¿Estás seguro de que deseas eliminar {uiState.deleteCandidate.isTemplate ? 'esta plantilla' : 'este horario'}?
                  </p>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" 
                           style={{ backgroundColor: uiState.deleteCandidate.isTemplate ? '#8b5cf6' : '#3b82f6', color: 'white' }}>
                        {uiState.deleteCandidate.isTemplate ? '📋' : '👤'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {uiState.deleteCandidate.data?.name || 
                           (uiState.deleteCandidate.data?.employee?.username ? `Horario de ${uiState.deleteCandidate.data.employee.username}` : 'Sin nombre')}
                        </div>
                        {uiState.deleteCandidate.data?.description && (
                          <div className="text-sm text-gray-600">
                            {uiState.deleteCandidate.data.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {uiState.deleteError ? (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-800">
                        ❌ <strong>Error:</strong> {uiState.deleteError}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        ⚠️ <strong>Esta acción no se puede deshacer.</strong>
                        {uiState.deleteCandidate.isTemplate && " Si esta plantilla está siendo usada por empleados, no podrá ser eliminada."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {uiState.deleteError ? (
                    <button
                      onClick={cancelDeleteSchedule}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelDeleteSchedule}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        disabled={cargando}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmDeleteSchedule}
                        className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg transition-colors hover:bg-red-700 disabled:opacity-50"
                        disabled={cargando}
                      >
                        {cargando ? "Eliminando..." : "Eliminar"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Exportar con React.memo para optimizar re-renders
export default React.memo(UsersPage);


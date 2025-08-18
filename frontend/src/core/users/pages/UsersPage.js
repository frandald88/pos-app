import { useEffect, useState, useRef } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";


export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRole, setFiltroRole] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");
  
  
  // Estados para el historial laboral
  const [sueldoDiario, setSueldoDiario] = useState("");
  const [seguroSocial, setSeguroSocial] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [motivoBaja, setMotivoBaja] = useState("");
  const [razonBaja, setRazonBaja] = useState("");
  const [position, setPosition] = useState("Empleado");
  const [notes, setNotes] = useState("");

  // Estados para edición de historial
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [editSeguro, setEditSeguro] = useState(false);
  const [editMotivo, setEditMotivo] = useState("");
  const [editRazon, setEditRazon] = useState("");
  const [editSueldo, setEditSueldo] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Estados para horarios y plantillas
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [employeeSchedules, setEmployeeSchedules] = useState([]);
  const [selectedEmployeeForSchedule, setSelectedEmployeeForSchedule] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Estados personales
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [rfc, setRfc] = useState("");
  const [curp, setCurp] = useState("");
  const [numeroSeguroSocial, setNumeroSeguroSocial] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [editNombre, setEditNombre] = useState("");
  const [editApellidoPaterno, setEditApellidoPaterno] = useState("");
  const [editApellidoMaterno, setEditApellidoMaterno] = useState("");
  const [editRfc, setEditRfc] = useState("");
  const [editCurp, setEditCurp] = useState("");
  const [editNumeroSeguroSocial, setEditNumeroSeguroSocial] = useState("");
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const scheduleFormRef = useRef(null);
  const userFormRef = useRef(null); 

  // Estados para formulario de horario
  const [scheduleFormType, setScheduleFormType] = useState('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [scheduleData, setScheduleData] = useState({
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

  // Estados para plantillas
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

  const token = localStorage.getItem("token");

  // Constante para nombres de días
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
    // Si está cerrado, abrir y hacer scroll
    setMostrarFormulario(true);
    
    // ✅ Scroll automático al formulario de usuario
    setTimeout(() => {
      if (userFormRef.current) {
        userFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
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

  const loadScheduleTemplates = () => {
    if (!token) return;

    axios.get(`${apiBaseUrl}/api/schedules/templates`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      setScheduleTemplates(res.data);
    })
    .catch(err => {
      console.error("Error cargando plantillas:", err);
    });
  };

  const loadEmployeeSchedules = () => {
    if (!token) return;

    axios.get(`${apiBaseUrl}/api/schedules?type=assignments`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      setEmployeeSchedules(res.data);
    })
    .catch(err => {
      console.error("Error cargando horarios de empleados:", err);
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchTiendas();
    loadHistory();
    loadScheduleTemplates();
    loadEmployeeSchedules();
  }, []);

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
      setShowTemplateForm(false);
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
    setEditingScheduleId(null);
    setShowTemplateForm(false);
  };

  const clearScheduleForm = () => {
    setScheduleData({
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
    setScheduleFormType('template');
    setSelectedTemplateId('');
    setShowScheduleForm(false);
    setSelectedEmployeeForSchedule(null);
    setEditingScheduleId(null);
  };

  const handleOpenScheduleForm = (user) => {
    setSelectedEmployeeForSchedule(user);
    setShowScheduleForm(true);
    
    // Scroll automático después de que el formulario se renderice
    setTimeout(() => {
      if (scheduleFormRef.current) {
        scheduleFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Pequeño delay para asegurar que el formulario se renderizó
  };

  const templateFormRef = useRef(null);
  
  const handleOpenTemplateForm = () => {
    setShowTemplateForm(!showTemplateForm);
    if (!showTemplateForm) {
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
      loadEmployeeSchedules();
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
  };

  const clearAllForms = () => {
    setForm({
      username: "",
      password: "",
      role: "vendedor",
      tienda: "",
      telefono: "",
    });
    setSueldoDiario("");
    setSeguroSocial(false);
    setStartDate("");
    setEndDate("");
    setMotivoBaja("");
    setRazonBaja("");
    setPosition("Empleado");
    setNotes("");
    clearScheduleForm();
    clearTemplateForm();
    setNombre("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setRfc("");
    setCurp("");
    setNumeroSeguroSocial("");
    setAttachments([]);
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefono?.includes(searchTerm) ||
      user.tienda?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filtroRole === "" || user.role === filtroRole;
    const matchesTienda = filtroTienda === "" || user.tienda?._id === filtroTienda;
    
    return matchesSearch && matchesRole && matchesTienda;
  });

  const getUserStats = () => {
    return {
      total: users.length,
      vendedores: users.filter(u => u.role === 'vendedor').length,
      administradores: users.filter(u => u.role === 'admin').length,
      repartidores: users.filter(u => u.role === 'repartidor').length,
    };
  };

  const stats = getUserStats();

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
      setShowScheduleForm(false);
      setSelectedEmployeeForSchedule(null);
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
      setShowScheduleForm(false);
      setSelectedEmployeeForSchedule(null);
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
      setEditingScheduleId(null);
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
  const handleDeleteSchedule = async (scheduleId, isTemplate = false) => {
    const confirmText = isTemplate ? 
      "¿Estás seguro de eliminar esta plantilla de horario?" : 
      "¿Estás seguro de eliminar este horario asignado?";
      
    if (!window.confirm(confirmText)) return;

    setCargando(true);

    try {
      await axios.delete(`${apiBaseUrl}/api/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const successText = isTemplate ? "Plantilla eliminada exitosamente ✅" : "Horario eliminado exitosamente ✅";
      setMsg(successText);
      
      if (isTemplate) {
        loadScheduleTemplates();
      } else {
        loadEmployeeSchedules();
      }
      
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      setMsg(`Error al eliminar: ${error.response?.data?.message || error.message} ❌`);
    } finally {
      setCargando(false);
    }
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
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            [field]: value
          }
        }
      }));
    }
  };

  // ✅ Función para ver detalles de un horario
  const handleViewScheduleDetails = (schedule) => {
    alert(`Detalles del horario de ${schedule.employee?.username}:\n\n` +
      Object.entries(schedule.schedule)
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

  // ✅ Cargar datos para edición
// ✅ Cargar datos para edición CON SCROLL AUTOMÁTICO
const loadScheduleForEdit = (schedule, isTemplate = false) => {
  if (isTemplate) {
    // Cargar plantilla para edición
    setTemplateData({
      name: schedule.name || "",
      description: schedule.description || "",
      defaultTolerance: schedule.defaultTolerance || 15,
      notes: schedule.notes || "",
      schedule: schedule.schedule || {}
    });
    setEditingScheduleId(schedule._id);
    setShowTemplateForm(true);
    setScheduleFormType('custom');
    
    // ✅ NUEVO: Scroll automático al formulario de plantilla
    setTimeout(() => {
      if (templateFormRef.current) {
        templateFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
    
  } else {
    // Cargar horario de empleado para edición
    setScheduleData({
      defaultTolerance: schedule.defaultTolerance || 15,
      notes: schedule.notes || "",
      schedule: schedule.schedule || {}
    });
    setEditingScheduleId(schedule._id);
    setSelectedEmployeeForSchedule(schedule.employee);
    setShowScheduleForm(true);
    setScheduleFormType('custom');
    
    // ✅ NUEVO: Scroll automático al formulario de horario
    setTimeout(() => {
      if (scheduleFormRef.current) {
        scheduleFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
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
      setEditingScheduleId(null);
      setShowTemplateForm(false);
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
      if (!sueldoDiario || !startDate || !nombre || !apellidoPaterno || !apellidoMaterno) {
        setMsg("Se requieren todos los campos obligatorios: sueldo, fecha de ingreso, nombre y apellidos ❌");
        return;
      }
      
      if (parseFloat(sueldoDiario) <= 0) {
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
          sueldoDiario: parseFloat(sueldoDiario),
          seguroSocial,
          startDate,
          position: position.trim() || "Empleado",
          nombre: nombre.trim(),
          apellidoPaterno: apellidoPaterno.trim(),
          apellidoMaterno: apellidoMaterno.trim(),
          rfc: rfc.trim() || null,
          curp: curp.trim() || null,
          numeroSeguroSocial: numeroSeguroSocial.trim() || null,
        };

        if (endDate && endDate.trim()) {
          historyPayload.endDate = endDate;
          
          if (motivoBaja && motivoBaja.trim()) {
            historyPayload.motivoBaja = motivoBaja;
          }
          if (razonBaja && razonBaja.trim()) {
            historyPayload.razonBaja = razonBaja;
          }
        }

        if (notes && notes.trim()) {
          historyPayload.notes = notes.trim();
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
      endDate: editEndDate || null,
      seguroSocial: editSeguro,
      motivoBaja: editMotivo,
      razonBaja: editRazon,
      sueldoDiario: editSueldo ? parseFloat(editSueldo) : undefined,
      position: editPosition,
      notes: editNotes,
      
      // ✅ CAMPOS PERSONALES QUE FALTABAN
      nombre: editNombre?.trim() || null,
      apellidoPaterno: editApellidoPaterno?.trim() || null,
      apellidoMaterno: editApellidoMaterno?.trim() || null,
      rfc: editRfc?.trim() || null,
      curp: editCurp?.trim() || null,
      numeroSeguroSocial: editNumeroSeguroSocial?.trim() || null
    };

    try {
      await axios.put(`${apiBaseUrl}/api/employees/history/${id}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setMsg("Historial actualizado exitosamente ✅");
      setEditingHistoryId(null);
      loadHistory();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Error al actualizar historial:", err);
      setMsg(`Error al actualizar historial: ${err.response?.data?.message || err.message} ❌`);
    } finally {
      setCargando(false);
    }
  };

  // ✅ FUNCIÓN AUXILIAR para limpiar estados de edición
  const clearEditStates = () => {
    setEditSueldo("");
    setEditPosition("");
    setEditEndDate("");
    setEditSeguro(false);
    setEditMotivo("");
    setEditRazon("");
    setEditNotes("");
    setEditNombre("");
    setEditApellidoPaterno("");
    setEditApellidoMaterno("");
    setEditRfc("");
    setEditCurp("");
    setEditNumeroSeguroSocial("");
  };

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
  
  // ✅ NUEVO: Scroll automático al formulario de usuario
  setTimeout(() => {
    if (userFormRef.current) {
      userFormRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, 100);
};

const formatPhoneNumber = (value) => {
  // Remover todo lo que no sea número
  const numbers = value.replace(/\D/g, '');
  
  // No permitir que empiece con 0
  if (numbers.startsWith('0')) {
    return form.telefono; // Mantener el valor anterior
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
                {showTemplateForm ? "Cancelar" : "Nueva Jornada"}
              </button>
              
              <button
                onClick={() => {
                  setShowDeletedUsers(!showDeletedUsers);
                  if (!showDeletedUsers) {
                    fetchDeletedUsers();
                  }
                }}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ 
                  backgroundColor: showDeletedUsers ? '#ef4444' : '#6b7280',
                  color: 'white'
                }}
                disabled={cargando}
              >
                {showDeletedUsers ? "Ocultar Eliminados" : "Ver Eliminados"}
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
        {showTemplateForm && (
          <div ref={templateFormRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              {editingScheduleId ? "Editar Plantilla de Horario" : "Crear Nueva Plantilla de Horario"}
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
                      {Object.values(templateData.schedule).filter(day => day.isWorkday).length} días
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Días de descanso:</span>
                    <div className="text-purple-800">
                      {Object.values(templateData.schedule).filter(day => !day.isWorkday).length} días
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
                {editingScheduleId ? (
                  <button
                    onClick={() => handleUpdateTemplate(editingScheduleId)}
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
                  {tiendas.map((t) => (
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
              {filteredUsers.map((user, index) => {
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
                      </div>

                     {/* Acciones del usuario */}
                      <div className="flex gap-3">
                        {/* ✅ Solo mostrar botón de horario para vendedores y repartidores */}
                        {user.role !== 'admin' && (
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

        {/* Formulario para nuevo/editar usuario */}
        {mostrarFormulario && (
          <div ref={userFormRef}  className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              {editingId ? "Editar Usuario" : "Agregar Nuevo Usuario y Registro Laboral"}
            </h2>
            
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
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
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
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                      onChange={(e) => {
                        const formattedPhone = formatPhoneNumber(e.target.value);
                        setForm({ ...form, telefono: formattedPhone });
                      }}
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
                      onChange={(e) => setForm({ ...form, role: e.target.value, tienda: "" })}
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
                        onChange={(e) => setForm({ ...form, tienda: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                        required={form.role !== "admin"}
                      >
                        <option value="">-- Selecciona tienda --</option>
                        {tiendas.map((t) => (
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
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
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
                          value={apellidoPaterno}
                          onChange={(e) => setApellidoPaterno(e.target.value)}
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
                          value={apellidoMaterno}
                          onChange={(e) => setApellidoMaterno(e.target.value)}
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
                          value={rfc}
                          onChange={(e) => setRfc(e.target.value.toUpperCase())}
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
                          value={curp}
                          onChange={(e) => setCurp(e.target.value.toUpperCase())}
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
                          value={numeroSeguroSocial}
                          onChange={(e) => setNumeroSeguroSocial(e.target.value)}
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
                        value={sueldoDiario}
                        onChange={(e) => setSueldoDiario(e.target.value)}
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
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
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
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Ej: Empleado, Supervisor"
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
                        Fecha de Salida (Opcional)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
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
                        Motivo de Salida
                      </label>
                      <select
                        value={motivoBaja}
                        onChange={(e) => setMotivoBaja(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                        disabled={cargando}
                      >
                        <option value="">Seleccionar motivo</option>
                        <option value="renuncia">Renuncia</option>
                        <option value="despido">Despido</option>
                        <option value="fin_contrato">Fin de contrato</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Razón de Salida
                      </label>
                      <input
                        type="text"
                        value={razonBaja}
                        onChange={(e) => setRazonBaja(e.target.value)}
                        placeholder="Descripción opcional"
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
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
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
                          checked={seguroSocial}
                          onChange={(e) => setSeguroSocial(e.target.checked)}
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
        )}
		
		{/* ✅ Formulario de asignación/edición de horarios */}
        {showScheduleForm && selectedEmployeeForSchedule && (
          <div ref={scheduleFormRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              {editingScheduleId ? "Editar Horario" : `Asignar Horario a: ${selectedEmployeeForSchedule.username}`}
            </h2>
            
            <div className="space-y-6">
              {/* Tipo de asignación */}
              {!editingScheduleId && (
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
              {scheduleFormType === 'template' && !editingScheduleId && (
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
                    {scheduleTemplates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                  
                  {/* Preview de la plantilla seleccionada */}
                  {selectedTemplateId && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      {(() => {
                        const selectedTemplate = scheduleTemplates.find(t => t._id === selectedTemplateId);
                        if (!selectedTemplate) return null;
                        
                        return (
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">Vista Previa: {selectedTemplate.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {Object.entries(selectedTemplate.schedule).map(([dayIndex, dayInfo]) => (
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
              {(scheduleFormType === 'custom' || editingScheduleId) && (
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
                        onChange={(e) => setScheduleData({...scheduleData, defaultTolerance: parseInt(e.target.value) || 0})}
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
                        onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
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
                                checked={scheduleData.schedule[dayIndex]?.isWorkday || false}
                                onChange={(e) => updateScheduleDay(dayIndex, 'isWorkday', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                                style={{ accentColor: '#23334e' }}
                              />
                              <span className="text-lg font-medium" style={{ color: '#23334e' }}>
                                {dayName}
                              </span>
                            </label>
                            {scheduleData.schedule[dayIndex]?.isWorkday && (
                              <div className="ml-auto text-sm" style={{ color: '#697487' }}>
                                Día laboral activo
                              </div>
                            )}
                          </div>
                          
                          {scheduleData.schedule[dayIndex]?.isWorkday && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                                  Hora de entrada
                                </label>
                                <input
                                  type="time"
                                  value={scheduleData.schedule[dayIndex]?.startTime || ""}
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
                                  value={scheduleData.schedule[dayIndex]?.endTime || ""}
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
                                  value={scheduleData.schedule[dayIndex]?.tolerance || 0}
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
                          
                          {!scheduleData.schedule[dayIndex]?.isWorkday && (
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
                          {Object.values(scheduleData.schedule).filter(day => day.isWorkday).length} días
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Días de descanso:</span>
                        <div className="text-blue-800">
                          {Object.values(scheduleData.schedule).filter(day => !day.isWorkday).length} días
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
                {editingScheduleId ? (
                  <button
                    onClick={() => handleUpdateSchedule(editingScheduleId)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando}
                  >
                    {cargando ? "Actualizando..." : "Actualizar Horario"}
                  </button>
                ) : scheduleFormType === 'template' ? (
                  <button
                    onClick={() => handleAssignSchedule(selectedEmployeeForSchedule._id, selectedEmployeeForSchedule.tienda?._id)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando || !selectedTemplateId || !selectedEmployeeForSchedule.tienda}
                  >
                    {cargando ? "Asignando..." : "Asignar Plantilla"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCreateSchedule(selectedEmployeeForSchedule._id, selectedEmployeeForSchedule.tienda?._id)}
                    className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#8b5cf6' }}
                    disabled={cargando || !selectedEmployeeForSchedule.tienda}
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
            {historyData.length === 0 ? (
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
                  {historyData.map((h, index) => (
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
                            {editingHistoryId === h._id ? (
                              <div className="space-y-3 min-w-72 max-w-80">
                                {/* Datos personales adicionales */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      Nombre
                                    </label>
                                    <input 
                                      type="text"
                                      value={editNombre} 
                                      onChange={(e) => setEditNombre(e.target.value)} 
                                      placeholder="Nombre"
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      Apellido Paterno
                                    </label>
                                    <input 
                                      type="text"
                                      value={editApellidoPaterno} 
                                      onChange={(e) => setEditApellidoPaterno(e.target.value)} 
                                      placeholder="Apellido P."
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Apellido Materno
                                  </label>
                                  <input 
                                    type="text"
                                    value={editApellidoMaterno} 
                                    onChange={(e) => setEditApellidoMaterno(e.target.value)} 
                                    placeholder="Apellido Materno"
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      RFC
                                    </label>
                                    <input 
                                      type="text"
                                      value={editRfc} 
                                      onChange={(e) => setEditRfc(e.target.value.toUpperCase())} 
                                      placeholder="RFC"
                                      maxLength="13"
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      CURP
                                    </label>
                                    <input 
                                      type="text"
                                      value={editCurp} 
                                      onChange={(e) => setEditCurp(e.target.value.toUpperCase())} 
                                      placeholder="CURP"
                                      maxLength="18"
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Número de Seguro Social
                                  </label>
                                  <input 
                                    type="text"
                                    value={editNumeroSeguroSocial} 
                                    onChange={(e) => setEditNumeroSeguroSocial(e.target.value)} 
                                    placeholder="Número Seguro Social"
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      Sueldo Diario ($)
                                    </label>
                                    <input 
                                      type="number"
                                      value={editSueldo} 
                                      onChange={(e) => setEditSueldo(e.target.value)} 
                                      placeholder="Sueldo diario"
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">
                                      Posición/Cargo
                                    </label>
                                    <input 
                                      type="text"
                                      value={editPosition} 
                                      onChange={(e) => setEditPosition(e.target.value)} 
                                      placeholder="Posición"
                                      className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                      style={{ focusRingColor: '#23334e' }}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Fecha de Salida
                                  </label>
                                  <input 
                                    type="date" 
                                    value={editEndDate} 
                                    onChange={(e) => setEditEndDate(e.target.value)} 
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                  />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      checked={editSeguro} 
                                      onChange={(e) => setEditSeguro(e.target.checked)}
                                      className="w-4 h-4 rounded"
                                      style={{ accentColor: '#23334e' }}
                                    />
                                    <span className="text-sm font-medium">Seguro Social</span>
                                  </label>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Motivo de Baja
                                  </label>
                                  <select 
                                    value={editMotivo} 
                                    onChange={(e) => setEditMotivo(e.target.value)} 
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                  >
                                    <option value="">Seleccionar motivo</option>
                                    <option value="renuncia">Renuncia</option>
                                    <option value="despido">Despido</option>
                                    <option value="fin_contrato">Fin de contrato</option>
                                    <option value="otro">Otro</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Razón Detallada
                                  </label>
                                  <input 
                                    type="text" 
                                    value={editRazon} 
                                    onChange={(e) => setEditRazon(e.target.value)} 
                                    placeholder="Razón detallada" 
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Notas Adicionales
                                  </label>
                                  <textarea 
                                    value={editNotes} 
                                    onChange={(e) => setEditNotes(e.target.value)} 
                                    placeholder="Notas adicionales" 
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2"
                                    style={{ focusRingColor: '#23334e' }}
                                    rows="2"
                                  />
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={() => handleUpdateHistory(h._id)} 
                                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                                    disabled={cargando}
                                  >
                                    {cargando ? "Guardando..." : "💾 Guardar"}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditingHistoryId(null);
                                      clearEditStates();
                                    }} 
                                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                                  >
                                    ❌ Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingHistoryId(h._id);
                                setEditSueldo(h.sueldoDiario || h.salary || "");
                                setEditPosition(h.position || "");
                                setEditEndDate(h.endDate ? h.endDate.split('T')[0] : "");
                                setEditSeguro(h.seguroSocial === 'Sí' || h.seguroSocial === true);
                                setEditMotivo(h.motivoBaja || "");
                                setEditRazon(h.razonBaja || "");
                                setEditNotes(h.notes || "");
                                setEditNombre(h.nombre || "");
                                setEditApellidoPaterno(h.apellidoPaterno || "");
                                setEditApellidoMaterno(h.apellidoMaterno || "");
                                setEditRfc(h.rfc || "");
                                setEditCurp(h.curp || "");
                                setEditNumeroSeguroSocial(h.numeroSeguroSocial || "");
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
            {employeeSchedules.length === 0 ? (
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
                  {employeeSchedules.map((schedule, index) => {
                    const workdays = Object.entries(schedule.schedule)
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
                Total: {scheduleTemplates.length} plantillas
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {scheduleTemplates.length === 0 ? (
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
                {scheduleTemplates.map((template, index) => {
                  const workdays = Object.entries(template.schedule)
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
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#8b5cf6' }}>
                            📋
                          </div>
                          <div>
                            <h3 className="text-lg font-bold" style={{ color: '#23334e' }}>
                              {template.name}
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
                      
                      <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                        <div className="text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Horarios detallados:
                        </div>
                        <div className="space-y-1">
                          {Object.entries(template.schedule).map(([dayIndex, dayInfo]) => (
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
                          onClick={() => loadScheduleForEdit(template, true)}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Usuarios Eliminados */}
        {showDeletedUsers && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-red-200">
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
                  {deletedUsers.map((user, index) => {
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
      </div>
    </div>
  );
}


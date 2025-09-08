import { useState } from 'react';

export const useScheduleData = () => {
  // Constante para nombres de días
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Horario por defecto
  const defaultSchedule = {
    0: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 },
    1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
    2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
    3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
    4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
    5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
    6: { isWorkday: false, startTime: "", endTime: "", tolerance: 0 }
  };

  // Estados consolidados para datos de plantillas y horarios
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleData, setScheduleData] = useState({
    templates: [],
    employeeSchedules: [],
    defaultTolerance: 15,
    notes: "",
    schedule: defaultSchedule,
    editingTemplateData: {
      name: "",
      description: "",
      defaultTolerance: 15,
      notes: "",
      schedule: defaultSchedule
    }
  });

  // Estados consolidados para formularios de horario
  const [scheduleFormType, setScheduleFormType] = useState('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Estados consolidados para plantillas
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    defaultTolerance: 15,
    notes: "",
    schedule: defaultSchedule
  });

  return {
    // Constantes
    dayNames,
    defaultSchedule,

    // Estados
    loadingSchedules, setLoadingSchedules,
    scheduleData, setScheduleData,
    scheduleFormType, setScheduleFormType,
    selectedTemplateId, setSelectedTemplateId,
    templateData, setTemplateData
  };
};
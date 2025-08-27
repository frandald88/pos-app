const express = require("express");
const router = express.Router();
const Attendance = require('./model');
const User = require('../../core/users/model');
const Schedule = require('../schedules/model'); // ✅ NUEVO: Importar modelo de horarios
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ NUEVO: Función helper para convertir minutos a formato legible
function formatMinutesToHoursAndMinutes(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes} minuto${totalMinutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let result = `${hours} hora${hours !== 1 ? 's' : ''}`;
  if (minutes > 0) {
    result += ` ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  return result;
}

// ✅ NUEVO: Función helper para verificar horarios
async function getEmployeeScheduleInfo(userId, checkInTime = new Date()) {
  try {
    const schedule = await Schedule.findOne({ 
      employee: userId, 
      isActive: true 
    });
    
    if (!schedule) {
      return {
        hasSchedule: false,
        isWorkday: true, // Por defecto asumir que es día laboral
        lateLimit: null,
        defaultLateLimit: new Date(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate(), 9, 0, 0, 0) // 9:00 AM por defecto
      };
    }
    
    const dayOfWeek = checkInTime.getDay();
    const todaySchedule = schedule.schedule[dayOfWeek];
    
    if (!todaySchedule || !todaySchedule.isWorkday) {
      return {
        hasSchedule: true,
        isWorkday: false,
        lateLimit: null,
        todaySchedule
      };
    }
    
    // Calcular hora límite con tolerancia
    const [hours, minutes] = todaySchedule.startTime.split(':').map(Number);
    const tolerance = todaySchedule.tolerance || schedule.defaultTolerance || 0;
    
    const lateLimit = new Date(checkInTime);
    lateLimit.setHours(hours, minutes + tolerance, 0, 0);
    
    return {
      hasSchedule: true,
      isWorkday: true,
      lateLimit,
      todaySchedule,
      tolerance
    };
  } catch (err) {
    console.error('Error obteniendo información de horario:', err);
    // Fallback a comportamiento anterior
    return {
      hasSchedule: false,
      isWorkday: true,
      lateLimit: null,
      defaultLateLimit: new Date(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate(), 9, 0, 0, 0)
    };
  }
}

// ✅ MEJORADO: Check-in con horarios personalizados
router.post("/checkin", verifyToken, async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    // ✅ NUEVO: Buscar o crear registro de asistencia del día
    let attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    // Si existe, verificar si puede hacer check-in
    if (attendance) {
      const canCheckIn = attendance.canCheckIn();
      if (!canCheckIn.canCheckIn) {
        return res.status(400).json({ 
          message: "Ya estás registrado como presente. Haz check-out primero si necesitas salir.",
          currentStatus: attendance.getCurrentStatus(),
          reason: canCheckIn.reason
        });
      }
    }

    // Buscar la tienda del usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.tienda) {
      return res.status(400).json({ 
        message: "El empleado no tiene tienda asignada. Contacte al administrador." 
      });
    }

    // ✅ NUEVO: Obtener información de horario personalizado
    const now = new Date();
    const scheduleInfo = await getEmployeeScheduleInfo(userId, now);
    
    // ✅ VALIDACIÓN: Verificar si el usuario tiene horario asignado
    if (!scheduleInfo.hasSchedule) {
      return res.status(400).json({ 
        message: "No tienes un horario asignado. Contacta al administrador para que te asigne un horario antes de hacer check-in.",
        error: "NO_SCHEDULE_ASSIGNED"
      });
    }
    
    // Verificar si es día laboral
    if (scheduleInfo.hasSchedule && !scheduleInfo.isWorkday) {
      return res.status(400).json({ 
        message: "Hoy no es tu día laboral según tu horario asignado",
        scheduleInfo: {
          isWorkday: false,
          todaySchedule: scheduleInfo.todaySchedule
        }
      });
    }

    // ✅ NUEVO: Crear o actualizar registro de asistencia
    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: startOfDay,
        tienda: user.tienda,
        timeEntries: [],
        status: "Present"
      });
    }

    // ✅ NUEVO: Determinar el tipo de entrada
    const { entryType } = req.body; // 'work', 'break', 'lunch'
    const validEntryType = ['work', 'break', 'lunch'].includes(entryType) ? entryType : 'work';

    // Agregar nueva entrada de tiempo
    const newEntry = {
      checkInTime: now,
      type: validEntryType,
      notes: req.body.notes || ""
    };

    attendance.timeEntries.push(newEntry);

    // ✅ MEJORADO: Determinar si llegó tarde solo para la primera entrada del día
    const isFirstEntryOfDay = attendance.timeEntries.length === 1;
    
    if (isFirstEntryOfDay && validEntryType === 'work') {
      let lateLimit;
      let toleranceUsed = 0;
      
      if (scheduleInfo.hasSchedule && scheduleInfo.lateLimit) {
        lateLimit = scheduleInfo.lateLimit;
        toleranceUsed = scheduleInfo.tolerance || 0;
      } else {
        // Fallback al comportamiento anterior (9:00 AM)
        lateLimit = scheduleInfo.defaultLateLimit || new Date(now);
        lateLimit.setHours(9, 0, 0, 0);
      }
      
      if (now > lateLimit) {
        attendance.status = "Late";
        const minutesLate = Math.ceil((now - lateLimit) / (1000 * 60));
        newEntry.notes = `Llegada tarde (${formatMinutesToHoursAndMinutes(minutesLate)} tarde)`;
        
        if (toleranceUsed > 0) {
          newEntry.notes += ` - Tolerancia de ${formatMinutesToHoursAndMinutes(toleranceUsed)} aplicada`;
        }
      } else if (scheduleInfo.hasSchedule && scheduleInfo.todaySchedule) {
        const [scheduleHours, scheduleMinutes] = scheduleInfo.todaySchedule.startTime.split(':').map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(scheduleHours, scheduleMinutes, 0, 0);
        
        if (now <= scheduledTime) {
          newEntry.notes = "Llegada puntual";
        } else {
          const minutesWithinTolerance = Math.ceil((now - scheduledTime) / (1000 * 60));
          newEntry.notes = `Llegada dentro de tolerancia (${formatMinutesToHoursAndMinutes(minutesWithinTolerance)} después del horario)`;
        }
      }
    } else {
      // Para entradas posteriores, agregar nota descriptiva
      const entryLabels = {
        'work': 'Regreso al trabajo',
        'break': 'Inicio de descanso',
        'lunch': 'Salida a almorzar'
      };
      newEntry.notes = newEntry.notes || entryLabels[validEntryType] || 'Entrada';
    }

    await attendance.save();

    res.json({ 
      message: "Check-in registrado exitosamente",
      attendance: {
        checkInTime: newEntry.checkInTime,
        status: attendance.status,
        tienda: user.tienda,
        notes: newEntry.notes,
        entryType: validEntryType,
        currentStatus: attendance.getCurrentStatus(),
        totalEntries: attendance.timeEntries.length,
        hoursWorked: attendance.hoursWorked
      },
      scheduleInfo: {
        hasCustomSchedule: scheduleInfo.hasSchedule,
        scheduledStartTime: scheduleInfo.todaySchedule?.startTime,
        tolerance: scheduleInfo.tolerance || 0,
        isWorkdayToday: scheduleInfo.isWorkday
      }
    });
  } catch (err) {
    console.error("Error en check-in:", err);
    res.status(500).json({ 
      message: "Error en check-in", 
      error: err.message 
    });
  }
});

// ✅ MEJORADO: Check-out (sin cambios significativos, pero compatible)
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    // ✅ VALIDACIÓN: Verificar si el usuario tiene horario asignado
    const scheduleInfo = await getEmployeeScheduleInfo(userId, new Date());
    if (!scheduleInfo.hasSchedule) {
      return res.status(400).json({ 
        message: "No tienes un horario asignado. Contacta al administrador para que te asigne un horario antes de hacer check-out.",
        error: "NO_SCHEDULE_ASSIGNED"
      });
    }

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    if (!attendance || !attendance.timeEntries || attendance.timeEntries.length === 0) {
      return res.status(400).json({ 
        message: "No hizo check-in hoy. Debe hacer check-in antes del check-out." 
      });
    }

    // ✅ NUEVO: Verificar si puede hacer check-out
    const canCheckOut = attendance.canCheckOut();
    if (!canCheckOut.canCheckOut) {
      return res.status(400).json({ 
        message: "Ya hiciste check-out. Debes hacer check-in primero si regresas.",
        currentStatus: attendance.getCurrentStatus(),
        reason: canCheckOut.reason
      });
    }

    const now = new Date();
    
    // ✅ NUEVO: Actualizar la última entrada con check-out
    const lastEntry = attendance.timeEntries[attendance.timeEntries.length - 1];
    lastEntry.checkOutTime = now;
    
    // ✅ NUEVO: Determinar tipo de salida y notas
    const { exitType } = req.body; // 'end_day', 'break', 'lunch'
    const validExitType = ['end_day', 'break', 'lunch'].includes(exitType) ? exitType : 'break';
    
    // Agregar notas según el tipo de salida
    let scheduleNotes = "";
    
    if (validExitType === 'end_day' && scheduleInfo.hasSchedule && scheduleInfo.todaySchedule && scheduleInfo.todaySchedule.endTime) {
      // Solo verificar horario de salida si es el final del día
      const [endHours, endMinutes] = scheduleInfo.todaySchedule.endTime.split(':').map(Number);
      const scheduledEndTime = new Date(now);
      scheduledEndTime.setHours(endHours, endMinutes, 0, 0);
      
      if (now < scheduledEndTime) {
        const minutesEarly = Math.ceil((scheduledEndTime - now) / (1000 * 60));
        scheduleNotes = `Salida temprana (${formatMinutesToHoursAndMinutes(minutesEarly)} antes del horario)`;
      } else if (now > scheduledEndTime) {
        const minutesOvertime = Math.ceil((now - scheduledEndTime) / (1000 * 60));
        scheduleNotes = `Tiempo extra trabajado (${formatMinutesToHoursAndMinutes(minutesOvertime)})`;
      } else {
        scheduleNotes = "Salida puntual";
      }
    } else {
      // Para otros tipos de salida
      const exitLabels = {
        'break': 'Salida por descanso',
        'lunch': 'Salida a almorzar',
        'end_day': 'Fin de jornada laboral'
      };
      scheduleNotes = exitLabels[validExitType] || 'Salida';
    }
    
    if (req.body.notes) {
      lastEntry.notes = (lastEntry.notes || '') + (lastEntry.notes ? ' - ' : '') + req.body.notes;
    }
    
    if (scheduleNotes) {
      lastEntry.notes = (lastEntry.notes || '') + (lastEntry.notes ? ' - ' : '') + scheduleNotes;
    }
    
    await attendance.save(); // El middleware pre('save') calculará las horas trabajadas

    res.json({ 
      message: "Check-out registrado exitosamente",
      attendance: {
        checkInTime: lastEntry.checkInTime,
        checkOutTime: lastEntry.checkOutTime,
        hoursWorked: attendance.hoursWorked,
        totalBreakTime: attendance.totalBreakTime,
        status: attendance.status,
        notes: lastEntry.notes,
        exitType: validExitType,
        currentStatus: attendance.getCurrentStatus(),
        totalEntries: attendance.timeEntries.length
      },
      scheduleInfo: {
        hasCustomSchedule: scheduleInfo.hasSchedule,
        scheduledEndTime: scheduleInfo.todaySchedule?.endTime,
        isWorkdayToday: scheduleInfo.isWorkday
      }
    });
  } catch (err) {
    console.error("Error en check-out:", err);
    res.status(500).json({ 
      message: "Error en check-out", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Endpoint para verificar horario antes del check-in
router.get("/schedule-check", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    
    const scheduleInfo = await getEmployeeScheduleInfo(userId, now);
    
    res.json({
      currentTime: now.toLocaleTimeString('es-MX'),
      dayOfWeek: now.getDay(),
      ...scheduleInfo,
      canCheckIn: scheduleInfo.isWorkday,
      lateLimit: scheduleInfo.lateLimit?.toLocaleTimeString('es-MX'),
      isCurrentlyLate: scheduleInfo.lateLimit ? now > scheduleInfo.lateLimit : false
    });
  } catch (err) {
    console.error("Error verificando horario:", err);
    res.status(500).json({ 
      message: "Error al verificar horario", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Endpoint para obtener estado actual y entradas del día
router.get("/status", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    }).populate('userId', 'username role').populate('tienda', 'nombre');
    
    if (!attendance) {
      return res.json({
        hasAttendance: false,
        currentStatus: { status: 'not_started', message: 'No ha iniciado jornada' },
        canCheckIn: true,
        canCheckOut: false,
        timeEntries: [],
        hoursWorked: 0,
        totalBreakTime: 0
      });
    }
    
    const currentStatus = attendance.getCurrentStatus();
    const canCheckIn = attendance.canCheckIn();
    const canCheckOut = attendance.canCheckOut();
    
    res.json({
      hasAttendance: true,
      currentStatus,
      canCheckIn: canCheckIn.canCheckIn,
      canCheckOut: canCheckOut.canCheckOut,
      timeEntries: attendance.timeEntries,
      hoursWorked: attendance.hoursWorked,
      totalBreakTime: attendance.totalBreakTime,
      status: attendance.status,
      isActive: attendance.isActive,
      user: attendance.userId,
      tienda: attendance.tienda
    });
  } catch (err) {
    console.error("Error obteniendo estado:", err);
    res.status(500).json({ 
      message: "Error al obtener estado", 
      error: err.message 
    });
  }
});

// Las demás rutas permanecen iguales...
// (registrar falta, reporte, today, mine)

// ✅ MIGRADO + MEJORADO: Registrar falta (solo admin)
router.post("/absence", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, reason, date } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ 
        message: "UserId y razón son requeridos" 
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Verificar si ya hay asistencia registrada ese día
    const existing = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(400).json({ 
        message: "Ya hay registro de asistencia para ese día" 
      });
    }

    // Buscar el usuario para obtener su tienda
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.tienda) {
      return res.status(400).json({ 
        message: "El empleado no tiene tienda asignada" 
      });
    }

    // ✅ VALIDACIÓN: Verificar si el usuario tiene horario asignado
    const scheduleInfo = await getEmployeeScheduleInfo(userId, startOfDay);
    if (!scheduleInfo.hasSchedule) {
      return res.status(400).json({ 
        message: "El empleado no tiene un horario asignado. Debe asignarle un horario antes de registrar ausencias.",
        error: "NO_SCHEDULE_ASSIGNED"
      });
    }

    let absenceNotes = reason.trim();
    
    if (scheduleInfo.hasSchedule && !scheduleInfo.isWorkday) {
      absenceNotes += " (Nota: No era día laboral según horario)";
    }

    const absence = new Attendance({
      userId,
      date: startOfDay,
      status: "Absent",
      absenceReason: absenceNotes,
      tienda: user.tienda,
    });

    await absence.save();

    const populatedAbsence = await Attendance.findById(absence._id)
      .populate('userId', 'username')
      .populate('tienda', 'nombre');

    res.json({ 
      message: "Falta registrada correctamente",
      absence: populatedAbsence,
      scheduleInfo: {
        wasWorkday: scheduleInfo.isWorkday,
        hasCustomSchedule: scheduleInfo.hasSchedule
      }
    });
  } catch (err) {
    console.error("Error al registrar falta:", err);
    res.status(500).json({ 
      message: "Error al registrar falta", 
      error: err.message 
    });
  }
});

// ✅ MIGRADO + MEJORADO: Reporte de asistencia (solo admin)
router.get("/report", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, startDate, endDate, tiendaId, status, limit = 100 } = req.query;

    // Construir filtro
    const filter = {};

    if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          message: "Formato de fecha inválido. Use YYYY-MM-DD" 
        });
      }
      
      filter.date = { $gte: start, $lte: end };
    } else if (startDate) {
      filter.date = { $gte: new Date(`${startDate}T00:00:00.000Z`) };
    } else if (endDate) {
      filter.date = { $lte: new Date(`${endDate}T23:59:59.999Z`) };
    }

    if (tiendaId) {
      filter.tienda = tiendaId;
    }

    if (status && ['Present', 'Absent', 'Late'].includes(status)) {
      filter.status = status;
    }

    const records = await Attendance.find(filter)
      .populate('userId', 'username role')
      .populate('tienda', 'nombre')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calcular estadísticas
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          presentes: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          ausentes: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          tardes: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          totalHoras: { $sum: "$hoursWorked" }
        }
      }
    ]);

    const estadisticas = stats[0] || {
      total: 0,
      presentes: 0,
      ausentes: 0,
      tardes: 0,
      totalHoras: 0
    };

    res.json({
      records,
      estadisticas: {
        totalRegistros: estadisticas.total,
        presentes: estadisticas.presentes,
        ausentes: estadisticas.ausentes,
        tardes: estadisticas.tardes,
        totalHorasTrabajadas: Number(estadisticas.totalHoras.toFixed(2)),
        promedioHorasPorDia: estadisticas.presentes > 0 ? 
          Number((estadisticas.totalHoras / estadisticas.presentes).toFixed(2)) : 0,
        porcentajeAsistencia: estadisticas.total > 0 ? 
          Number(((estadisticas.presentes + estadisticas.tardes) / estadisticas.total * 100).toFixed(2)) : 0
      },
      filtros: { userId, startDate, endDate, tiendaId, status }
    });
  } catch (err) {
    console.error("Error al obtener reporte:", err);
    res.status(500).json({ 
      message: "Error al obtener el reporte", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Obtener asistencia del día actual
router.get("/today", verifyToken, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const filter = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (tiendaId) {
      filter.tienda = tiendaId;
    }

    const attendances = await Attendance.find(filter)
      .populate('userId', 'username role')
      .populate('tienda', 'nombre')
      .sort({ checkInTime: -1 });

    const summary = {
      fecha: startOfDay.toISOString().split('T')[0],
      totalEmpleados: attendances.length,
      presentes: attendances.filter(a => a.status === 'Present').length,
      tardes: attendances.filter(a => a.status === 'Late').length,
      ausentes: attendances.filter(a => a.status === 'Absent').length,
      sinCheckOut: attendances.filter(a => a.checkInTime && !a.checkOutTime).length
    };

    res.json({
      attendances,
      summary
    });
  } catch (err) {
    console.error("Error obteniendo asistencia de hoy:", err);
    res.status(500).json({ 
      message: "Error al obtener asistencia de hoy", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Mi asistencia del usuario actual
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    
    const filter = { userId: req.userId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`)
      };
    }

    const myAttendances = await Attendance.find(filter)
      .populate('tienda', 'nombre')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calcular mis estadísticas
    const myStats = {
      totalDias: myAttendances.length,
      diasPresente: myAttendances.filter(a => a.status === 'Present').length,
      diasTarde: myAttendances.filter(a => a.status === 'Late').length,
      diasAusente: myAttendances.filter(a => a.status === 'Absent').length,
      totalHorasTrabajadas: myAttendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
    };

    // ✅ NUEVO: Incluir información de horario actual
    const scheduleInfo = await getEmployeeScheduleInfo(req.userId);

    res.json({
      attendances: myAttendances,
      estadisticas: {
        ...myStats,
        promedioHorasPorDia: myStats.totalDias > 0 ? 
          Number((myStats.totalHorasTrabajadas / myStats.totalDias).toFixed(2)) : 0,
        porcentajePuntualidad: myStats.totalDias > 0 ? 
          Number((myStats.diasPresente / myStats.totalDias * 100).toFixed(2)) : 0
      },
      currentSchedule: {
        hasCustomSchedule: scheduleInfo.hasSchedule,
        todaySchedule: scheduleInfo.todaySchedule,
        isWorkdayToday: scheduleInfo.isWorkday
      }
    });
  } catch (err) {
    console.error("Error obteniendo mi asistencia:", err);
    res.status(500).json({ 
      message: "Error al obtener mi asistencia", 
      error: err.message 
    });
  }
});

module.exports = router;
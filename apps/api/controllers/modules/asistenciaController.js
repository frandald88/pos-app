const Attendance = require('../../modules/asistencia/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class AsistenciaController {
  // Check-in
  async checkIn(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const userId = req.body.userId || req.userId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      const existing = await Attendance.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        userId,
        date: { $gte: startOfDay },
      });

      if (existing && existing.checkInTime) {
        return errorResponse(res, 'Ya hizo check-in hoy', 400, {
          checkInTime: existing.checkInTime
        });
      }

      const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      if (!user.tienda) {
        return errorResponse(res, 'El empleado no tiene tienda asignada. Contacte al administrador.', 400);
      }

      const attendance = existing || new Attendance({
        tenantId: req.tenantId, // Asignar tenant
        userId,
        date: new Date(),
        tienda: user.tienda,
      });

      const now = new Date();
      attendance.checkInTime = now;
      attendance.status = "Present";

      // Determinar si llegó tarde (después de las 9:00 AM)
      const tardeLimite = new Date(now);
      tardeLimite.setHours(9, 0, 0, 0);
      
      if (now > tardeLimite) {
        attendance.status = "Late";
        attendance.notes = `Llegada tarde a las ${now.toLocaleTimeString('es-MX')}`;
      }

      await attendance.save();

      return successResponse(res, {
        attendance: {
          checkInTime: attendance.checkInTime,
          status: attendance.status,
          tienda: user.tienda,
          notes: attendance.notes
        }
      }, 'Check-in registrado exitosamente');
    } catch (err) {
      console.error("Error en check-in:", err);
      return errorResponse(res, 'Error en check-in', 500);
    }
  }

  // Check-out
  async checkOut(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const userId = req.body.userId || req.userId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      const attendance = await Attendance.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        userId,
        date: { $gte: startOfDay },
      });

      if (!attendance || !attendance.checkInTime) {
        return errorResponse(res, 'No hizo check-in hoy. Debe hacer check-in antes del check-out.', 400);
      }

      if (attendance.checkOutTime) {
        return errorResponse(res, 'Ya hizo check-out hoy', 400, {
          checkOutTime: attendance.checkOutTime
        });
      }

      attendance.checkOutTime = new Date();
      await attendance.save();

      return successResponse(res, {
        attendance: {
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          hoursWorked: attendance.hoursWorked,
          status: attendance.status
        }
      }, 'Check-out registrado exitosamente');
    } catch (err) {
      console.error("Error en check-out:", err);
      return errorResponse(res, 'Error en check-out', 500);
    }
  }

  // Registrar falta
  async registerAbsence(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { userId, reason, date } = req.body;
      
      if (!userId || !reason) {
        return errorResponse(res, 'UserId y razón son requeridos', 400);
      }

      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const existing = await Attendance.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existing) {
        return errorResponse(res, 'Ya hay registro de asistencia para ese día', 400);
      }

      const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      if (!user.tienda) {
        return errorResponse(res, 'El empleado no tiene tienda asignada', 400);
      }

      const absence = new Attendance({
        tenantId: req.tenantId, // Asignar tenant
        userId,
        date: startOfDay,
        status: "Absent",
        absenceReason: reason.trim(),
        tienda: user.tienda,
      });

      await absence.save();

      const populatedAbsence = await Attendance.findById(absence._id)
        .populate('userId', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, { absence: populatedAbsence }, 'Falta registrada correctamente');
    } catch (err) {
      console.error("Error al registrar falta:", err);
      return errorResponse(res, 'Error al registrar falta', 500);
    }
  }

  // Obtener reporte de asistencia
  async getReport(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { userId, startDate, endDate, tiendaId, status, limit = 100 } = req.query;

      const filter = {
        tenantId: req.tenantId // Filtrar por tenant
      };

      if (userId) filter.userId = userId;

      if (startDate && endDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);
        const end = new Date(`${endDate}T23:59:59.999Z`);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return errorResponse(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
        }
        
        filter.date = { $gte: start, $lte: end };
      }

      if (tiendaId) filter.tienda = tiendaId;
      if (status && ['Present', 'Absent', 'Late'].includes(status)) {
        filter.status = status;
      }

      const records = await Attendance.find(filter)
        .populate('userId', 'username role')
        .populate('tienda', 'nombre')
        .sort({ date: -1 })
        .limit(parseInt(limit));

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

      return successResponse(res, {
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
      }, 'Reporte generado exitosamente');
    } catch (err) {
      console.error("Error al obtener reporte:", err);
      return errorResponse(res, 'Error al obtener el reporte', 500);
    }
  }

  // Obtener asistencia del día actual
  async getToday(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { tiendaId } = req.query;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const filter = {
        tenantId: req.tenantId, // Filtrar por tenant
        date: { $gte: startOfDay, $lte: endOfDay }
      };

      if (tiendaId) filter.tienda = tiendaId;

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

      return successResponse(res, { attendances, summary }, 'Asistencia del día obtenida exitosamente');
    } catch (err) {
      console.error("Error obteniendo asistencia de hoy:", err);
      return errorResponse(res, 'Error al obtener asistencia de hoy', 500);
    }
  }

  // Obtener mi asistencia
  async getMine(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { startDate, endDate, limit = 30 } = req.query;

      const filter = {
        tenantId: req.tenantId, // Filtrar por tenant
        userId: req.userId
      };

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

      const myStats = {
        totalDias: myAttendances.length,
        diasPresente: myAttendances.filter(a => a.status === 'Present').length,
        diasTarde: myAttendances.filter(a => a.status === 'Late').length,
        diasAusente: myAttendances.filter(a => a.status === 'Absent').length,
        totalHorasTrabajadas: myAttendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
      };

      return successResponse(res, {
        attendances: myAttendances,
        estadisticas: {
          ...myStats,
          promedioHorasPorDia: myStats.totalDias > 0 ? 
            Number((myStats.totalHorasTrabajadas / myStats.totalDias).toFixed(2)) : 0,
          porcentajePuntualidad: myStats.totalDias > 0 ? 
            Number((myStats.diasPresente / myStats.totalDias * 100).toFixed(2)) : 0
        }
      }, 'Mi asistencia obtenida exitosamente');
    } catch (err) {
      console.error("Error obteniendo mi asistencia:", err);
      return errorResponse(res, 'Error al obtener mi asistencia', 500);
    }
  }
}

module.exports = new AsistenciaController();
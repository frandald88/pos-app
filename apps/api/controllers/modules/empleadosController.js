const EmployeeHistory = require('../../modules/empleados/model');
const Attendance = require('../../modules/asistencia/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class EmpleadosController {
  /**
   * Obtener historiales eliminados
   */
  async getDeleted(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const deletedHistory = await EmployeeHistory.find({ isDeleted: true, tenantId: req.tenantId })
        .setOptions({ includeDeleted: true })
        .populate('employee', 'username')
        .populate('tienda', 'nombre')
        .populate('deletedBy', 'username')
        .sort({ deletedAt: -1 });

      // Mapear salary a sueldoDiario para compatibilidad con frontend
      const mappedHistory = deletedHistory.map(h => ({
        ...h.toObject(),
        sueldoDiario: h.salary
      }));

      return successResponse(res, mappedHistory, 'Historiales eliminados obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo historiales eliminados:', error);
      return errorResponse(res, 'Error al obtener historiales eliminados', 500);
    }
  }

  /**
   * Restaurar historial eliminado
   */
  async restore(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const history = await EmployeeHistory.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .setOptions({ includeDeleted: true });

      if (!history) {
        return errorResponse(res, 'Historial no encontrado', 404);
      }

      if (!history.isDeleted) {
        return errorResponse(res, 'El historial no esta eliminado', 400);
      }

      await history.restore();

      return successResponse(res, {
        employee: history.employee,
        position: history.position,
        nombreCompleto: history.nombreCompleto
      }, 'Historial restaurado exitosamente');
    } catch (error) {
      console.error('Error restaurando historial:', error);
      return errorResponse(res, 'Error al restaurar historial', 500);
    }
  }

  /**
   * Ranking de empleados con menos faltas
   */
  async getRankingFaltas(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { startDate, endDate, tiendaId, limit = 20 } = req.query;

      if (!startDate || !endDate) {
        return errorResponse(res, 'Se requieren fechas de inicio y fin en formato YYYY-MM-DD', 400);
      }

      const start = new Date(startDate + 'T00:00:00.000Z');
      const end = new Date(endDate + 'T23:59:59.999Z');

      if (start >= end) {
        return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de fin', 400);
      }

      const matchFilter = {
        tenantId: req.tenantId,
        date: { $gte: start, $lte: end },
        userId: { $ne: null } // Excluir registros sin usuario
      };

      if (tiendaId && tiendaId.trim() !== '') {
        try {
          const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
          matchFilter.tienda = tiendaObjectId;
        } catch (error) {
          return errorResponse(res, 'ID de tienda invalido', 400);
        }
      }

      const ranking = await Attendance.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$userId",
            totalDias: { $sum: 1 },
            faltas: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
            tardes: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
            presentes: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
            horasTrabajadas: { $sum: "$hoursWorked" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "empleado"
          }
        },
        {
          $unwind: {
            path: "$empleado",
            preserveNullAndEmptyArrays: false // No incluir usuarios eliminados
          }
        },
        {
          $project: {
            empleado: "$empleado.username",
            role: "$empleado.role",
            totalDias: 1,
            faltas: 1,
            tardes: 1,
            presentes: 1,
            horasTrabajadas: { $round: ["$horasTrabajadas", 2] },
            porcentajeAsistencia: {
              $round: [
                { $multiply: [
                  { $divide: [
                    { $add: ["$presentes", "$tardes"] },
                    "$totalDias"
                  ]},
                  100
                ]},
                2
              ]
            },
            puntuacion: {
              $subtract: [
                { $multiply: ["$presentes", 3] },
                { $add: [
                  { $multiply: ["$tardes", 1] },
                  { $multiply: ["$faltas", 5] }
                ]}
              ]
            }
          }
        },
        { $sort: { puntuacion: -1, faltas: 1 } },
        { $limit: parseInt(limit) }
      ]);

      return successResponse(res, ranking, 'Ranking generado exitosamente');
    } catch (error) {
      console.error('Error generando ranking:', error);
      return errorResponse(res, 'Error al generar ranking', 500);
    }
  }

  /**
   * Obtener empleados activos
   */
  async getActivos(req, res) {
    try {
      const startTime = Date.now();

      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { tiendaId } = req.query;

      const filter = { tenantId: req.tenantId, isActive: true };
      if (tiendaId) filter.tienda = tiendaId;

      const step1Time = Date.now();
      const empleadosActivos = await EmployeeHistory.find(filter)
        .populate('employee', 'username role telefono')
        .populate('tienda', 'nombre')
        .select('employee tienda startDate salary position nombre apellidoPaterno apellidoMaterno isActive')
        .sort({ startDate: -1 })
        .lean();

      const step2Time = Date.now();
      console.log(`⏱️ [getActivos] Query time: ${step2Time - step1Time}ms`);

      const empleadosConAntiguedad = empleadosActivos.map(emp => {
        const antiguedad = Math.floor((new Date() - emp.startDate) / (1000 * 60 * 60 * 24));
        return {
          ...emp,
          antiguedadDias: antiguedad,
          antiguedadMeses: Math.floor(antiguedad / 30),
          antiguedadAños: Math.floor(antiguedad / 365),
          sueldoDiario: emp.salary // Mapear para compatibilidad con frontend
        };
      });

      const endTime = Date.now();
      console.log(`⏱️ [getActivos] TIEMPO TOTAL: ${endTime - startTime}ms`);

      return successResponse(res, {
        empleados: empleadosConAntiguedad,
        total: empleadosConAntiguedad.length
      }, 'Empleados activos obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo empleados activos:', error);
      return errorResponse(res, 'Error al obtener empleados activos', 500);
    }
  }

  /**
   * Crear historial de empleado
   */
  async createHistory(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { employee, tienda, sueldoDiario, seguroSocial, startDate, endDate, motivoBaja, razonBaja, position, notes, nombre, apellidoPaterno, apellidoMaterno, rfc, curp, numeroSeguroSocial } = req.body;

      if (!employee || !tienda || !sueldoDiario) {
        return errorResponse(res, 'Employee, tienda y sueldoDiario son campos requeridos', 400);
      }

      if (!nombre || !apellidoPaterno || !apellidoMaterno) {
        return errorResponse(res, 'Nombre, apellido paterno y apellido materno son requeridos', 400);
      }

      if (sueldoDiario <= 0) {
        return errorResponse(res, 'El sueldo diario debe ser mayor a 0', 400);
      }

      const userExists = await User.findOne({ _id: employee, tenantId: req.tenantId });
      if (!userExists) {
        return errorResponse(res, 'Empleado no encontrado', 404);
      }

      // Verificar si ya tiene historial activo (solo si no se esta dando de baja inmediatamente)
      if (!endDate) {
        const existingActive = await EmployeeHistory.findOne({
          tenantId: req.tenantId,
          employee,
          isActive: true
        });

        if (existingActive) {
          return errorResponse(res, 'Este empleado ya tiene un historial activo. Debe dar de baja el actual primero.', 400);
        }
      }

      // Construir objeto limpio sin campos vacios
      const historyData = {
        tenantId: req.tenantId,
        employee,
        tienda,
        startDate: startDate ? new Date(startDate) : new Date(),
        salary: parseFloat(sueldoDiario), // Mapear sueldoDiario a salary
        seguroSocial: seguroSocial ? 'Sí' : 'No',
        position: (position && position.trim()) ? position.trim() : 'Empleado',
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        isActive: !endDate // Si hay endDate, no esta activo
      };

      // Solo agregar campos opcionales si tienen valor valido
      if (endDate && endDate.trim()) {
        historyData.endDate = new Date(endDate);
        historyData.isActive = false;

        if (motivoBaja && motivoBaja.trim() && motivoBaja !== '') {
          historyData.motivoBaja = motivoBaja.trim();
        }

        if (razonBaja && razonBaja.trim() && razonBaja !== '') {
          historyData.razonBaja = razonBaja.trim();
        }
      }

      if (notes && notes.trim() && notes.trim() !== '') {
        historyData.notes = notes.trim();
      }

      if (rfc && rfc.trim()) {
        historyData.rfc = rfc.trim().toUpperCase();
      }
      if (curp && curp.trim()) {
        historyData.curp = curp.trim().toUpperCase();
      }
      if (numeroSeguroSocial && numeroSeguroSocial.trim()) {
        historyData.numeroSeguroSocial = numeroSeguroSocial.trim();
      }

      console.log('Creating employee history with data:', historyData);

      const history = new EmployeeHistory(historyData);
      await history.save();

      const populatedHistory = await EmployeeHistory.findById(history._id)
        .populate('employee', 'username role')
        .populate('tienda', 'nombre');

      console.log('Employee history created successfully:', populatedHistory._id);

      return successResponse(res, populatedHistory, 'Historial creado exitosamente', 201);
    } catch (error) {
      console.error('Error creando historial:', error);
      return errorResponse(res, 'Error al crear historial', 500);
    }
  }

  /**
   * Obtener historial completo
   */
  async getHistory(req, res) {
    try {
      const startTime = Date.now();

      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { isActive, tiendaId, employeeId, limit = 100, includeDeleted = false } = req.query;

      const filter = { tenantId: req.tenantId };

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
      if (tiendaId) filter.tienda = tiendaId;
      if (employeeId) filter.employee = employeeId;

      let query = EmployeeHistory.find(filter);

      // Opcion para incluir eliminados
      if (includeDeleted === 'true') {
        query = query.setOptions({ includeDeleted: true });
      }

      const step1Time = Date.now();
      const history = await query
        .populate('employee', 'username role telefono')
        .populate('tienda', 'nombre')
        .select('employee tienda startDate endDate salary position isActive nombre apellidoPaterno apellidoMaterno seguroSocial motivoBaja razonBaja notes rfc curp numeroSeguroSocial createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      const step2Time = Date.now();
      console.log(`⏱️ [getHistory] Query time: ${step2Time - step1Time}ms (${history.length} records)`);

      // Mapear salary a sueldoDiario para compatibilidad con frontend
      const mappedHistory = history.map(h => ({
        ...h,
        sueldoDiario: h.salary
      }));

      const endTime = Date.now();
      console.log(`⏱️ [getHistory] TIEMPO TOTAL: ${endTime - startTime}ms`);

      return successResponse(res, mappedHistory, 'Historial obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return errorResponse(res, 'Error al cargar historial', 500);
    }
  }

  /**
   * Actualizar historial
   */
  async updateHistory(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const {
        startDate, endDate, seguroSocial, motivoBaja, razonBaja, sueldoDiario, position, notes,
        nombre, apellidoPaterno, apellidoMaterno, rfc, curp, numeroSeguroSocial
      } = req.body;
      const { id } = req.params;

      const history = await EmployeeHistory.findOne({ _id: id, tenantId: req.tenantId });
      if (!history) {
        return errorResponse(res, 'Historial no encontrado', 404);
      }

      const updateData = {};

      // Fecha de inicio
      if (startDate !== undefined) {
        const startDateTime = new Date(startDate);

        // Si ya existe una fecha de baja, validar que la nueva fecha de inicio sea anterior
        if (history.endDate && startDateTime >= history.endDate) {
          return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de baja', 400);
        }

        updateData.startDate = startDateTime;
      }

      // Campos laborales existentes
      if (endDate) {
        if (!motivoBaja || !razonBaja) {
          return errorResponse(res, 'Para dar de baja se requieren motivoBaja y razonBaja', 400);
        }

        const endDateTime = new Date(endDate);
        // Usar la fecha de inicio actualizada si existe, sino la del historial
        const currentStartDate = updateData.startDate || history.startDate;

        if (endDateTime <= currentStartDate) {
          return errorResponse(res, 'La fecha de baja debe ser posterior a la fecha de alta', 400);
        }

        updateData.endDate = endDateTime;
        updateData.motivoBaja = motivoBaja;
        updateData.razonBaja = razonBaja.trim();
        updateData.isActive = false;
      }

      if (seguroSocial !== undefined) updateData.seguroSocial = seguroSocial ? 'Sí' : 'No';
      if (sueldoDiario !== undefined) {
        if (sueldoDiario <= 0) {
          return errorResponse(res, 'El sueldo diario debe ser mayor a 0', 400);
        }
        updateData.salary = parseFloat(sueldoDiario);
      }
      if (position !== undefined) updateData.position = position?.trim() || '';
      if (notes !== undefined) updateData.notes = notes?.trim() || '';

      // Campos personales
      if (nombre !== undefined) updateData.nombre = nombre?.trim() || '';
      if (apellidoPaterno !== undefined) updateData.apellidoPaterno = apellidoPaterno?.trim() || '';
      if (apellidoMaterno !== undefined) updateData.apellidoMaterno = apellidoMaterno?.trim() || '';
      if (rfc !== undefined) updateData.rfc = rfc?.trim()?.toUpperCase() || null;
      if (curp !== undefined) updateData.curp = curp?.trim()?.toUpperCase() || null;
      if (numeroSeguroSocial !== undefined) updateData.numeroSeguroSocial = numeroSeguroSocial?.trim() || null;

      const updatedHistory = await EmployeeHistory.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('employee', 'username role')
       .populate('tienda', 'nombre');

      return successResponse(res, updatedHistory, 'Historial actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando historial:', error);
      return errorResponse(res, 'Error al actualizar', 500);
    }
  }

  /**
   * Eliminar registro (con soft delete)
   */
  async deleteHistory(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { id } = req.params;

      const history = await EmployeeHistory.findOne({ _id: id, tenantId: req.tenantId });
      if (!history) {
        return errorResponse(res, 'Historial no encontrado', 404);
      }

      if (history.isDeleted) {
        return errorResponse(res, 'El historial ya esta eliminado', 400);
      }

      // Verificar si tiene registros de asistencia
      const attendanceCount = await Attendance.countDocuments({ tenantId: req.tenantId, userId: history.employee });

      if (attendanceCount > 0) {
        // Hacer soft delete en lugar de prevenir eliminacion
        await history.softDelete(req.userId);

        return successResponse(res, {
          note: `Se mantuvo el historial debido a ${attendanceCount} registros de asistencia asociados. Se puede restaurar desde la seccion de historiales eliminados.`,
          relatedRecords: {
            attendance: attendanceCount
          },
          action: 'soft_deleted'
        }, 'Historial eliminado exitosamente (soft delete aplicado)');
      }

      // Si no hay registros relacionados, permitir eliminacion completa
      await EmployeeHistory.findByIdAndDelete(id);

      return successResponse(res, {
        action: 'hard_deleted'
      }, 'Historial eliminado permanentemente');
    } catch (error) {
      console.error('Error eliminando historial:', error);
      return errorResponse(res, 'Error al eliminar', 500);
    }
  }

  /**
   * Obtener historial por employeeId
   */
  async getByEmployee(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { employeeId } = req.params;

      if (!employeeId) {
        return errorResponse(res, 'Employee ID es requerido', 400);
      }

      const history = await EmployeeHistory.findOne({
        tenantId: req.tenantId,
        employee: employeeId,
        isActive: true
      })
        .populate('employee', 'username')
        .populate('tienda', 'nombre');

      if (!history) {
        return successResponse(res, null, 'No se encontró historial activo para este empleado');
      }

      // Mapear salary a sueldoDiario para compatibilidad con frontend
      const mappedHistory = {
        ...history.toObject(),
        sueldoDiario: history.salary
      };

      return successResponse(res, mappedHistory, 'Historial obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo historial por empleado:', error);
      return errorResponse(res, 'Error al obtener historial', 500);
    }
  }
}

module.exports = new EmpleadosController();

const VacationRequest = require('../../modules/vacaciones/model');
const User = require('../../core/users/model');
const EmployeeHistory = require('../../modules/empleados/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class VacacionesController {
  /**
   * Calcular días disponibles según antigüedad usando startDate del historial
   */
  calcularDiasDisponibles(fechaIngreso) {
    const ahora = new Date();
    const años = (ahora - fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25);
    let dias = 0;

    if (años >= 1) dias = 12;
    if (años >= 2) dias = 14;
    if (años >= 3) dias = 16;
    if (años >= 4) dias = 18;
    if (años >= 5) dias = 20;
    if (años >= 6) dias += Math.floor((años - 5) / 5) * 2;

    return Math.floor(dias);
  }

  /**
   * Obtener solicitudes eliminadas (soft delete)
   */
  async getDeleted(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { limit = 50 } = req.query;

      const deletedRequests = await VacationRequest.find({ tenantId: req.tenantId, isDeleted: true })
        .setOptions({ includeDeleted: true })
        .populate('employee', 'username')
        .populate('replacement', 'username')
        .populate('tienda', 'nombre')
        .populate('deletedBy', 'username')
        .sort({ deletedAt: -1 })
        .limit(parseInt(limit));

      const requestsWithDays = deletedRequests.map(req => ({
        ...req.toObject(),
        daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
      }));

      return successResponse(res, requestsWithDays, 'Solicitudes eliminadas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo solicitudes eliminadas:', error);
      return errorResponse(res, 'Error obteniendo solicitudes eliminadas', 500);
    }
  }

  /**
   * Restaurar solicitud eliminada
   */
  async restore(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const request = await VacationRequest.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .setOptions({ includeDeleted: true });

      if (!request) {
        return errorResponse(res, 'Solicitud no encontrada', 404);
      }

      if (!request.isDeleted) {
        return errorResponse(res, 'La solicitud no está eliminada', 400);
      }

      await request.restore();

      return successResponse(res, {
        employee: request.employeeInfo?.username || 'Usuario desconocido',
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate
      }, 'Solicitud de vacaciones restaurada exitosamente');
    } catch (error) {
      console.error('Error restaurando solicitud:', error);
      return errorResponse(res, 'Error al restaurar solicitud', 500);
    }
  }

  /**
   * Limpieza masiva de solicitudes viejas
   */
  async cleanup(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const {
        months = 12,
        status = 'all',
        action = 'soft',
        confirm = false
      } = req.body;

      if (!confirm) {
        return errorResponse(res, 'Debes confirmar la acción estableciendo confirm: true', 400);
      }

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));

      const filter = {
        tenantId: req.tenantId,
        createdAt: { $lt: cutoffDate }
      };

      if (status !== 'all') {
        filter.status = status;
      }

      const totalCount = await VacationRequest.countDocuments(filter);

      if (totalCount === 0) {
        return successResponse(res, {
          deleted: 0,
          criteria: {
            olderThan: `${months} meses`,
            status: status,
            cutoffDate: cutoffDate.toISOString()
          }
        }, 'No se encontraron solicitudes que cumplan los criterios');
      }

      let result;

      if (action === 'hard') {
        result = await VacationRequest.deleteMany(filter);

        return successResponse(res, {
          deleted: result.deletedCount,
          action: 'hard_delete',
          criteria: {
            olderThan: `${months} meses`,
            status: status,
            cutoffDate: cutoffDate.toISOString()
          }
        }, `${result.deletedCount} solicitudes eliminadas permanentemente`);
      } else {
        const requestsToDelete = await VacationRequest.find(filter)
          .populate('employee', 'username role');

        for (const request of requestsToDelete) {
          await request.softDelete(req.userId, {
            username: request.employee?.username || 'Usuario desconocido',
            role: request.employee?.role || 'N/A'
          });
        }

        return successResponse(res, {
          deleted: requestsToDelete.length,
          action: 'soft_delete',
          criteria: {
            olderThan: `${months} meses`,
            status: status,
            cutoffDate: cutoffDate.toISOString()
          },
          note: 'Las solicitudes pueden ser restauradas desde la sección de eliminados'
        }, `${requestsToDelete.length} solicitudes eliminadas (soft delete)`);
      }
    } catch (error) {
      console.error('Error en limpieza:', error);
      return errorResponse(res, 'Error en limpieza masiva', 500);
    }
  }

  /**
   * Obtener días disponibles usando EmployeeHistory
   */
  async getDaysAvailable(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { userId } = req.params;

      // Solo admin puede consultar días de otros usuarios
      if (req.userId !== userId) {
        const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
        if (currentUser.role !== 'admin') {
          return errorResponse(res, 'Solo puedes consultar tus propios días disponibles', 403);
        }
      }

      const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Empleado no encontrado', 404);
      }

      // Buscar historial laboral activo
      let employeeHistory = await EmployeeHistory.findOne({
        tenantId: req.tenantId,
        employee: userId,
        isActive: true
      });

      // Fallback: Si no hay historial activo, buscar el más reciente
      if (!employeeHistory) {
        employeeHistory = await EmployeeHistory.findOne({
          tenantId: req.tenantId,
          employee: userId
        }).sort({ startDate: -1 });
      }

      const fechaIngreso = employeeHistory ? employeeHistory.startDate : user.createdAt;
      const source = employeeHistory ? 'historial laboral' : 'creación de usuario';

      console.log(`📅 Calculando vacaciones para ${user.username} desde ${fechaIngreso} (fuente: ${source})`);

      const totalDays = this.calcularDiasDisponibles(fechaIngreso);

      const daysTakenFromUser = user.daysTaken || 0;

      // Calcular días tomados de solicitudes aprobadas para comparación
      const usedDays = await VacationRequest.aggregate([
        { $match: { tenantId: req.tenantId, employee: user._id, status: 'aprobada' } },
        {
          $project: {
            days: {
              $add: [
                { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] },
                1
              ]
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$days" } } }
      ]);

      const calculatedTakenDays = usedDays[0]?.total || 0;
      const takenDays = daysTakenFromUser;
      const availableDays = Math.max(0, totalDays - takenDays);

      return successResponse(res, {
        employee: user.username,
        totalDays,
        takenDays: Math.floor(takenDays),
        availableDays: Math.floor(availableDays),
        yearsOfService: ((new Date() - fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1),
        startDate: fechaIngreso,
        source: source,
        hasEmployeeHistory: !!employeeHistory,
        employeeHistoryId: employeeHistory?._id || null,
        diagnostics: {
          daysTakenFromUser: Math.floor(daysTakenFromUser),
          calculatedFromRequests: Math.floor(calculatedTakenDays),
          needsSync: Math.floor(daysTakenFromUser) !== Math.floor(calculatedTakenDays)
        }
      }, 'Días disponibles calculados exitosamente');
    } catch (error) {
      console.error('Error calculando días disponibles:', error);
      return errorResponse(res, 'Error calculando días disponibles', 500);
    }
  }

  /**
   * Crear nueva solicitud usando EmployeeHistory
   */
  async createRequest(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { startDate, endDate, replacement, tienda, employeeId } = req.body;

      if (!startDate || !endDate || !tienda) {
        return errorResponse(res, 'Faltan campos obligatorios: startDate, endDate, tienda', 400);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start > end) {
        return errorResponse(res, 'La fecha de inicio no puede ser posterior a la fecha de fin', 400);
      }

      if (start < today) {
        return errorResponse(res, 'No se pueden solicitar vacaciones para fechas pasadas', 400);
      }

      const targetEmployeeId = employeeId || req.userId;

      // Verificar permisos: solo admin puede solicitar para otros
      if (employeeId && employeeId !== req.userId) {
        const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
        if (currentUser.role !== 'admin') {
          return errorResponse(res, 'Solo los administradores pueden solicitar vacaciones para otros empleados', 403);
        }
      }

      const user = await User.findOne({ _id: targetEmployeeId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Empleado no encontrado', 404);
      }

      // Buscar historial laboral para obtener fecha de ingreso
      let employeeHistory = await EmployeeHistory.findOne({
        tenantId: req.tenantId,
        employee: targetEmployeeId,
        isActive: true
      });

      if (!employeeHistory) {
        employeeHistory = await EmployeeHistory.findOne({
          tenantId: req.tenantId,
          employee: targetEmployeeId
        }).sort({ startDate: -1 });
      }

      const fechaIngreso = employeeHistory ? employeeHistory.startDate : user.createdAt;
      const totalDays = this.calcularDiasDisponibles(fechaIngreso);

      if (totalDays === 0) {
        return errorResponse(res, 'Aún no tienes días de vacaciones disponibles. Necesitas al menos 1 año de antigüedad desde tu fecha de ingreso.', 400);
      }

      const takenDays = user.daysTaken || 0;
      const availableDays = Math.max(0, totalDays - takenDays);
      const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (requestedDays > availableDays) {
        return errorResponse(res, `Solo tienes ${Math.floor(availableDays)} días disponibles. Solicitas ${requestedDays} días.`, 400);
      }

      // Verificar conflictos
      const conflictingRequest = await VacationRequest.findOne({
        tenantId: req.tenantId,
        employee: targetEmployeeId,
        status: 'aprobada',
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
      });

      if (conflictingRequest) {
        return errorResponse(res, `${user.username} ya tiene vacaciones aprobadas en esas fechas`, 400);
      }

      const request = new VacationRequest({
        tenantId: req.tenantId,
        employee: targetEmployeeId,
        tienda,
        startDate: start,
        endDate: end,
        replacement,
      });

      await request.save();

      const populatedRequest = await VacationRequest.findById(request._id)
        .populate('employee', 'username')
        .populate('replacement', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, {
        request: populatedRequest,
        daysRequested: requestedDays,
        calculatedFrom: employeeHistory ? 'historial laboral' : 'creación de usuario'
      }, 'Solicitud de vacaciones enviada exitosamente', 201);
    } catch (error) {
      console.error('Error creando solicitud:', error);
      return errorResponse(res, 'Error creando solicitud', 500);
    }
  }

  /**
   * Obtener mis solicitudes
   */
  async getMine(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, limit = 20 } = req.query;
      const filter = { tenantId: req.tenantId, employee: req.userId };

      if (status && ['pendiente', 'aprobada', 'rechazada'].includes(status)) {
        filter.status = status;
      }

      const requests = await VacationRequest.find(filter)
        .populate('replacement', 'username')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const requestsWithDays = requests.map(req => ({
        ...req.toObject(),
        daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
      }));

      return successResponse(res, requestsWithDays, 'Solicitudes obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo mis solicitudes:', error);
      return errorResponse(res, 'Error obteniendo solicitudes', 500);
    }
  }

  /**
   * Ver todas las solicitudes (admin)
   */
  async getAll(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, tiendaId, employeeId, startDate, endDate, limit = 50, includeDeleted = false } = req.query;
      const filter = { tenantId: req.tenantId };

      if (status && ['pendiente', 'aprobada', 'rechazada'].includes(status)) {
        filter.status = status;
      }
      if (tiendaId) filter.tienda = tiendaId;
      if (employeeId) filter.employee = employeeId;

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }

      let query = VacationRequest.find(filter);

      if (includeDeleted === 'true') {
        query = query.setOptions({ includeDeleted: true });
      }

      const requests = await query
        .populate('employee', 'username')
        .populate('replacement', 'username')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const requestsWithDays = requests.map(req => ({
        ...req.toObject(),
        daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
      }));

      return successResponse(res, requestsWithDays, 'Solicitudes obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return errorResponse(res, 'Error obteniendo solicitudes', 500);
    }
  }

  /**
   * Aprobar o Rechazar solicitud
   */
  async updateStatus(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, reason } = req.body;

      if (!['aprobada', 'rechazada'].includes(status)) {
        return errorResponse(res, 'Estado inválido. Debe ser "aprobada" o "rechazada"', 400);
      }

      const request = await VacationRequest.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!request) {
        return errorResponse(res, 'Solicitud no encontrada', 404);
      }

      if (request.status !== 'pendiente') {
        return errorResponse(res, `Esta solicitud ya está ${request.status}`, 400);
      }

      if (status === 'rechazada' && (!reason || reason.trim() === '')) {
        return errorResponse(res, 'Debes proporcionar una razón para rechazar la solicitud', 400);
      }

      const updatedRequest = await VacationRequest.findByIdAndUpdate(
        req.params.id,
        { status, reason: reason?.trim() || '' },
        { new: true }
      ).populate('employee', 'username')
       .populate('replacement', 'username')
       .populate('tienda', 'nombre');

      return successResponse(res, updatedRequest, `Solicitud ${status} exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      return errorResponse(res, 'Error actualizando estado', 500);
    }
  }

  /**
   * Eliminar solicitud individual
   */
  async deleteRequest(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { action = 'soft' } = req.body;

      const request = await VacationRequest.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .setOptions({ includeDeleted: true })
        .populate('employee', 'username role');

      if (!request) {
        return errorResponse(res, 'Solicitud no encontrada', 404);
      }

      if (request.isDeleted && action === 'soft') {
        return errorResponse(res, 'La solicitud ya está eliminada', 400);
      }

      if (action === 'hard') {
        await VacationRequest.deleteOne({ _id: req.params.id });

        return successResponse(res, { action: 'hard_delete' }, 'Solicitud eliminada permanentemente');
      } else {
        await request.softDelete(req.userId, {
          username: request.employee?.username || 'Usuario desconocido',
          role: request.employee?.role || 'N/A'
        });

        return successResponse(res, {
          action: 'soft_delete',
          note: 'La solicitud puede ser restaurada desde la sección de eliminados'
        }, 'Solicitud eliminada exitosamente (soft delete)');
      }
    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      return errorResponse(res, 'Error al eliminar solicitud', 500);
    }
  }

  /**
   * Obtener solicitud por ID
   */
  async getById(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const request = await VacationRequest.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('employee', 'username')
        .populate('replacement', 'username')
        .populate('tienda', 'nombre');

      if (!request) {
        return errorResponse(res, 'Solicitud no encontrada', 404);
      }

      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
      if (currentUser.role !== 'admin' && request.employee._id.toString() !== req.userId) {
        return errorResponse(res, 'No tienes permisos para ver esta solicitud', 403);
      }

      const requestWithDays = {
        ...request.toObject(),
        daysRequested: Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1
      };

      return successResponse(res, requestWithDays, 'Solicitud obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      return errorResponse(res, 'Error obteniendo solicitud', 500);
    }
  }

  /**
   * Verificar/sincronizar datos de vacaciones
   */
  async verify(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { userId } = req.params;

      const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      const employeeHistory = await EmployeeHistory.findOne({
        tenantId: req.tenantId,
        employee: userId,
        isActive: true
      });

      const allHistory = await EmployeeHistory.find({
        tenantId: req.tenantId,
        employee: userId
      }).sort({ startDate: -1 });

      const vacationRequests = await VacationRequest.find({
        tenantId: req.tenantId,
        employee: userId
      }).sort({ createdAt: -1 });

      return successResponse(res, {
        user: {
          username: user.username,
          createdAt: user.createdAt,
          role: user.role
        },
        activeHistory: employeeHistory,
        allHistory: allHistory,
        vacationRequests: vacationRequests,
        calculationInfo: {
          usingHistoryDate: !!employeeHistory,
          sourceDate: employeeHistory?.startDate || user.createdAt,
          source: employeeHistory ? 'Employee History' : 'User Creation'
        }
      }, 'Datos verificados exitosamente');
    } catch (error) {
      console.error('Error verificando datos:', error);
      return errorResponse(res, 'Error verificando datos', 500);
    }
  }

  /**
   * Actualizar días tomados para vacaciones aprobadas vencidas
   */
  async updateTakenDays(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const expiredRequests = await VacationRequest.find({
        tenantId: req.tenantId,
        status: 'aprobada',
        endDate: { $lt: today },
        daysTakenUpdated: { $ne: true }
      }).populate('employee', 'username daysTaken');

      console.log(`🔍 Found ${expiredRequests.length} expired approved vacation requests to process`);

      let updatesCount = 0;
      const updates = [];

      for (const request of expiredRequests) {
        if (!request.employee) {
          console.log(`⚠️ Skipping request ${request._id}: employee not found`);
          continue;
        }

        const daysRequested = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1;
        const currentDaysTaken = request.employee.daysTaken || 0;
        const newDaysTaken = currentDaysTaken + daysRequested;

        await User.findByIdAndUpdate(request.employee._id, {
          daysTaken: newDaysTaken
        });

        await VacationRequest.findByIdAndUpdate(request._id, {
          daysTakenUpdated: true
        });

        updates.push({
          employee: request.employee.username,
          requestId: request._id,
          daysRequested,
          previousDaysTaken: currentDaysTaken,
          newDaysTaken,
          vacationPeriod: {
            startDate: request.startDate,
            endDate: request.endDate
          }
        });

        updatesCount++;
        console.log(`✅ Updated ${request.employee.username}: ${currentDaysTaken} + ${daysRequested} = ${newDaysTaken} days taken`);
      }

      return successResponse(res, {
        updatesCount,
        totalProcessed: expiredRequests.length,
        updates
      }, `Se actualizaron los días tomados para ${updatesCount} solicitudes vencidas`);
    } catch (error) {
      console.error('Error updating taken days:', error);
      return errorResponse(res, 'Error al actualizar días tomados', 500);
    }
  }

  /**
   * Obtener resumen de días tomados por empleado
   */
  async getDaysSummary(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { userId } = req.params;

      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
      if (currentUser.role !== 'admin' && req.userId !== userId) {
        return errorResponse(res, 'No tienes permisos para ver esta información', 403);
      }

      const user = await User.findOne({ _id: userId, tenantId: req.tenantId }).select('username daysTaken');
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      const approvedThisYear = await VacationRequest.find({
        tenantId: req.tenantId,
        employee: userId,
        status: 'aprobada',
        startDate: { $gte: yearStart, $lte: yearEnd }
      }).sort({ startDate: 1 });

      const today = new Date();
      let totalApprovedDays = 0;
      let takenDays = 0;
      let pendingDays = 0;

      const breakdown = approvedThisYear.map(request => {
        const days = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1;
        totalApprovedDays += days;

        const isExpired = request.endDate < today;
        if (isExpired) {
          takenDays += days;
        } else {
          pendingDays += days;
        }

        return {
          requestId: request._id,
          startDate: request.startDate,
          endDate: request.endDate,
          days,
          status: isExpired ? 'tomadas' : 'pendientes'
        };
      });

      return successResponse(res, {
        employee: user.username,
        year: currentYear,
        summary: {
          totalRecordedTaken: user.daysTaken || 0,
          calculatedTaken: takenDays,
          pendingToTake: pendingDays,
          totalApproved: totalApprovedDays
        },
        breakdown
      }, 'Resumen de días obtenido exitosamente');
    } catch (error) {
      console.error('Error getting days summary:', error);
      return errorResponse(res, 'Error al obtener resumen de días', 500);
    }
  }
}

module.exports = new VacacionesController();

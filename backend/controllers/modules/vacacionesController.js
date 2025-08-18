const VacationRequest = require('../../modules/vacaciones/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class VacacionesController {
  // Calcular días disponibles según antigüedad
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

  // Obtener días disponibles para un empleado
  async getDaysAvailable(req, res) {
    try {
      const { userId } = req.params;
      
      // Solo admin puede consultar días de otros usuarios
      if (req.userId !== userId) {
        const currentUser = await User.findById(req.userId);
        if (currentUser.role !== 'admin') {
          return errorResponse(res, 'Solo puedes consultar tus propios días disponibles', 403);
        }
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 'Empleado no encontrado', 404);
      }

      const totalDays = this.calcularDiasDisponibles(user.createdAt);

      // Calcular días ya tomados
      const usedDays = await VacationRequest.aggregate([
        { $match: { employee: user._id, status: 'aprobada' } },
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

      const takenDays = usedDays[0]?.total || 0;
      const availableDays = Math.max(0, totalDays - takenDays);

      return successResponse(res, { 
        employee: user.username,
        totalDays, 
        takenDays: Math.floor(takenDays), 
        availableDays: Math.floor(availableDays),
        yearsOfService: ((new Date() - user.createdAt) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
      }, 'Días calculados exitosamente');
    } catch (err) {
      console.error('Error calculando días disponibles:', err);
      return errorResponse(res, 'Error calculando días disponibles', 500);
    }
  }

  // Crear solicitud de vacaciones
  async createRequest(req, res) {
    try {
      const { startDate, endDate, replacement, tienda } = req.body;
      
      if (!startDate || !endDate || !tienda) {
        return errorResponse(res, 'Faltan campos obligatorios: startDate, endDate, tienda', 400);
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Validar fechas
      if (start >= end) {
        return errorResponse(res, 'La fecha de fin debe ser posterior a la fecha de inicio', 400);
      }
      
      if (start < today) {
        return errorResponse(res, 'No se pueden solicitar vacaciones para fechas pasadas', 400);
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }
      
      const totalDays = this.calcularDiasDisponibles(user.createdAt);
      
      if (totalDays === 0) {
        return errorResponse(res, 'Aún no tienes días de vacaciones disponibles. Necesitas al menos 1 año de antigüedad.', 400);
      }

      // Calcular días ya usados
      const usedDays = await VacationRequest.aggregate([
        { $match: { employee: user._id, status: 'aprobada' } },
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

      const takenDays = usedDays[0]?.total || 0;
      const availableDays = Math.max(0, totalDays - takenDays);
      const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      if (requestedDays > availableDays) {
        return errorResponse(res, `Solo tienes ${Math.floor(availableDays)} días disponibles. Solicitas ${requestedDays} días.`, 400);
      }

      const request = new VacationRequest({
        employee: req.userId,
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
        daysRequested: requestedDays
      }, 'Solicitud de vacaciones enviada exitosamente', 201);
    } catch (err) {
      console.error('Error creando solicitud:', err);
      return errorResponse(res, 'Error creando solicitud', 500);
    }
  }

  // Obtener mis solicitudes
  async getMine(req, res) {
    try {
      const { status, limit = 20 } = req.query;
      const filter = { employee: req.userId };
      
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
    } catch (err) {
      console.error('Error obteniendo mis solicitudes:', err);
      return errorResponse(res, 'Error obteniendo solicitudes', 500);
    }
  }

  // Obtener todas las solicitudes (admin)
  async getAll(req, res) {
    try {
      const { status, tiendaId, employeeId, startDate, endDate, limit = 50 } = req.query;
      const filter = {};

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

      const requests = await VacationRequest.find(filter)
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
    } catch (err) {
      console.error('Error obteniendo solicitudes:', err);
      return errorResponse(res, 'Error obteniendo solicitudes', 500);
    }
  }

  // Aprobar/Rechazar solicitud
  async updateStatus(req, res) {
    try {
      const { status, reason } = req.body;
      const { id } = req.params;
      
      if (!['aprobada', 'rechazada'].includes(status)) {
        return errorResponse(res, 'Estado inválido. Debe ser "aprobada" o "rechazada"', 400);
      }
      
      const request = await VacationRequest.findById(id);
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
        id, 
        { status, reason: reason?.trim() || '' },
        { new: true }
      ).populate('employee', 'username')
       .populate('replacement', 'username')
       .populate('tienda', 'nombre');
      
      return successResponse(res, { request: updatedRequest }, `Solicitud ${status} exitosamente`);
    } catch (err) {
      console.error('Error actualizando estado:', err);
      return errorResponse(res, 'Error actualizando estado', 500);
    }
  }
}

module.exports = new VacacionesController();
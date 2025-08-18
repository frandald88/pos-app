const express = require('express');
const router = express.Router();
const VacationRequest = require('./model');
const User = require('../../core/users/model');
const EmployeeHistory = require('../empleados/model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ NUEVAS RUTAS PARA GESTIÓN DE ELIMINACIÓN (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)

// Obtener solicitudes eliminadas (solo admin)
router.get('/deleted', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const deletedRequests = await VacationRequest.find({ isDeleted: true })
      .setOptions({ includeDeleted: true })
      .populate('employee', 'username')
      .populate('replacement', 'username')
      .populate('tienda', 'nombre')
      .populate('deletedBy', 'username')
      .sort({ deletedAt: -1 })
      .limit(parseInt(limit));

    // Agregar días solicitados a cada request
    const requestsWithDays = deletedRequests.map(req => ({
      ...req.toObject(),
      daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
    }));

    res.json(requestsWithDays);
  } catch (err) {
    console.error('Error obteniendo solicitudes eliminadas:', err);
    res.status(500).json({ message: 'Error obteniendo solicitudes eliminadas', error: err.message });
  }
});

// Restaurar solicitud eliminada (solo admin)
router.patch('/:id/restore', verifyToken, requireAdmin, async (req, res) => {
  try {
    const request = await VacationRequest.findById(req.params.id)
      .setOptions({ includeDeleted: true });
      
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (!request.isDeleted) {
      return res.status(400).json({ message: 'La solicitud no está eliminada' });
    }

    await request.restore();
    
    res.json({ 
      message: 'Solicitud de vacaciones restaurada exitosamente',
      request: {
        employee: request.employeeInfo?.username || 'Usuario desconocido',
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate
      }
    });
  } catch (err) {
    console.error('Error restaurando solicitud:', err);
    res.status(400).json({ 
      message: 'Error al restaurar solicitud', 
      error: err.message 
    });
  }
});

// Limpieza masiva de solicitudes viejas (solo admin)
router.delete('/cleanup', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      months = 12, 
      status = 'all', 
      action = 'soft',
      confirm = false 
    } = req.body;
    
    if (!confirm) {
      return res.status(400).json({ 
        message: 'Debes confirmar la acción estableciendo confirm: true' 
      });
    }
    
    // Calcular fecha límite
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));
    
    // Construir filtro
    const filter = { 
      createdAt: { $lt: cutoffDate }
    };
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Obtener estadísticas antes de eliminar
    const totalCount = await VacationRequest.countDocuments(filter);
    
    if (totalCount === 0) {
      return res.json({
        message: 'No se encontraron solicitudes que cumplan los criterios',
        deleted: 0,
        criteria: {
          olderThan: `${months} meses`,
          status: status,
          cutoffDate: cutoffDate.toISOString()
        }
      });
    }
    
    let result;
    
    if (action === 'hard') {
      // Eliminación permanente
      result = await VacationRequest.deleteMany(filter);
      
      res.json({
        message: `${result.deletedCount} solicitudes eliminadas permanentemente`,
        deleted: result.deletedCount,
        action: 'hard_delete',
        criteria: {
          olderThan: `${months} meses`,
          status: status,
          cutoffDate: cutoffDate.toISOString()
        }
      });
    } else {
      // Soft delete masivo
      const requestsToDelete = await VacationRequest.find(filter)
        .populate('employee', 'username role');
        
      for (const request of requestsToDelete) {
        await request.softDelete(req.userId, {
          username: request.employee?.username || 'Usuario desconocido',
          role: request.employee?.role || 'N/A'
        });
      }
      
      res.json({
        message: `${requestsToDelete.length} solicitudes eliminadas (soft delete)`,
        deleted: requestsToDelete.length,
        action: 'soft_delete',
        criteria: {
          olderThan: `${months} meses`,
          status: status,
          cutoffDate: cutoffDate.toISOString()
        },
        note: 'Las solicitudes pueden ser restauradas desde la sección de eliminados'
      });
    }
  } catch (err) {
    console.error('Error en limpieza:', err);
    res.status(500).json({ message: 'Error en limpieza masiva', error: err.message });
  }
});

// ✅ MEJORADO: Calcular días disponibles según antigüedad usando startDate del historial
function calcularDiasDisponibles(fechaIngreso) {
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

// ✅ ACTUALIZADO: Obtener días disponibles usando EmployeeHistory
router.get('/days-available/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Solo admin puede consultar días de otros usuarios
    if (req.userId !== userId) {
      const currentUser = await User.findById(req.userId);
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Solo puedes consultar tus propios días disponibles' 
        });
      }
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // ✅ NUEVO: Buscar historial laboral activo
    let employeeHistory = await EmployeeHistory.findOne({ 
      employee: userId, 
      isActive: true 
    });

    // ✅ FALLBACK: Si no hay historial activo, buscar el más reciente
    if (!employeeHistory) {
      employeeHistory = await EmployeeHistory.findOne({ 
        employee: userId 
      }).sort({ startDate: -1 });
    }

    // ✅ FALLBACK: Si no hay historial, usar createdAt del usuario
    const fechaIngreso = employeeHistory ? employeeHistory.startDate : user.createdAt;
    const source = employeeHistory ? 'historial laboral' : 'creación de usuario';
    
    console.log(`📅 Calculando vacaciones para ${user.username} desde ${fechaIngreso} (fuente: ${source})`);

    const totalDays = calcularDiasDisponibles(fechaIngreso);

    // Calcular días ya tomados (solo solicitudes aprobadas)
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

    // ✅ MEJORADO: Respuesta con información adicional
    res.json({ 
      employee: user.username,
      totalDays, 
      takenDays: Math.floor(takenDays), 
      availableDays: Math.floor(availableDays),
      yearsOfService: ((new Date() - fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1),
      startDate: fechaIngreso,
      source: source,
      hasEmployeeHistory: !!employeeHistory,
      employeeHistoryId: employeeHistory?._id || null
    });
  } catch (err) {
    console.error('Error calculando días disponibles:', err);
    res.status(500).json({ message: 'Error calculando días disponibles', error: err.message });
  }
});

// ✅ ACTUALIZADO: Crear nueva solicitud usando EmployeeHistory
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, replacement, tienda } = req.body;
    
    // Validaciones básicas
    if (!startDate || !endDate || !tienda) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: startDate, endDate, tienda' 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validar fechas
    if (start >= end) {
      return res.status(400).json({ 
        message: 'La fecha de fin debe ser posterior a la fecha de inicio' 
      });
    }
    
    if (start < today) {
      return res.status(400).json({ 
        message: 'No se pueden solicitar vacaciones para fechas pasadas' 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // ✅ NUEVO: Buscar historial laboral para obtener fecha de ingreso
    let employeeHistory = await EmployeeHistory.findOne({ 
      employee: req.userId, 
      isActive: true 
    });

    if (!employeeHistory) {
      employeeHistory = await EmployeeHistory.findOne({ 
        employee: req.userId 
      }).sort({ startDate: -1 });
    }

    const fechaIngreso = employeeHistory ? employeeHistory.startDate : user.createdAt;
    const totalDays = calcularDiasDisponibles(fechaIngreso);
    
    if (totalDays === 0) {
      return res.status(400).json({ 
        message: 'Aún no tienes días de vacaciones disponibles. Necesitas al menos 1 año de antigüedad desde tu fecha de ingreso.' 
      });
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
      return res.status(400).json({ 
        message: `Solo tienes ${Math.floor(availableDays)} días disponibles. Solicitas ${requestedDays} días.` 
      });
    }
    
    // Verificar si hay conflicto con otras solicitudes aprobadas
    const conflictingRequest = await VacationRequest.findOne({
      employee: req.userId,
      status: 'aprobada',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    
    if (conflictingRequest) {
      return res.status(400).json({ 
        message: 'Ya tienes vacaciones aprobadas en esas fechas' 
      });
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
    
    res.status(201).json({ 
      message: 'Solicitud de vacaciones enviada exitosamente',
      request: populatedRequest,
      daysRequested: requestedDays,
      calculatedFrom: employeeHistory ? 'historial laboral' : 'creación de usuario'
    });
  } catch (err) {
    console.error('Error creando solicitud:', err);
    res.status(500).json({ message: 'Error creando solicitud', error: err.message });
  }
});

// Obtener mis solicitudes (solo empleado)
router.get('/mine', verifyToken, async (req, res) => {
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

    // Calcular días para cada solicitud
    const requestsWithDays = requests.map(req => ({
      ...req.toObject(),
      daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
    }));

    res.json(requestsWithDays);
  } catch (err) {
    console.error('Error obteniendo mis solicitudes:', err);
    res.status(500).json({ message: 'Error obteniendo solicitudes', error: err.message });
  }
});

// Admin - Ver todas las solicitudes (con filtros opcionales)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, tiendaId, employeeId, startDate, endDate, limit = 50, includeDeleted = false } = req.query;
    const filter = {};

    if (status && ['pendiente', 'aprobada', 'rechazada'].includes(status)) {
      filter.status = status;
    }
    if (tiendaId) filter.tienda = tiendaId;
    if (employeeId) filter.employee = employeeId;
    
    // Filtro por fechas de solicitud
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    let query = VacationRequest.find(filter);
    
    // ✅ NUEVO: Opción para incluir eliminados
    if (includeDeleted === 'true') {
      query = query.setOptions({ includeDeleted: true });
    }

    const requests = await query
      .populate('employee', 'username')
      .populate('replacement', 'username')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Agregar días solicitados a cada request
    const requestsWithDays = requests.map(req => ({
      ...req.toObject(),
      daysRequested: Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1
    }));

    res.json(requestsWithDays);
  } catch (err) {
    console.error('Error obteniendo solicitudes:', err);
    res.status(500).json({ message: 'Error obteniendo solicitudes', error: err.message });
  }
});

// Admin - Aprobar o Rechazar
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['aprobada', 'rechazada'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido. Debe ser "aprobada" o "rechazada"' });
    }
    
    const request = await VacationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (request.status !== 'pendiente') {
      return res.status(400).json({ 
        message: `Esta solicitud ya está ${request.status}` 
      });
    }
    
    // Si se rechaza, reason es obligatorio
    if (status === 'rechazada' && (!reason || reason.trim() === '')) {
      return res.status(400).json({ 
        message: 'Debes proporcionar una razón para rechazar la solicitud' 
      });
    }

    const updatedRequest = await VacationRequest.findByIdAndUpdate(
      req.params.id, 
      { status, reason: reason?.trim() || '' },
      { new: true }
    ).populate('employee', 'username')
     .populate('replacement', 'username')
     .populate('tienda', 'nombre');
    
    res.json({ 
      message: `Solicitud ${status} exitosamente`,
      request: updatedRequest
    });
  } catch (err) {
    console.error('Error actualizando estado:', err);
    res.status(500).json({ message: 'Error actualizando estado', error: err.message });
  }
});

// ✅ NUEVO: Eliminar solicitud individual (solo admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { action = 'soft' } = req.body; // 'soft' o 'hard'
    
    const request = await VacationRequest.findById(req.params.id)
      .populate('employee', 'username role');
      
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (request.isDeleted && action === 'soft') {
      return res.status(400).json({ message: 'La solicitud ya está eliminada' });
    }

    if (action === 'hard') {
      // Eliminación permanente
      await VacationRequest.findByIdAndDelete(req.params.id);
      
      res.json({ 
        message: 'Solicitud eliminada permanentemente',
        action: 'hard_delete'
      });
    } else {
      // Soft delete
      await request.softDelete(req.userId, {
        username: request.employee?.username || 'Usuario desconocido',
        role: request.employee?.role || 'N/A'
      });
      
      res.json({ 
        message: 'Solicitud eliminada exitosamente (soft delete)',
        action: 'soft_delete',
        note: 'La solicitud puede ser restaurada desde la sección de eliminados'
      });
    }
  } catch (err) {
    console.error('Error eliminando solicitud:', err);
    res.status(500).json({ message: 'Error al eliminar solicitud', error: err.message });
  }
});

// Obtener solicitud por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const request = await VacationRequest.findById(req.params.id)
      .populate('employee', 'username')
      .populate('replacement', 'username')
      .populate('tienda', 'nombre');
    
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    // Solo el empleado o admin pueden ver la solicitud
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'admin' && request.employee._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta solicitud' });
    }
    
    const requestWithDays = {
      ...request.toObject(),
      daysRequested: Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1
    };
    
    res.json(requestWithDays);
  } catch (err) {
    console.error('Error obteniendo solicitud:', err);
    res.status(500).json({ message: 'Error obteniendo solicitud', error: err.message });
  }
});

// Endpoint para verificar/sincronizar datos de vacaciones
router.get('/verify/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const employeeHistory = await EmployeeHistory.findOne({ 
      employee: userId, 
      isActive: true 
    });

    const allHistory = await EmployeeHistory.find({ 
      employee: userId 
    }).sort({ startDate: -1 });

    const vacationRequests = await VacationRequest.find({ 
      employee: userId 
    }).sort({ createdAt: -1 });

    res.json({
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
    });
  } catch (err) {
    console.error('Error verificando datos:', err);
    res.status(500).json({ message: 'Error verificando datos', error: err.message });
  }
});

module.exports = router;
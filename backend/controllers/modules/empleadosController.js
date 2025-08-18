const EmployeeHistory = require('../../modules/empleados/model');
const Attendance = require('../../modules/asistencia/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class EmpleadosController {
  // Crear historial de empleado
  async create(req, res) {
    try {
      const { employee, tienda, startDate, salary, seguroSocial, position, notes } = req.body;
      
      if (!employee || !tienda || !salary) {
        return errorResponse(res, 'Employee, tienda y salary son campos requeridos', 400);
      }
      
      if (salary <= 0) {
        return errorResponse(res, 'El salario debe ser mayor a 0', 400);
      }
      
      const userExists = await User.findById(employee);
      if (!userExists) {
        return errorResponse(res, 'Empleado no encontrado', 404);
      }
      
      const existingActive = await EmployeeHistory.findOne({ 
        employee, 
        isActive: true 
      });
      
      if (existingActive) {
        return errorResponse(res, 'Este empleado ya tiene un historial activo. Debe dar de baja el actual primero.', 400);
      }

      const history = new EmployeeHistory({
        employee,
        tienda,
        startDate: startDate ? new Date(startDate) : new Date(),
        salary: parseFloat(salary),
        seguroSocial: seguroSocial?.trim(),
        position: position || 'Empleado',
        notes: notes?.trim(),
        isActive: true
      });

      await history.save();
      
      const populatedHistory = await EmployeeHistory.findById(history._id)
        .populate('employee', 'username role')
        .populate('tienda', 'nombre');
      
      return successResponse(res, { history: populatedHistory }, 'Historial de empleado creado exitosamente', 201);
    } catch (err) {
      console.error('Error al crear historial:', err);
      return errorResponse(res, 'Error al crear historial', 500);
    }
  }

  // Obtener historial completo
  async getAll(req, res) {
    try {
      const { isActive, tiendaId, employeeId, limit = 100 } = req.query;
      
      const filter = {};
      
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
      if (tiendaId) filter.tienda = tiendaId;
      if (employeeId) filter.employee = employeeId;

      const history = await EmployeeHistory.find(filter)
        .populate('employee', 'username role telefono')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const stats = await EmployeeHistory.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEmpleados: { $sum: 1 },
            activos: { $sum: { $cond: ["$isActive", 1, 0] } },
            inactivos: { $sum: { $cond: ["$isActive", 0, 1] } },
            salarioPromedio: { $avg: "$salary" },
            salarioTotal: { $sum: "$salary" }
          }
        }
      ]);

      const estadisticas = stats[0] || {
        totalEmpleados: 0,
        activos: 0,
        inactivos: 0,
        salarioPromedio: 0,
        salarioTotal: 0
      };

      return successResponse(res, {
        history,
        estadisticas: {
          ...estadisticas,
          salarioPromedio: Number(estadisticas.salarioPromedio.toFixed(2)),
          salarioTotal: Number(estadisticas.salarioTotal.toFixed(2))
        }
      }, 'Historial obtenido exitosamente');
    } catch (err) {
      console.error('Error al cargar historial:', err);
      return errorResponse(res, 'Error al cargar historial', 500);
    }
  }

  // Actualizar historial
  async update(req, res) {
    try {
      const { endDate, seguroSocial, motivoBaja, razonBaja, salary, position, notes } = req.body;
      const { id } = req.params;
      
      const history = await EmployeeHistory.findById(id);
      if (!history) {
        return errorResponse(res, 'Historial no encontrado', 404);
      }
      
      const updateData = {};
      
      if (endDate) {
        if (!motivoBaja || !razonBaja) {
          return errorResponse(res, 'Para dar de baja se requieren motivoBaja y razonBaja', 400);
        }
        
        const endDateTime = new Date(endDate);
        if (endDateTime <= history.startDate) {
          return errorResponse(res, 'La fecha de baja debe ser posterior a la fecha de alta', 400);
        }
        
        updateData.endDate = endDateTime;
        updateData.motivoBaja = motivoBaja;
        updateData.razonBaja = razonBaja.trim();
        updateData.isActive = false;
      }
      
      if (seguroSocial !== undefined) updateData.seguroSocial = seguroSocial.trim();
      if (salary !== undefined) {
        if (salary <= 0) {
          return errorResponse(res, 'El salario debe ser mayor a 0', 400);
        }
        updateData.salary = parseFloat(salary);
      }
      if (position !== undefined) updateData.position = position.trim();
      if (notes !== undefined) updateData.notes = notes.trim();

      const updatedHistory = await EmployeeHistory.findByIdAndUpdate(
        id, 
        updateData,
        { new: true, runValidators: true }
      ).populate('employee', 'username role')
       .populate('tienda', 'nombre');

      return successResponse(res, { history: updatedHistory }, 'Historial actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar:', err);
      return errorResponse(res, 'Error al actualizar historial', 500);
    }
  }

  // Eliminar registro
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const history = await EmployeeHistory.findById(id);
      if (!history) {
        return errorResponse(res, 'Historial no encontrado', 404);
      }
      
      const hasAttendance = await Attendance.findOne({ userId: history.employee });
      if (hasAttendance) {
        return errorResponse(res, 'No se puede eliminar: el empleado tiene registros de asistencia asociados', 400);
      }

      await EmployeeHistory.findByIdAndDelete(id);
      
      return successResponse(res, { 
        deletedHistory: { _id: history._id, employee: history.employee }
      }, 'Historial eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar:', err);
      return errorResponse(res, 'Error al eliminar historial', 500);
    }
  }

  // Ranking de empleados con menos faltas
  async getRankingFaltas(req, res) {
    try {
      const { startDate, endDate, tiendaId, limit = 20 } = req.query;
      
      if (!startDate || !endDate) {
        return errorResponse(res, 'Se requieren fechas de inicio y fin en formato YYYY-MM-DD', 400);
      }

      const start = new Date(startDate + 'T00:00:00.000Z');
      const end = new Date(endDate + 'T23:59:59.999Z');
      
      if (start >= end) {
        return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de fin', 400);
      }

      const matchFilter = { date: { $gte: start, $lte: end } };
      if (tiendaId) matchFilter.tienda = tiendaId;

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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            empleado: { $ifNull: ["$empleado.username", "Usuario eliminado"] },
            role: { $ifNull: ["$empleado.role", "N/A"] },
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

      return successResponse(res, {
        periodo: { startDate, endDate },
        tiendaId: tiendaId || 'todas',
        ranking,
        criterios: {
          puntuacion: 'Presente: +3pts, Tarde: -1pt, Falta: -5pts',
          ordenamiento: 'Por puntuación descendente, luego por menos faltas'
        }
      }, 'Ranking generado exitosamente');
    } catch (err) {
      console.error('Error generando ranking:', err);
      return errorResponse(res, 'Error al generar ranking', 500);
    }
  }

  // Obtener empleados activos
  async getActivos(req, res) {
    try {
      const { tiendaId } = req.query;
      
      const filter = { isActive: true };
      if (tiendaId) filter.tienda = tiendaId;
      
      const empleadosActivos = await EmployeeHistory.find(filter)
        .populate('employee', 'username role telefono')
        .populate('tienda', 'nombre')
        .sort({ startDate: -1 });
      
      const empleadosConAntiguedad = empleadosActivos.map(emp => {
        const antiguedad = Math.floor((new Date() - emp.startDate) / (1000 * 60 * 60 * 24));
        return {
          ...emp.toObject(),
          antiguedadDias: antiguedad,
          antiguedadMeses: Math.floor(antiguedad / 30),
          antiguedadAños: Math.floor(antiguedad / 365)
        };
      });
      
      return successResponse(res, {
        empleados: empleadosConAntiguedad,
        total: empleadosConAntiguedad.length
      }, 'Empleados activos obtenidos exitosamente');
    } catch (err) {
      console.error('Error obteniendo empleados activos:', err);
      return errorResponse(res, 'Error al obtener empleados activos', 500);
    }
  }
}

module.exports = new EmpleadosController();
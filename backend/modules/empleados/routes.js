const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const EmployeeHistory = require('./model');
const Attendance = require('../asistencia/model');
const User = require('../../core/users/model');

// Usar el middleware de autenticación existente
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ⚠️ IMPORTANTE: Las rutas específicas DEBEN ir ANTES que las rutas con parámetros

// ✅ NUEVAS RUTAS PARA SOFT DELETE (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)

// Obtener historiales eliminados
router.get('/history/deleted', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deletedHistory = await EmployeeHistory.find({ isDeleted: true })
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

    res.json(mappedHistory);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error al obtener historiales eliminados', 
      error: err.message 
    });
  }
});

// Restaurar historial eliminado
router.patch('/history/:id/restore', verifyToken, requireAdmin, async (req, res) => {
  try {
    const history = await EmployeeHistory.findById(req.params.id)
      .setOptions({ includeDeleted: true });
      
    if (!history) {
      return res.status(404).json({ message: 'Historial no encontrado' });
    }

    if (!history.isDeleted) {
      return res.status(400).json({ message: 'El historial no está eliminado' });
    }

    await history.restore();
    
    res.json({ 
      message: 'Historial restaurado exitosamente',
      history: {
        employee: history.employee,
        position: history.position,
        nombreCompleto: history.nombreCompleto
      }
    });
  } catch (err) {
    res.status(400).json({ 
      message: 'Error al restaurar historial', 
      error: err.message 
    });
  }
});


// Ranking de empleados con menos faltas (CORREGIDO - FUNCIONA CORRECTAMENTE)
router.get('/history/ranking/faltas', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tiendaId, limit = 20 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requieren fechas de inicio y fin en formato YYYY-MM-DD' });
    }

    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');
    
    if (start >= end) {
      return res.status(400).json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' });
    }

    const matchFilter = { 
      date: { $gte: start, $lte: end },
      userId: { $ne: null } // ✅ CRÍTICO: Excluir registros sin usuario para aggregation
    };
    
    if (tiendaId && tiendaId.trim() !== '') {
      try {
        const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
        matchFilter.tienda = tiendaObjectId;
      } catch (error) {
        return res.status(400).json({ message: 'ID de tienda inválido' });
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
          preserveNullAndEmptyArrays: false // ✅ CORREGIDO: No incluir usuarios eliminados
        }
      },
      {
        $project: {
          empleado: "$empleado.username", // ✅ SIMPLIFICADO: Ya no puede ser null
          role: "$empleado.role", // ✅ SIMPLIFICADO: Ya no puede ser null
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

    res.json(ranking);
  } catch (err) {
    console.error('Error generando ranking:', err);
    res.status(500).json({ message: 'Error al generar ranking', error: err.message });
  }
});

// Obtener empleados activos (EXISTENTE - SIN CAMBIOS)
router.get('/activos', verifyToken, requireAdmin, async (req, res) => {
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
        antiguedadAños: Math.floor(antiguedad / 365),
        sueldoDiario: emp.salary // Mapear para compatibilidad con frontend
      };
    });
    
    res.json({
      empleados: empleadosConAntiguedad,
      total: empleadosConAntiguedad.length
    });
  } catch (err) {
    console.error('Error obteniendo empleados activos:', err);
    res.status(500).json({ message: 'Error al obtener empleados activos', error: err.message });
  }
});

// Crear historial (EXISTENTE - SIN CAMBIOS)
router.post('/history', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { employee, tienda, sueldoDiario, seguroSocial, startDate, endDate, motivoBaja, razonBaja, position, notes, nombre, apellidoPaterno, apellidoMaterno, rfc, curp, numeroSeguroSocial } = req.body;
    
    if (!employee || !tienda || !sueldoDiario) {
      return res.status(400).json({ message: 'Employee, tienda y sueldoDiario son campos requeridos' });
    }

    if (!nombre || !apellidoPaterno || !apellidoMaterno) {
      return res.status(400).json({ message: 'Nombre, apellido paterno y apellido materno son requeridos' });
    }
    
    if (sueldoDiario <= 0) {
      return res.status(400).json({ message: 'El sueldo diario debe ser mayor a 0' });
    }
    
    const userExists = await User.findById(employee);
    if (!userExists) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    // Verificar si ya tiene historial activo (solo si no se está dando de baja inmediatamente)
    if (!endDate) {
      const existingActive = await EmployeeHistory.findOne({ 
        employee, 
        isActive: true 
      });
      
      if (existingActive) {
        return res.status(400).json({ message: 'Este empleado ya tiene un historial activo. Debe dar de baja el actual primero.' });
      }
    }

    // ✅ CONSTRUIR OBJETO LIMPIO SIN CAMPOS VACÍOS
    const historyData = {
      employee,
      tienda,
      startDate: startDate ? new Date(startDate) : new Date(),
      salary: parseFloat(sueldoDiario), // Mapear sueldoDiario a salary
      seguroSocial: seguroSocial ? 'Sí' : 'No',
      position: (position && position.trim()) ? position.trim() : 'Empleado',
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(), 
      apellidoMaterno: apellidoMaterno.trim(),
      isActive: !endDate // Si hay endDate, no está activo
    };

    // Solo agregar campos opcionales si tienen valor válido
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

    console.log('📝 Creating employee history with data:', historyData);

    const history = new EmployeeHistory(historyData);
    await history.save();
    
    const populatedHistory = await EmployeeHistory.findById(history._id)
      .populate('employee', 'username role')
      .populate('tienda', 'nombre');
    
    console.log('✅ Employee history created successfully:', populatedHistory._id);
    
    res.status(201).json(populatedHistory);
  } catch (err) {
    console.error('❌ Error creating employee history:', err);
    res.status(500).json({ message: 'Error al crear historial', error: err.message });
  }
});

// Obtener historial completo (EXISTENTE - SIN CAMBIOS)
router.get('/history', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { isActive, tiendaId, employeeId, limit = 100, includeDeleted = false } = req.query;
    
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (tiendaId) filter.tienda = tiendaId;
    if (employeeId) filter.employee = employeeId;

    let query = EmployeeHistory.find(filter);
    
    // ✅ NUEVO: Opción para incluir eliminados
    if (includeDeleted === 'true') {
      query = query.setOptions({ includeDeleted: true });
    }

    const history = await query
      .populate('employee', 'username role telefono')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mapear salary a sueldoDiario para compatibilidad con frontend
    const mappedHistory = history.map(h => ({
      ...h.toObject(),
      sueldoDiario: h.salary
    }));

    res.json(mappedHistory);
  } catch (err) {
    console.error('Error al cargar historial:', err);
    res.status(500).json({ message: 'Error al cargar historial', error: err.message });
  }
});

// Actualizar historial (EXISTENTE - ACTUALIZADO PARA INCLUIR CAMPOS PERSONALES)
router.put('/history/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      endDate, seguroSocial, motivoBaja, razonBaja, sueldoDiario, position, notes,
      nombre, apellidoPaterno, apellidoMaterno, rfc, curp, numeroSeguroSocial 
    } = req.body;
    const { id } = req.params;
    
    const history = await EmployeeHistory.findById(id);
    if (!history) {
      return res.status(404).json({ message: 'Historial no encontrado' });
    }
    
    const updateData = {};
    
    // Campos laborales existentes
    if (endDate) {
      if (!motivoBaja || !razonBaja) {
        return res.status(400).json({ message: 'Para dar de baja se requieren motivoBaja y razonBaja' });
      }
      
      const endDateTime = new Date(endDate);
      if (endDateTime <= history.startDate) {
        return res.status(400).json({ message: 'La fecha de baja debe ser posterior a la fecha de alta' });
      }
      
      updateData.endDate = endDateTime;
      updateData.motivoBaja = motivoBaja;
      updateData.razonBaja = razonBaja.trim();
      updateData.isActive = false;
    }
    
    if (seguroSocial !== undefined) updateData.seguroSocial = seguroSocial ? 'Sí' : 'No';
    if (sueldoDiario !== undefined) {
      if (sueldoDiario <= 0) {
        return res.status(400).json({ message: 'El sueldo diario debe ser mayor a 0' });
      }
      updateData.salary = parseFloat(sueldoDiario);
    }
    if (position !== undefined) updateData.position = position.trim();
    if (notes !== undefined) updateData.notes = notes.trim();

    // ✅ NUEVOS: Campos personales
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (apellidoPaterno !== undefined) updateData.apellidoPaterno = apellidoPaterno.trim();
    if (apellidoMaterno !== undefined) updateData.apellidoMaterno = apellidoMaterno.trim();
    if (rfc !== undefined) updateData.rfc = rfc?.trim()?.toUpperCase() || null;
    if (curp !== undefined) updateData.curp = curp?.trim()?.toUpperCase() || null;
    if (numeroSeguroSocial !== undefined) updateData.numeroSeguroSocial = numeroSeguroSocial?.trim() || null;

    const updatedHistory = await EmployeeHistory.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    ).populate('employee', 'username role')
     .populate('tienda', 'nombre');

    res.json(updatedHistory);
  } catch (err) {
    console.error('Error al actualizar:', err);
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

// ✅ ACTUALIZADO: Eliminar registro (ahora con soft delete)
router.delete('/history/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await EmployeeHistory.findById(id);
    if (!history) {
      return res.status(404).json({ message: 'Historial no encontrado' });
    }

    if (history.isDeleted) {
      return res.status(400).json({ message: 'El historial ya está eliminado' });
    }
    
    // Verificar si tiene registros de asistencia
    const attendanceCount = await Attendance.countDocuments({ userId: history.employee });
    
    if (attendanceCount > 0) {
      // ✅ NUEVO: Hacer soft delete en lugar de prevenir eliminación
      await history.softDelete(req.userId);
      
      return res.json({ 
        message: 'Historial eliminado exitosamente (soft delete aplicado)',
        note: `Se mantuvo el historial debido a ${attendanceCount} registros de asistencia asociados. Se puede restaurar desde la sección de historiales eliminados.`,
        relatedRecords: {
          attendance: attendanceCount
        },
        action: 'soft_deleted'
      });
    }

    // Si no hay registros relacionados, permitir eliminación completa
    await EmployeeHistory.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Historial eliminado permanentemente',
      action: 'hard_deleted'
    });
  } catch (err) {
    console.error('Error al eliminar:', err);
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
});

module.exports = router;
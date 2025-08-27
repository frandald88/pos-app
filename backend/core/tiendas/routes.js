const express = require('express');
const router = express.Router();
const Tienda = require('./model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Obtener todas las tiendas
router.get('/', verifyToken, async (req, res) => {
  try {
    const tiendas = await Tienda.find();
    res.json(tiendas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tiendas', error: err.message });
  }
});

// Crear nueva tienda (solo admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, direccion, telefono, activa } = req.body;
    
    const newTienda = new Tienda({ nombre, direccion, telefono, activa });
    await newTienda.save();
    
    res.status(201).json({ message: 'Tienda creada exitosamente', tienda: newTienda });
  } catch (error) {
    console.error('Error al crear tienda:', error);
    res.status(400).json({ message: 'Error al crear tienda', error: error.message });
  }
});

// Actualizar tienda (solo admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const updatedTienda = await Tienda.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json({ message: 'Tienda actualizada', tienda: updatedTienda });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar tienda', error: err.message });
  }
});

// ✅ NUEVO: Verificar relaciones antes de eliminar
router.get('/:id/relationships', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Importar modelos necesarios
    const User = require('../../core/users/model');
    const EmployeeHistory = require('../../modules/empleados/model');
    const Attendance = require('../../modules/asistencia/model');
    const Schedule = require('../../modules/schedules/model');
    
    // Verificar relaciones
    const relationships = {
      usuarios: await User.countDocuments({ tienda: id }),
      empleadosHistorial: await EmployeeHistory.countDocuments({ tienda: id }),
      asistencias: await Attendance.countDocuments({ tienda: id }),
      horarios: await Schedule.countDocuments({ tienda: id }),
      // Agregar más verificaciones según tus modelos
      // ventas: await Venta.countDocuments({ tienda: id }),
      // inventario: await Inventario.countDocuments({ tienda: id }),
      // gastos: await Gasto.countDocuments({ tienda: id })
    };
    
    const total = Object.values(relationships).reduce((sum, count) => sum + count, 0);
    
    res.json({
      hasRelationships: total > 0,
      total,
      details: relationships
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar relaciones', error: err.message });
  }
});

// ✅ NUEVO: Soft delete (archivar tienda)
router.patch('/:id/archive', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tienda = await Tienda.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );
    
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json({ 
      message: 'Tienda archivada exitosamente',
      action: 'archived',
      tienda 
    });
  } catch (err) {
    res.status(400).json({ message: 'Error al archivar tienda', error: err.message });
  }
});

// ✅ NUEVO: Restaurar tienda archivada
router.patch('/:id/restore', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tienda = await Tienda.findByIdAndUpdate(
      req.params.id,
      { activa: true },
      { new: true }
    );
    
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json({ 
      message: 'Tienda restaurada exitosamente',
      action: 'restored',
      tienda 
    });
  } catch (err) {
    res.status(400).json({ message: 'Error al restaurar tienda', error: err.message });
  }
});

// ✅ MEJORADO: Eliminar tienda con verificaciones
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { forceDelete } = req.body;
    const { id } = req.params;
    
    // Verificar que la tienda existe
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    if (!forceDelete) {
      // Verificar relaciones primero
      const User = require('../../core/users/model');
      const EmployeeHistory = require('../../modules/empleados/model');
      const Attendance = require('../../modules/asistencia/model');
      const Schedule = require('../../modules/schedules/model');
      
      const relationships = {
        usuarios: await User.countDocuments({ tienda: id }),
        empleadosHistorial: await EmployeeHistory.countDocuments({ tienda: id }),
        asistencias: await Attendance.countDocuments({ tienda: id }),
        horarios: await Schedule.countDocuments({ tienda: id })
      };
      
      const total = Object.values(relationships).reduce((sum, count) => sum + count, 0);
      
      if (total > 0) {
        return res.status(400).json({
          message: 'No se puede eliminar: La tienda tiene datos asociados',
          canDelete: false,
          relationships,
          total,
          suggestion: 'Considera archivar la tienda o reasignar los datos primero'
        });
      }
    }
    
    // Si no hay relaciones o es forzado, proceder con eliminación
    await Tienda.findByIdAndDelete(id);
    
    res.json({ 
      message: forceDelete ? 'Tienda eliminada permanentemente' : 'Tienda eliminada exitosamente',
      action: 'deleted'
    });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar tienda', error: err.message });
  }
});

// Obtener tienda por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tienda = await Tienda.findById(req.params.id);
    
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json(tienda);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tienda', error: error.message });
  }
});

module.exports = router;
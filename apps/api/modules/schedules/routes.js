const express = require('express');
const router = express.Router();
const schedulesController = require('../../controllers/modules/schedulesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// ✅ IMPORTANTE: Rutas específicas PRIMERO (antes de rutas con parámetros)

// ✅ Crear plantilla de horario (reutilizable)
router.post('/template', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.createTemplate);

// ✅ Obtener plantillas disponibles
router.get('/templates', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.getTemplates);

// ✅ Asignar horario a empleado (puede ser desde plantilla)
router.post('/assign', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.assignSchedule);

// ✅ Crear horario por defecto usando plantilla
router.post('/assign-default/:employeeId', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.assignDefaultSchedule);

// Obtener mi horario (empleado actual)
router.get('/mine', verifyToken, identifyTenant, requireTenant, schedulesController.getMySchedule);

// Verificar si un empleado debe trabajar hoy
router.get('/workday-check/:employeeId', verifyToken, identifyTenant, requireTenant, schedulesController.checkWorkday);

// Obtener horario específico de un empleado
router.get('/employee/:employeeId', verifyToken, identifyTenant, requireTenant, schedulesController.getEmployeeSchedule);

// ✅ Obtener todos los horarios (separados por tipo)
router.get('/', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.getAll);

// ✅ Crear horario personalizado para empleado
router.post('/', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.create);

// ✅ MEJORADO: Actualizar horario (plantillas y asignaciones) - AL FINAL
router.put('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.update);

// ✅ MEJORADO: Eliminar horario o plantilla - AL FINAL
router.delete('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, schedulesController.delete);

module.exports = router;
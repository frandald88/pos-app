const express = require('express');
const router = express.Router();
const tiendasController = require('../../controllers/core/tiendasController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkResourceLimit, incrementResourceCount, decrementResourceCount } = require('../../shared/middleware/limitMiddleware');

// Obtener todas las tiendas
router.get('/', verifyToken, identifyTenant, requireTenant, tiendasController.getAll.bind(tiendasController));

// Obtener tienda por ID (debe ir después de las rutas específicas)
router.get('/:id', verifyToken, identifyTenant, requireTenant, tiendasController.getById.bind(tiendasController));

// Crear nueva tienda (solo admin) - CON LÍMITES
router.post('/',
  verifyToken,
  identifyTenant,
  requireTenant,
  requireAdmin,
  checkResourceLimit('tiendas'),
  tiendasController.create.bind(tiendasController),
  incrementResourceCount('tiendas')
);

// Actualizar tienda (solo admin)
router.put('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, tiendasController.update.bind(tiendasController));

// Verificar relaciones antes de eliminar
router.get('/:id/relationships', verifyToken, identifyTenant, requireTenant, requireAdmin, tiendasController.getRelationships.bind(tiendasController));

// Soft delete (archivar tienda)
router.patch('/:id/archive', verifyToken, identifyTenant, requireTenant, requireAdmin, tiendasController.archive.bind(tiendasController));

// Restaurar tienda archivada
router.patch('/:id/restore', verifyToken, identifyTenant, requireTenant, requireAdmin, tiendasController.restore.bind(tiendasController));

// Eliminar tienda con verificaciones - CON DECREMENTACIÓN DE LÍMITE
router.delete('/:id',
  verifyToken,
  identifyTenant,
  requireTenant,
  requireAdmin,
  (req, res, next) => {
    console.log('🔥 RUTA DELETE LLAMADA - ID:', req.params.id);
    console.log('🔥 Controller:', tiendasController);
    console.log('🔥 deleteTienda método:', typeof tiendasController.deleteTienda);
    tiendasController.deleteTienda(req, res, next);
  },
  decrementResourceCount('tiendas')
);

module.exports = router;
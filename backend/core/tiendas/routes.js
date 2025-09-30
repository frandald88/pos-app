const express = require('express');
const router = express.Router();
const tiendasController = require('../../controllers/core/tiendasController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Obtener todas las tiendas
router.get('/', verifyToken, tiendasController.getAll.bind(tiendasController));

// Obtener tienda por ID (debe ir después de las rutas específicas)
router.get('/:id', verifyToken, tiendasController.getById.bind(tiendasController));

// Crear nueva tienda (solo admin)
router.post('/', verifyToken, requireAdmin, tiendasController.create.bind(tiendasController));

// Actualizar tienda (solo admin)
router.put('/:id', verifyToken, requireAdmin, tiendasController.update.bind(tiendasController));

// Verificar relaciones antes de eliminar
router.get('/:id/relationships', verifyToken, requireAdmin, tiendasController.getRelationships.bind(tiendasController));

// Soft delete (archivar tienda)
router.patch('/:id/archive', verifyToken, requireAdmin, tiendasController.archive.bind(tiendasController));

// Restaurar tienda archivada
router.patch('/:id/restore', verifyToken, requireAdmin, tiendasController.restore.bind(tiendasController));

// Eliminar tienda con verificaciones
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  console.log('🔥 RUTA DELETE LLAMADA - ID:', req.params.id);
  console.log('🔥 Controller:', tiendasController);
  console.log('🔥 deleteTienda método:', typeof tiendasController.deleteTienda);
  tiendasController.deleteTienda(req, res);
});

module.exports = router;
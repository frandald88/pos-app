const express = require('express');
const router = express.Router();
const clientesController = require('../../controllers/modules/clientesController');
const { verifyToken, requireAdmin, requireRoles } = require('../../shared/middleware/authMiddleware');
const { validateRequired, validateEmail, validatePhone } = require('../../shared/middleware/validation');

// Rutas de clientes
router.get('/', verifyToken, clientesController.getAll);

// ⭐ Cualquier usuario autenticado puede crear clientes
router.post('/',
  verifyToken,
  validateRequired(['nombre']),
  validateEmail,
  validatePhone,
  clientesController.create
);

router.get('/search/:term', verifyToken, clientesController.search);

router.get('/:id', verifyToken, clientesController.getById);

// ⭐ ACTUALIZADO: Permitir a admin, vendedor y repartidor actualizar clientes
router.put('/:id',
  verifyToken,
  requireRoles(['admin', 'vendedor', 'repartidor']),
  validateRequired(['nombre']),
  validateEmail,
  validatePhone,
  clientesController.update
);

// ⭐ Solo admin puede eliminar clientes
router.delete('/:id', verifyToken, requireAdmin, clientesController.delete);

module.exports = router;
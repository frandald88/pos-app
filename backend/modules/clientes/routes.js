const express = require('express');
const router = express.Router();
const clientesController = require('../../controllers/modules/clientesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { validateRequired, validateEmail, validatePhone } = require('../../shared/middleware/validation');

// Rutas de clientes - ahora solo llaman al controller
router.get('/', verifyToken, clientesController.getAll);

router.post('/', 
  verifyToken, 
  validateRequired(['nombre']),
  validateEmail,
  validatePhone,
  clientesController.create
);

router.get('/search/:term', verifyToken, clientesController.search);

router.get('/:id', verifyToken, clientesController.getById);

router.put('/:id', 
  verifyToken, 
  requireAdmin,
  validateRequired(['nombre']),
  validateEmail,
  validatePhone,
  clientesController.update
);

router.delete('/:id', verifyToken, requireAdmin, clientesController.delete);

module.exports = router;
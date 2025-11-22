const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const gastosController = require('../../controllers/modules/gastosController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para almacenar evidencias
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/expenses');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}-${cleanName}`);
  },
});

// Filtrar solo imagenes y PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG), PDF, DOC, XLS'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB maximo
});

// Rutas especificas primero

// Obtener reporte de gastos (solo admin)
router.get('/report', verifyToken, identifyTenant, requireTenant, requireAdmin, gastosController.getReport);

// Obtener gastos del usuario actual
router.get('/mine', verifyToken, identifyTenant, requireTenant, gastosController.getMine);

// Descargar evidencia
router.get('/evidencia/:filename', verifyToken, identifyTenant, requireTenant, gastosController.getEvidencia);

// Obtener proveedores unicos
router.get('/providers', verifyToken, identifyTenant, requireTenant, gastosController.getProviders);

// Buscar proveedores para autocompletado
router.get('/providers/search', verifyToken, identifyTenant, requireTenant, gastosController.searchProviders);

// Obtener tiendas disponibles segun el rol del usuario
router.get('/available-stores', verifyToken, identifyTenant, requireTenant, gastosController.getAvailableStores);

// Cambiar estado y agregar nota (solo admin)
router.patch('/status/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, gastosController.updateStatus);

// Rutas principales (CRUD)

// Crear gasto (con validacion de tienda segun rol)
router.post('/', verifyToken, identifyTenant, requireTenant, upload.single('evidencia'), gastosController.createExpense);

// Obtener gasto por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, gastosController.getById);

// Eliminar gasto (solo admin, solo si esta aprobado o denegado)
router.delete('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, gastosController.deleteExpense);

module.exports = router;

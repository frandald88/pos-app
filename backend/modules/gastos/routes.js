const express = require('express');
const router = express.Router();
const Expense = require('./model');
const User = require('../../core/users/model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ MIGRADO: Configurar multer para almacenar evidencias
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

// Filtrar solo imágenes y PDFs
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});



//  Crear gasto (con validación de tienda según rol)
router.post('/', verifyToken, upload.single('evidencia'), async (req, res) => {
  try {
    const { concepto, proveedor, monto, metodoPago, tienda } = req.body;
    
    // Validaciones básicas
    if (!concepto || !proveedor || !monto || !metodoPago || !tienda) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos: concepto, proveedor, monto, metodoPago, tienda' 
      });
    }
    
    if (isNaN(monto) || parseFloat(monto) <= 0) {
      return res.status(400).json({ message: 'El monto debe ser un número mayor a 0' });
    }

    // ✅ NUEVA VALIDACIÓN: Verificar permisos de tienda según rol
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role !== 'admin') {
      // Para vendedores/repartidores, verificar que solo puedan usar su tienda asignada
      if (!user.tienda) {
        return res.status(400).json({ 
          message: 'No tienes una tienda asignada. Contacta al administrador.' 
        });
      }
      
      if (user.tienda.toString() !== tienda) {
        return res.status(403).json({ 
          message: 'No puedes crear gastos para una tienda diferente a la asignada.' 
        });
      }
    }
    
    // Crear fecha local (zona horaria de México)
    const localDate = new Date();
    // Ajustar a zona horaria de México (UTC-6)
    const mexicoOffset = -6 * 60; // -6 horas en minutos
    const utcTime = localDate.getTime() + (localDate.getTimezoneOffset() * 60000);
    const mexicoTime = new Date(utcTime + (mexicoOffset * 60000));
    
    const expenseData = {
      concepto: concepto.trim(),
      proveedor: proveedor.trim(),
      monto: parseFloat(monto),
      metodoPago,
      tienda,
      createdBy: req.userId,
      status: 'pendiente',
      createdAt: mexicoTime,
    };

    if (req.file) {
      expenseData.evidencia = req.file.filename;
    }

    const expense = new Expense(expenseData);
    await expense.save();
    
    // Poblar datos para respuesta
    const populatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre');
    
    res.status(201).json({ 
      message: 'Gasto registrado exitosamente',
      expense: populatedExpense
    });
  } catch (err) {
    console.error('Error al guardar gasto:', err);
    
    // Si hubo error y se subió archivo, eliminarlo
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/expenses', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'Error al guardar gasto', error: err.message });
  }
});

// ✅ MIGRADO + MEJORADO: Obtener reporte de gastos (solo admin)
router.get('/report', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, proveedor, metodoPago, tiendaId, status, limit = 100 } = req.query;
    const filter = {};

    // Filtros de fecha ajustados a zona horaria de México
    const mexicoOffset = -6 * 60; // -6 horas en minutos
    const adjustToMexicoTime = (date) => {
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      return new Date(utcTime + (mexicoOffset * 60000));
    };

    if (startDate && endDate) {
      const start = adjustToMexicoTime(new Date(startDate + 'T00:00:00'));
      const end = adjustToMexicoTime(new Date(endDate + 'T23:59:59'));
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = adjustToMexicoTime(new Date(startDate + 'T00:00:00'));
      filter.createdAt = { $gte: start };
    } else if (endDate) {
      const end = adjustToMexicoTime(new Date(endDate + 'T23:59:59'));
      filter.createdAt = { $lte: end };
    }

    // Otros filtros
    if (proveedor) filter.proveedor = { $regex: proveedor, $options: 'i' };
    if (metodoPago) filter.metodoPago = metodoPago;
    if (tiendaId) filter.tienda = tiendaId;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Calcular totales
    const totals = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMonto: { $sum: '$monto' },
          totalGastos: { $sum: 1 },
          porMetodo: {
            $push: {
              metodoPago: '$metodoPago',
              monto: '$monto'
            }
          }
        }
      }
    ]);

    const summary = totals[0] || { totalMonto: 0, totalGastos: 0, porMetodo: [] };

    res.json({
      expenses,
      summary: {
        totalMonto: summary.totalMonto,
        totalGastos: summary.totalGastos,
        porMetodo: summary.porMetodo.reduce((acc, item) => {
          acc[item.metodoPago] = (acc[item.metodoPago] || 0) + item.monto;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('Error al cargar reporte:', err);
    res.status(500).json({ message: 'Error al cargar reporte', error: err.message });
  }
});

// ✅ MIGRADO: Obtener gastos del usuario actual
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let filter = { createdBy: req.userId };
    
    // Si no es admin, filtrar solo gastos de su tienda
    if (user.role !== 'admin' && user.tienda) {
      filter.tienda = user.tienda;
    }
    
    const expenses = await Expense.find(filter)
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(expenses);
  } catch (err) {
    console.error('Error al obtener mis gastos:', err);
    res.status(500).json({ message: 'Error al obtener gastos', error: err.message });
  }
});

// ✅ MIGRADO: Descargar evidencia
router.get('/evidencia/:filename', verifyToken, (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validar que el filename no contenga caracteres peligrosos
    if (!/^[a-zA-Z0-9.\-_]+$/.test(filename)) {
      return res.status(400).json({ message: 'Nombre de archivo inválido' });
    }
    
    const filePath = path.join(__dirname, '../../uploads/expenses', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: 'Evidencia no encontrada' });
    }
  } catch (err) {
    console.error('Error al descargar evidencia:', err);
    res.status(500).json({ message: 'Error al descargar evidencia' });
  }
});

// ✅ MIGRADO + MEJORADO: Cambiar estado y agregar nota (solo admin)
router.patch('/status/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, nota } = req.body;

    // Validar estado
    if (!['pendiente', 'aprobado', 'denegado', 'en revision'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    
    // Verificar que el gasto existe
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id, 
      { status, nota: nota || '' },
      { new: true }
    ).populate('createdBy', 'username')
     .populate('tienda', 'nombre');

    res.json({ 
      message: 'Estado del gasto actualizado exitosamente',
      expense: updatedExpense
    });
  } catch (err) {
    console.error('Error actualizando status de gasto:', err);
    res.status(500).json({ message: 'Error actualizando gasto', error: err.message });
  }
});

// ✅ MIGRADO + MEJORADO: Eliminar gasto (solo admin, solo si está aprobado o denegado)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    if (!['aprobado', 'denegado'].includes(expense.status)) {
      return res.status(400).json({ 
        message: 'Solo se pueden eliminar gastos en estado aprobado o denegado' 
      });
    }

    // Eliminar evidencia física si existe
    if (expense.evidencia) {
      const filePath = path.join(__dirname, '../../uploads/expenses', expense.evidencia);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Expense.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Gasto eliminado exitosamente',
      deletedExpense: {
        _id: expense._id,
        concepto: expense.concepto,
        monto: expense.monto
      }
    });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    res.status(500).json({ message: 'Error al eliminar gasto', error: err.message });
  }
});

// ✅ NUEVO: Obtener proveedores únicos
router.get('/providers', verifyToken, async (req, res) => {
  try {
    const providers = await Expense.distinct('proveedor', { proveedor: { $ne: null, $ne: '' } });
    res.json(providers.sort());
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener proveedores', error: err.message });
  }
});

// ✅ NUEVO: Buscar proveedores para autocompletado
router.get('/providers/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const providers = await Expense.distinct('proveedor', {
      proveedor: { $regex: q.trim(), $options: 'i' }
    });
    
    res.json(providers.sort().slice(0, 10)); // Limitar a 10 resultados
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar proveedores', error: err.message });
  }
});

//  tiendas disponibles según el rol del usuario
router.get('/available-stores', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('tienda', 'nombre');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let availableStores = [];

    if (user.role === 'admin') {
      // Admin puede ver todas las tiendas
      const Tienda = require('../../core/tiendas/model');
      availableStores = await Tienda.find({}, 'nombre').sort({ nombre: 1 });
    } else {
      // Vendedor/repartidor solo puede ver su tienda asignada
      if (user.tienda) {
        availableStores = [user.tienda];
      }
    }

    res.json({
      stores: availableStores,
      userRole: user.role,
      defaultStore: user.role !== 'admin' ? user.tienda?._id : null
    });
  } catch (err) {
    console.error('Error al obtener tiendas disponibles:', err);
    res.status(500).json({ message: 'Error al obtener tiendas disponibles', error: err.message });
  }
});

// ✅ NUEVO: Obtener gasto por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre');
    
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    
    res.json(expense);
  } catch (err) {
    console.error('Error al obtener gasto:', err);
    res.status(500).json({ message: 'Error al obtener gasto', error: err.message });
  }
});




module.exports = router;
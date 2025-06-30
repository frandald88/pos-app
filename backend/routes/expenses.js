const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');

// Configurar multer para almacenar evidencias
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/expenses');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Crear gasto (con evidencia)
router.post('/', verifyToken, upload.single('evidencia'), async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.userId,
      status: 'pendiente',
    };

    if (req.file) {
      expenseData.evidencia = req.file.filename;
    }

    const expense = new Expense(expenseData);
    await expense.save();
    res.status(201).json({ message: 'Gasto registrado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar gasto', error: err.message });
  }
});

// Obtener reporte de gastos (solo admin)
router.get('/report', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Acceso denegado: Solo admin puede ver el reporte" });
    }

    const { startDate, endDate, proveedor, metodoPago, tiendaId, status } = req.query;
    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00.000Z');
      const end = new Date(endDate + 'T23:59:59.999Z');
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (proveedor) filter.proveedor = proveedor;
    if (metodoPago) filter.metodoPago = metodoPago;
    if (tiendaId) filter.tienda = tiendaId;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre');

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Error al cargar reporte', error: err.message });
  }
});

// Descargar evidencia
router.get('/evidencia/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/expenses', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Evidencia no encontrada' });
  }
});

// Cambiar estado y agregar nota (solo admin)
    router.patch('/status/:id', verifyToken, async (req, res) => {
      try {
        const user = await User.findById(req.userId);
        if (user.role !== 'admin') {
          return res.status(403).json({ message: 'Solo el admin puede cambiar el estado' });
        }

        const { status, nota } = req.body;

        if (!['pendiente', 'aprobado', 'denegado', 'en revisión'].includes(status)) {
          return res.status(400).json({ message: 'Estado inválido' });
        }

        await Expense.findByIdAndUpdate(req.params.id, {
          status,
          nota,
        });

        res.json({ message: 'Estado del gasto actualizado' });
      } catch (err) {
        console.error('Error actualizando status de gasto:', err);
        res.status(500).json({ message: 'Error actualizando gasto', error: err.message });
      }
    });

// Eliminar gasto (solo si está aprobado o denegado)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el admin puede eliminar gastos' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado' });

    if (!['aprobado', 'denegado'].includes(expense.status)) {
      return res.status(400).json({ message: 'Solo se pueden eliminar gastos en estado aprobado o denegado' });
    }

    // Eliminar evidencia física si existe
    if (expense.evidencia) {
      const filePath = path.join(__dirname, '../uploads/expenses', expense.evidencia);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gasto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar gasto', error: err.message });
  }
});

module.exports = router;

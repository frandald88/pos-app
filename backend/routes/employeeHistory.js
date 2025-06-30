const express = require('express');
const router = express.Router();
const EmployeeHistory = require('../models/EmployeeHistory');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Crear historial
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Solo admin puede crear historial' });

    const history = new EmployeeHistory(req.body);
    await history.save();
    res.status(201).json({ message: 'Historial creado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear historial', error: err.message });
  }
});

// Obtener historial completo
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Solo admin puede ver el historial' });

    const history = await EmployeeHistory.find()
      .populate('employee', 'username')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error al cargar historial', error: err.message });
  }
});

// Actualizar historial (editar salida, seguro, motivo o razón)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Solo admin puede actualizar' });

    const updateData = {
      endDate: req.body.endDate,
      seguroSocial: req.body.seguroSocial,
      motivoBaja: req.body.motivoBaja,
      razonBaja: req.body.razonBaja,
    };

    await EmployeeHistory.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: 'Historial actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

// Eliminar registro
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Solo admin puede eliminar' });

    await EmployeeHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Historial eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
});

// Ranking de empleados con menos faltas
// Ranking de empleados con menos faltas
router.get('/ranking/faltas', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Solo admin puede ver ranking' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Se requieren fechas de inicio y fin' });

    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    const ranking = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: "Absent"
        },
      },
      {
        $group: {
          _id: "$userId",
          faltas: { $sum: 1 }
        },
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          empleado: { $ifNull: ["$empleado.username", "Usuario eliminado"] },
          faltas: 1
        }
      },
      { $sort: { faltas: 1 } }
    ]);

    res.json(ranking);
  } catch (err) {
    console.error('Error generando ranking:', err);
    res.status(500).json({ message: 'Error al generar ranking', error: err.message });
  }
});


module.exports = router;

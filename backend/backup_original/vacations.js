const express = require('express');
const router = express.Router();
const VacationRequest = require('../models/VacationRequest');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Calcular días disponibles según antigüedad
function calcularDiasDisponibles(fechaIngreso) {
  const ahora = new Date();
  const años = (ahora - fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25);
  let dias = 0;

  if (años >= 1) dias = 12;
  if (años >= 2) dias = 14;
  if (años >= 3) dias = 16;
  if (años >= 4) dias = 18;
  if (años >= 5) dias = 20;
  if (años >= 6) dias += Math.floor((años - 5) / 5) * 2;

  return dias;
}

// Obtener días disponibles para un empleado
router.get('/days-available/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Empleado no encontrado' });

    const totalDays = calcularDiasDisponibles(user.createdAt);

    const usedDays = await VacationRequest.aggregate([
      { $match: { employee: user._id, status: 'aprobada' } },
      {
        $project: {
          days: {
            $add: [
              { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] },
              1
            ]
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$days" } } }
    ]);

    const takenDays = usedDays[0]?.total || 0;
    const availableDays = Math.max(0, totalDays - takenDays);

    res.json({ totalDays, takenDays, availableDays });
  } catch (err) {
    console.error('Error calculando días disponibles:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Crear nueva solicitud de vacaciones
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, replacement, tienda } = req.body;
    if (!startDate || !endDate || !tienda) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const user = await User.findById(req.userId);
    const totalDays = calcularDiasDisponibles(user.createdAt);

    const usedDays = await VacationRequest.aggregate([
      { $match: { employee: user._id, status: 'aprobada' } },
      {
        $project: {
          days: {
            $add: [
              { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] },
              1
            ]
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$days" } } }
    ]);

    const takenDays = usedDays[0]?.total || 0;
    const availableDays = Math.max(0, totalDays - takenDays);

    const requestedDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    if (requestedDays > availableDays) {
      return res.status(400).json({ message: `Solo tienes ${availableDays} días disponibles` });
    }

    const request = new VacationRequest({
      employee: user._id,
      tienda,
      startDate,
      endDate,
      replacement,
    });

    await request.save();
    res.status(201).json({ message: 'Solicitud enviada' });
  } catch (err) {
    console.error('Error creando solicitud:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Obtener mis solicitudes (solo empleado)
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const requests = await VacationRequest.find({ employee: req.userId })
      .populate('replacement', 'username')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

// Admin: Ver todas las solicitudes (con filtros opcionales)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el admin puede ver todas las solicitudes' });
    }

    const { status, tiendaId, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (tiendaId) filter.tienda = tiendaId;
    if (employeeId) filter.employee = employeeId;

    const requests = await VacationRequest.find(filter)
      .populate('employee', 'username')
      .populate('replacement', 'username')
      .populate('tienda', 'nombre')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error obteniendo solicitudes:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Admin: Aprobar o Rechazar
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el admin puede actualizar solicitudes' });
    }

    const { status, reason } = req.body;
    if (!['aprobada', 'rechazada'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await VacationRequest.findByIdAndUpdate(req.params.id, { status, reason });
    res.json({ message: `Solicitud ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Error actualizando estado', error: err.message });
  }
});

module.exports = router;

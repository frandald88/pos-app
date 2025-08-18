const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Return = require('../models/Return');  // Solo si quieres incluir devoluciones
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/reporte', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo admin puede ver el corte de caja' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Debes proporcionar startDate y endDate en formato YYYY-MM-DD' });
    }

    const inicio = new Date(`${startDate}T00:00:00.000Z`);
    const fin = new Date(`${endDate}T23:59:59.999Z`);

    // Total Ventas
    const ventas = await Sale.aggregate([
        { $match: { createdAt: { $gte: inicio, $lte: fin } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
    const totalVentas = ventas[0]?.total || 0;

    // Total Gastos (solo aprobados)
    const gastos = await Expense.aggregate([
      { $match: { createdAt: { $gte: inicio, $lte: fin }, status: 'aprobado' } },
      { $group: { _id: null, total: { $sum: "$monto" } } }
    ]);
    const totalGastos = gastos[0]?.total || 0;

    // Total Devoluciones
    const devoluciones = await Return.aggregate([
      { $match: { date: { $gte: inicio, $lte: fin } } },
      { $group: { _id: null, total: { $sum: "$refundAmount" } } }
    ]);
    const totalDevoluciones = devoluciones[0]?.total || 0;

    // Corte Final
    const corte = totalVentas - totalGastos - totalDevoluciones;

    res.json({
        totalVentas,
        totalGastos,
        totalDevoluciones,
        totalFinal: corte
        });

  } catch (err) {
    console.error('Error en corte de caja:', err);
    res.status(500).json({ message: 'Error interno', error: err.message });
  }
});

module.exports = router;

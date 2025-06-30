const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Crear nueva orden
router.post('/', async (req, res) => {
  try {
    const { proveedor, producto, cantidad, unidad, fechaEmision } = req.body;

    const newOrder = new Order({
      proveedor,
      producto,
      cantidad,
      unidad,
      fechaEmision,
      status: 'pendiente',  // Siempre inicia como pendiente
    });

    await newOrder.save();
    res.status(201).json({ message: 'Orden creada' });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

// Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ fechaEmision: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// Actualizar status, fechaEntrega y nota
router.put('/:id', async (req, res) => {
  try {
    const { status, fechaEntrega, nota } = req.body;
    const updateFields = {};

    if (status) updateFields.status = status;
    if (fechaEntrega) updateFields.fechaEntrega = fechaEntrega;
    if (nota !== undefined) updateFields.nota = nota;

    await Order.findByIdAndUpdate(req.params.id, updateFields);
    res.json({ message: 'Orden actualizada' });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// Eliminar una orden (solo si está completada o cancelada)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status !== 'completada' && order.status !== 'cancelada') {
      return res.status(400).json({ error: 'Solo se pueden eliminar órdenes completadas o canceladas' });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Orden eliminada' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
});

module.exports = router;

// routes/tiendas.js
const express = require('express');
const router = express.Router();
const Tienda = require('../models/tienda');
const { verifyToken } = require('../middleware/authMiddleware');

// Listar tiendas
router.get('/', verifyToken, async (req, res) => {
  try {
    const tiendas = await Tienda.find().lean();
    res.json(tiendas);
  } catch (error) {
    console.error('Error al listar tiendas:', error);
    res.status(500).json({ message: 'Error al listar tiendas' });
  }
});

// Crear tienda
router.post('/', verifyToken, async (req, res) => {
  try {
    const tienda = new Tienda(req.body);
    await tienda.save();
    res.status(201).json(tienda);
  } catch (err) {
    console.error('Error al crear tienda:', err);
    res.status(500).json({ message: 'Error al crear tienda' });
  }
});


// Actualizar
router.put('/:id', verifyToken, async (req, res) => {
  try {
    await Tienda.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Tienda actualizada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar tienda' });
  }
});

// Eliminar
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Tienda.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tienda eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar tienda' });
  }
});

module.exports = router;
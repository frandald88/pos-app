const express = require('express');
const router = express.Router();
const Tienda = require('./model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Obtener todas las tiendas
router.get('/', verifyToken, async (req, res) => {
  try {
    const tiendas = await Tienda.find();
    res.json(tiendas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tiendas', error: err.message });
  }
});

// Crear nueva tienda (solo admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, direccion, telefono, activa } = req.body;
    
    const newTienda = new Tienda({ nombre, direccion, telefono, activa });
    await newTienda.save();
    
    res.status(201).json({ message: 'Tienda creada exitosamente', tienda: newTienda });
  } catch (error) {
    console.error('Error al crear tienda:', error);
    res.status(400).json({ message: 'Error al crear tienda', error: error.message });
  }
});

// Actualizar tienda (solo admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const updatedTienda = await Tienda.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json({ message: 'Tienda actualizada', tienda: updatedTienda });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar tienda', error: err.message });
  }
});

// Eliminar tienda (solo admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deletedTienda = await Tienda.findByIdAndDelete(req.params.id);
    
    if (!deletedTienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json({ message: 'Tienda eliminada exitosamente' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar tienda', error: err.message });
  }
});

// Obtener tienda por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tienda = await Tienda.findById(req.params.id);
    
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json(tienda);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tienda', error: error.message });
  }
});

module.exports = router;
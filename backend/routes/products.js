// backend/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// GET todos los productos
router.get('/', verifyToken, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// POST crear producto
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json({ message: 'Producto creado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al crear producto', error: err.message });
  }
});

// PUT actualizar producto
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar', error: err.message });
  }
});

// DELETE eliminar producto
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar', error: err.message });
  }
});

module.exports = router;

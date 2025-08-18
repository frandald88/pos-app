const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// GET - Obtener todos los productos con tienda poblada
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const filter = {};

    if (tiendaId) {
      filter.tienda = tiendaId;
    }

    const products = await Product.find(filter).populate('tienda', 'nombre');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
});

// POST - Crear producto (solo admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, sku, price, stock, category, tienda } = req.body;

    // Validar que la tienda venga en el payload
    if (!tienda) {
      return res.status(400).json({ message: 'La tienda es requerida para crear el producto' });
    }

    // Validar que el ID de tienda sea válido
    if (!mongoose.Types.ObjectId.isValid(tienda)) {
      return res.status(400).json({ message: 'ID de tienda no válido' });
    }

    const newProduct = new Product({
      name,
      sku,
      price,
      stock,
      category,
      tienda,
    });

    await newProduct.save();

    // Devolver el producto con la tienda ya poblada
    const populatedProduct = await Product.findById(newProduct._id).populate('tienda', 'nombre');

    res.status(201).json({ message: 'Producto creado', product: populatedProduct });
  } catch (err) {
    console.error('Error en POST /products:', err);
    res.status(400).json({ message: 'Error al crear producto', error: err.message });
  }
});

// PUT - Actualizar producto (solo admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tienda } = req.body;

    // Validar tienda si viene en el body
    if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
      return res.status(400).json({ message: 'ID de tienda no válido' });
    }

    await Product.findByIdAndUpdate(req.params.id, req.body);

    const updatedProduct = await Product.findById(req.params.id).populate('tienda', 'nombre');
    res.json({ message: 'Producto actualizado', product: updatedProduct });
  } catch (err) {
    console.error('Error en PUT /products:', err);
    res.status(400).json({ message: 'Error al actualizar producto', error: err.message });
  }
});

// DELETE - Eliminar producto (solo admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error en DELETE /products:', err);
    res.status(400).json({ message: 'Error al eliminar producto', error: err.message });
  }
});

module.exports = router;

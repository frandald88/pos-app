const express = require('express');
const router = express.Router();
const Cliente = require('../models/cliente');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Crear cliente (cualquier usuario autenticado puede crear)
router.post('/', verifyToken, async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

// Obtener todos los clientes (cualquier usuario autenticado)
router.get('/', verifyToken, async (req, res) => {
  try {
    const clientes = await Cliente.find().lean();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ message: 'Error al listar clientes' });
  }
});

// Actualizar cliente (solo admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Solo el admin puede editar clientes" });
    }

    await Cliente.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Cliente actualizado" });
  } catch (err) {
    res.status(400).json({ message: "Error al actualizar cliente", error: err.message });
  }
});

// Eliminar cliente (solo admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Solo el admin puede eliminar clientes" });
    }

    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

module.exports = router;

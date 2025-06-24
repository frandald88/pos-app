const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Crear nuevo usuario
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const newUser = new User({ username, password, role });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al crear usuario', error: err.message });
  }
});

// Actualizar usuario
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { username, role });
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar', error: err.message });
  }
});

// Eliminar usuario
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar', error: err.message });
  }
});

module.exports = router;

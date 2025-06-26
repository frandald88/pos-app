const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
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

// ✅ NUEVO: Obtener datos del usuario logueado
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('_id username role');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el usuario actual', error: err.message });
  }
});

module.exports = router;

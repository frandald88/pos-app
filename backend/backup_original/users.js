const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password')
    .populate('tienda', 'nombre');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
});

// Crear nuevo usuario
router.post("/", verifyToken, async (req, res) => {
  try {
    const { username, password, role, telefono, tienda } = req.body;

    // Validación manual: vendedores y repartidores deben tener tienda
    if (role !== "admin" && !tienda) {
      return res.status(400).json({ message: "Los usuarios que no son admin deben tener una tienda asignada" });
    }

    const newUser = new User({ username, password, role, telefono, tienda });
    await newUser.save();

    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(400).json({ message: "Error al crear usuario", error: error.message });
  }
});

// Actualizar usuario
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, role, telefono, tienda } = req.body;

    const updateData = {
      username,
      role,
      telefono,
      tienda: role !== 'admin' ? tienda : null,
    };

    await User.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });

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

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('tienda', 'nombre');
    res.json({
      username: user.username,
      role: user.role,
      tienda: user.tienda?._id || null,
      tiendaNombre: user.tienda?.nombre || null
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('tienda', 'nombre');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

module.exports = router;

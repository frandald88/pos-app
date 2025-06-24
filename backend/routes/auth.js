const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Asegúrate de requerir bcrypt

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password); // ✅ comparación directa
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

const token = jwt.sign(
  { id: user._id, role: user.role }, // 👈 ahora sí será leído correctamente por el middleware
  process.env.JWT_SECRET || 'secretKey',
  { expiresIn: '1h' }
);

    res.json({ token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;

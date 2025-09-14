const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../core/users/model');
const bcrypt = require('bcrypt');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('⏳ Ejecutando script de creación de usuario...');

  try {
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('⚠️ El usuario admin ya existe.');
    } else {
      const hashedPassword = await bcrypt.hash('admin1234', 10); // 🔐 encripta la contraseña

      const newUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin' // opcional, pero útil si quieres usar roles luego
      });

      await newUser.save();
      console.log('✅ Usuario admin creado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    mongoose.disconnect();
  }
});

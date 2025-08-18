// update-user-date.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Función para encontrar el modelo de usuario automáticamente
function findUserModel() {
  const possiblePaths = [
    './backend/models/User.js',
    './core/users/model.js',
    './core/users/model/index.js',
    './models/User.js',
    './models/user.js',
    './src/models/User.js',
    './src/core/users/model.js',
    './backend/core/users/model.js'
  ];

  for (const modelPath of possiblePaths) {
    if (fs.existsSync(path.resolve(modelPath))) {
      console.log(`✅ Encontrado modelo en: ${modelPath}`);
      return require(modelPath);
    }
  }

  // Si no encuentra el modelo, crear uno básico
  console.log('⚠️  No se encontró el modelo de usuario, creando esquema básico...');
  
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: String,
    role: { type: String, enum: ['admin', 'vendedor', 'repartidor'], default: 'vendedor' },
    tienda: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda' }
  }, { timestamps: true });

  return mongoose.models.User || mongoose.model('User', userSchema);
}

// Función para calcular días disponibles
function calcularDiasDisponibles(fechaIngreso) {
  if (!fechaIngreso) return 0;
  
  const ahora = new Date();
  const años = (ahora - fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25);
  let dias = 0;

  if (años >= 1) dias = 12;
  if (años >= 2) dias = 14;
  if (años >= 3) dias = 16;
  if (años >= 4) dias = 18;
  if (años >= 5) dias = 20;
  if (años >= 6) dias += Math.floor((años - 5) / 5) * 2;

  return Math.floor(dias);
}

// Función para obtener una fecha válida o crear una por defecto
function getValidDate(date) {
  if (date && date instanceof Date && !isNaN(date)) {
    return date;
  }
  // Si no hay fecha válida, usar hace 6 meses como fecha por defecto
  return new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000));
}

// Función para calcular años de servicio de manera segura
function calcularAños(fechaIngreso) {
  if (!fechaIngreso) return 0;
  
  const validDate = getValidDate(fechaIngreso);
  const años = (new Date() - validDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, años);
}

async function updateUserForTesting() {
  try {
    // Buscar la URL de MongoDB
    const mongoUri = process.env.MONGODB_URI || 
                    process.env.MONGO_URI || 
                    process.env.DATABASE_URL || 
                    'mongodb://localhost:27017/pos-app';

    console.log('🔌 Conectando a MongoDB...');
    console.log(`🔗 URI: ${mongoUri.replace(/\/\/.*:.*@/, '//***:***@')}`); // Ocultar credenciales
    
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Cargar el modelo
    const User = findUserModel();

    // Buscar usuarios disponibles
    console.log('\n🔍 Buscando usuarios...');
    const users = await User.find({}, 'username email role createdAt updatedAt _id').limit(10);
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      process.exit(1);
    }

    console.log('\n📋 Usuarios disponibles:');
    users.forEach((user, index) => {
      const fechaIngreso = user.createdAt || user.updatedAt || user._id.getTimestamp();
      const años = calcularAños(fechaIngreso).toFixed(1);
      const dias = calcularDiasDisponibles(fechaIngreso);
      const estado = user.createdAt ? '✅' : '⚠️ ';
      console.log(`${index + 1}. ${user.username} (${user.role}) - ${años} años - ${dias} días ${estado}`);
    });

    // Configuración - EDITA ESTOS VALORES
    const USERNAME_TO_UPDATE = 'Gabriel'; // ← PON AQUÍ EL USERNAME DEL USUARIO
    const YEARS_AGO = 3; // ← AÑOS DE ANTIGÜEDAD QUE QUIERES SIMULAR (3 años = 16 días)

    if (!USERNAME_TO_UPDATE) {
      console.log('\n⚠️  INSTRUCCIONES:');
      console.log('1. Edita este archivo (update-user-date.js)');
      console.log('2. En la línea que dice: const USERNAME_TO_UPDATE = \'\';');
      console.log('3. Pon el nombre de usuario entre las comillas');
      console.log('4. Ejemplo: const USERNAME_TO_UPDATE = \'Melissa\';');
      console.log('5. Guarda el archivo y ejecuta de nuevo: node update-user-date.js');
      process.exit(1);
    }

    // Buscar el usuario específico
    const userToUpdate = await User.findOne({ username: USERNAME_TO_UPDATE });
    if (!userToUpdate) {
      console.log(`❌ Usuario "${USERNAME_TO_UPDATE}" no encontrado`);
      console.log('📝 Usuarios disponibles:', users.map(u => u.username).join(', '));
      process.exit(1);
    }

    // Mostrar estado actual
    const currentDate = userToUpdate.createdAt || userToUpdate.updatedAt || userToUpdate._id.getTimestamp();
    const currentYears = calcularAños(currentDate).toFixed(1);
    const currentDays = calcularDiasDisponibles(currentDate);
    
    console.log(`\n📊 Estado actual de "${USERNAME_TO_UPDATE}":`);
    if (userToUpdate.createdAt) {
      console.log(`📅 Fecha actual de ingreso: ${userToUpdate.createdAt.toLocaleDateString('es-ES')}`);
    } else {
      console.log(`⚠️  Sin fecha de creación - usando fecha estimada: ${currentDate.toLocaleDateString('es-ES')}`);
    }
    console.log(`⏱️  Años de servicio actuales: ${currentYears} años`);
    console.log(`🏖️  Días disponibles actuales: ${currentDays} días`);

    // Calcular nueva fecha
    const newDate = new Date(Date.now() - (YEARS_AGO * 365 * 24 * 60 * 60 * 1000));
    const newYears = calcularAños(newDate).toFixed(1);
    const newDays = calcularDiasDisponibles(newDate);

    console.log(`\n🔄 Cambios propuestos:`);
    console.log(`📅 Nueva fecha de ingreso: ${newDate.toLocaleDateString('es-ES')}`);
    console.log(`⏱️  Nuevos años de servicio: ${newYears} años`);
    console.log(`🏖️  Nuevos días disponibles: ${newDays} días`);

    // Confirmar cambio
    console.log('\n⏳ Actualizando usuario...');
    
    // Actualizar tanto createdAt como updatedAt para asegurar consistencia
    const result = await User.updateOne(
      { username: USERNAME_TO_UPDATE },
      { 
        $set: { 
          createdAt: newDate,
          updatedAt: new Date() // Mantener updatedAt actual
        } 
      }
    );

    if (result.modifiedCount === 0) {
      console.log('⚠️  No se realizaron cambios (posiblemente la fecha ya era similar)');
    } else {
      console.log('✅ Usuario actualizado exitosamente');
    }

    // Verificar el cambio con un pequeño delay para MongoDB Atlas
    console.log('⏳ Verificando cambios...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const updatedUser = await User.findOne({ username: USERNAME_TO_UPDATE });
    
    // Usar la fecha que sabemos que acabamos de establecer como fallback
    const finalDate = updatedUser.createdAt || newDate;
    const finalYears = calcularAños(finalDate).toFixed(1);
    const finalDays = calcularDiasDisponibles(finalDate);
    
    console.log(`\n🎉 Estado final de "${USERNAME_TO_UPDATE}":`);
    try {
      console.log(`📅 Fecha de ingreso: ${finalDate.toLocaleDateString('es-ES')}`);
    } catch (e) {
      console.log(`📅 Fecha de ingreso: ${finalDate}`);
    }
    console.log(`⏱️  Años de servicio: ${finalYears} años`);
    console.log(`🏖️  Días de vacaciones disponibles: ${finalDays} días`);
    
    console.log('\n✨ ¡Listo para probar las solicitudes de vacaciones!');
    console.log(`💡 Tip: Usuario "${USERNAME_TO_UPDATE}" ahora tiene ${finalDays} días disponibles`);

    // Verificar todos los usuarios actualizados
    console.log('\n📋 Verificando todos los usuarios...');
    const allUsers = await User.find({}, 'username role createdAt');
    
    console.log('📊 Estado de todos los usuarios:');
    allUsers.forEach((user, index) => {
      try {
        const fecha = user.createdAt || new Date();
        const años = calcularAños(fecha).toFixed(1);
        const dias = calcularDiasDisponibles(fecha);
        const isUpdated = user.username === USERNAME_TO_UPDATE ? '🎯' : '  ';
        console.log(`${index + 1}. ${isUpdated} ${user.username} (${user.role}) - ${años} años - ${dias} días disponibles`);
      } catch (e) {
        console.log(`${index + 1}. ❌ ${user.username} (${user.role}) - Error al calcular`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Sugerencias:');
      console.log('• Asegúrate de que MongoDB esté ejecutándose');
      console.log('• Verifica la variable MONGODB_URI en tu archivo .env');
    }
    
    if (error.message.includes('buffering timed out')) {
      console.log('\n💡 Problema de conexión:');
      console.log('• Verifica tu conexión a internet');
      console.log('• Asegúrate de que las credenciales de MongoDB sean correctas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  updateUserForTesting();
}

module.exports = { updateUserForTesting, calcularDiasDisponibles };
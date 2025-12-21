const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../core/users/model');
const Tenant = require('../core/tenants/model');
const emailService = require('../shared/services/emailService');

/**
 * Script para reenviar email de activación de cuenta
 * Uso: node scripts/resendActivationEmail.js email@example.com
 */

async function resendActivationEmail(email) {
  try {
    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar usuario por email
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.username}`);
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Tenant ID: ${user.tenantId}`);
    console.log(`   - Activo: ${user.isActive}`);
    console.log(`   - Rol: ${user.role}`);

    // Verificar si ya está activado
    if (user.isActive) {
      console.log(`⚠️  Este usuario ya está activado.`);
      const answer = await askQuestion('¿Deseas reenviar el email de todas formas? (s/n): ');
      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
    }

    // Buscar el tenant para obtener el nombre de la compañía
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      console.error(`❌ No se encontró el tenant asociado: ${user.tenantId}`);
      process.exit(1);
    }

    console.log(`✅ Tenant encontrado: ${tenant.companyName}\n`);

    // Verificar si el token existe y está válido
    const now = new Date();
    const hasValidToken = user.activationToken && user.activationTokenExpires && user.activationTokenExpires > now;

    if (!hasValidToken) {
      console.log('⚠️  El token de activación no existe o está expirado.');
      console.log('📝 Generando nuevo token de activación...');

      // Generar nuevo token (válido por 48 horas)
      user.activationToken = crypto.randomBytes(32).toString('hex');
      user.activationTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await user.save();
      console.log('✅ Nuevo token generado exitosamente');
      console.log(`   - Token: ${user.activationToken}`);
      console.log(`   - Expira: ${user.activationTokenExpires}`);
    } else {
      console.log('✅ Token de activación válido encontrado');
      console.log(`   - Token: ${user.activationToken}`);
      console.log(`   - Expira: ${user.activationTokenExpires}`);
    }

    // Construir URL de activación
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/activate-account?token=${user.activationToken}`;

    console.log(`\n🔗 URL de activación: ${activationUrl}\n`);

    // Verificar conexión del servicio de email
    console.log('📧 Verificando servicio de email...');
    try {
      await emailService.verifyConnection();
      console.log('✅ Servicio de email verificado\n');
    } catch (error) {
      console.error('❌ Error verificando servicio de email:', error.message);
      console.log('\n⚠️  El email no se puede enviar porque el servicio no está configurado.');
      console.log('💡 Puedes copiar la URL de arriba y enviarla manualmente al usuario.\n');
      process.exit(1);
    }

    // Enviar email
    console.log(`📧 Enviando email de activación a: ${email}...`);

    await emailService.sendAccountActivationEmail({
      to: email,
      companyName: tenant.companyName,
      activationUrl: activationUrl,
      expiresInHours: 48
    });

    console.log('✅ Email de activación enviado exitosamente!\n');
    console.log('═'.repeat(60));
    console.log('✨ Proceso completado con éxito');
    console.log('═'.repeat(60));
    console.log(`\n📬 El usuario ${email} debería recibir el email en breve.`);
    console.log(`🔗 URL de activación (por si acaso): ${activationUrl}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Helper para hacer preguntas en la consola
function askQuestion(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Ejecutar script
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Debes proporcionar un email como argumento');
  console.log('\nUso:');
  console.log('  node scripts/resendActivationEmail.js email@example.com');
  console.log('\nEjemplo:');
  console.log('  node scripts/resendActivationEmail.js cliente@empresa.com\n');
  process.exit(1);
}

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: El formato del email no es válido');
  process.exit(1);
}

console.log('');
console.log('═'.repeat(60));
console.log('📧 REENVIAR EMAIL DE ACTIVACIÓN');
console.log('═'.repeat(60));
console.log('');

resendActivationEmail(email);

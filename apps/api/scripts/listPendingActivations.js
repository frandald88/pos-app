const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../core/users/model');
const Tenant = require('../core/tenants/model');

/**
 * Script para listar usuarios pendientes de activación
 * Uso: node scripts/listPendingActivations.js
 */

async function listPendingActivations() {
  try {
    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar usuarios inactivos con token de activación
    console.log('🔍 Buscando usuarios pendientes de activación...\n');

    const pendingUsers = await User.find({
      isActive: false,
      activationToken: { $ne: null }
    }).sort({ createdAt: -1 });

    if (pendingUsers.length === 0) {
      console.log('✅ No hay usuarios pendientes de activación\n');
      process.exit(0);
    }

    console.log(`📋 Usuarios pendientes de activación: ${pendingUsers.length}\n`);
    console.log('═'.repeat(100));

    const now = new Date();

    for (const user of pendingUsers) {
      const tenant = await Tenant.findById(user.tenantId);
      const isExpired = user.activationTokenExpires && user.activationTokenExpires < now;
      const expiresIn = user.activationTokenExpires
        ? Math.round((user.activationTokenExpires - now) / (1000 * 60 * 60))
        : null;

      console.log(`\n📧 Email: ${user.email}`);
      console.log(`   Empresa: ${tenant ? tenant.companyName : 'N/A'}`);
      console.log(`   Creado: ${user.createdAt.toLocaleString()}`);
      console.log(`   Token: ${user.activationToken}`);

      if (isExpired) {
        console.log(`   Estado: ⚠️  EXPIRADO (hace ${Math.abs(expiresIn)} horas)`);
      } else if (expiresIn !== null) {
        console.log(`   Estado: ✅ Válido (expira en ${expiresIn} horas)`);
      } else {
        console.log(`   Estado: ⚠️  Sin fecha de expiración`);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const activationUrl = `${frontendUrl}/activate-account?token=${user.activationToken}`;
      console.log(`   URL: ${activationUrl}`);
    }

    console.log('\n' + '═'.repeat(100));
    console.log(`\n💡 Para reenviar un email de activación, usa:`);
    console.log(`   node scripts/resendActivationEmail.js email@example.com\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
    process.exit(0);
  }
}

console.log('');
console.log('═'.repeat(100));
console.log('📋 LISTAR USUARIOS PENDIENTES DE ACTIVACIÓN');
console.log('═'.repeat(100));
console.log('');

listPendingActivations();

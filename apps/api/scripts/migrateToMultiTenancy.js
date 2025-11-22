const mongoose = require('mongoose');
const Tenant = require('../core/tenants/model');
const User = require('../core/users/model');
const Product = require('../core/products/model');
const Sale = require('../core/sales/model');
const Tienda = require('../modules/tiendas/model');
const Cliente = require('../modules/clientes/model');
const Turno = require('../core/turnos/model');
const Expense = require('../core/gastos/model');
const Return = require('../core/devoluciones/model');
const Order = require('../core/delivery/model');
const EmployeeHistory = require('../modules/empleados/model');
const Attendance = require('../modules/asistencia/model');
const VacationRequest = require('../modules/vacaciones/model');
const Schedule = require('../modules/schedules/model');

require('dotenv').config();

/**
 * Script de migración para multi-tenancy
 *
 * Este script:
 * 1. Crea un tenant por defecto
 * 2. Asigna ese tenantId a todos los usuarios, productos y ventas existentes
 * 3. Actualiza los contadores de metadata del tenant
 *
 * IMPORTANTE: Ejecutar ANTES de aplicar cambios de schema a los modelos restantes
 */

async function migrateToMultiTenancy() {
  try {
    console.log('🚀 Iniciando migración a multi-tenancy...\n');

    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar si ya existe un tenant
    let defaultTenant = await Tenant.findOne({});

    if (defaultTenant) {
      console.log(`⚠️  Ya existe un tenant: ${defaultTenant.companyName}`);
      console.log(`   ID: ${defaultTenant._id}`);
      console.log(`   Subdomain: ${defaultTenant.subdomain}\n`);

      const response = await promptUser('¿Quieres usar este tenant existente? (s/n): ');
      if (response.toLowerCase() !== 's') {
        console.log('❌ Migración cancelada');
        process.exit(0);
      }
    } else {
      console.log('📝 No se encontró ningún tenant. Creando tenant por defecto...\n');

      // Buscar un usuario admin existente como owner
      const adminUser = await User.findOne({ role: 'admin' });

      if (!adminUser) {
        console.error('❌ No se encontró ningún usuario admin. Por favor crea un usuario admin primero.');
        process.exit(1);
      }

      console.log(`   Owner: ${adminUser.username} (${adminUser._id})\n`);

      // Crear tenant por defecto
      defaultTenant = new Tenant({
        companyName: 'Mi Negocio', // Cambiar según sea necesario
        subdomain: 'principal',
        owner: adminUser._id,
        subscription: {
          plan: 'enterprise', // Plan enterprise para no tener límites inicialmente
          status: 'active'
        },
        limits: {
          maxUsers: -1,  // Ilimitado
          maxTiendas: -1, // Ilimitado
          maxProducts: -1, // Ilimitado
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: true
        },
        contact: {
          email: adminUser.username // Asumir username como email temporalmente
        },
        metadata: {
          onboardingCompleted: true // Ya tiene datos, considerarlo como onboarding completado
        },
        isActive: true
      });

      await defaultTenant.save();
      console.log(`✅ Tenant creado: ${defaultTenant.companyName} (${defaultTenant._id})\n`);
    }

    const tenantId = defaultTenant._id;

    // 2. Migrar Users
    console.log('👥 Migrando usuarios...');
    const usersResult = await User.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${usersResult.modifiedCount} usuarios migrados\n`);

    // 3. Migrar Products (uno por uno para evitar conflictos con índices)
    console.log('📦 Migrando productos...');
    const productsToMigrate = await Product.find({ tenantId: { $exists: false } }).lean();
    let productsMigrated = 0;

    for (const product of productsToMigrate) {
      try {
        await Product.updateOne(
          { _id: product._id },
          { $set: { tenantId: tenantId } }
        );
        productsMigrated++;
      } catch (error) {
        console.log(`   ⚠️  Error migrando producto ${product._id}: ${error.message}`);
      }
    }
    console.log(`   ✅ ${productsMigrated} productos migrados\n`);

    // 4. Migrar Sales
    console.log('💰 Migrando ventas...');
    const salesResult = await Sale.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${salesResult.modifiedCount} ventas migradas\n`);

    // 5. Migrar Tiendas
    console.log('🏪 Migrando tiendas...');
    const tiendasResult = await Tienda.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${tiendasResult.modifiedCount} tiendas migradas\n`);

    // 6. Migrar Clientes
    console.log('👥 Migrando clientes...');
    const clientesResult = await Cliente.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${clientesResult.modifiedCount} clientes migrados\n`);

    // 7. Migrar Turnos
    console.log('⏰ Migrando turnos...');
    const turnosResult = await Turno.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${turnosResult.modifiedCount} turnos migrados\n`);

    // 8. Migrar Gastos
    console.log('💸 Migrando gastos...');
    const gastosResult = await Expense.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${gastosResult.modifiedCount} gastos migrados\n`);

    // 9. Migrar Devoluciones
    console.log('↩️  Migrando devoluciones...');
    const devolucionesResult = await Return.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${devolucionesResult.modifiedCount} devoluciones migradas\n`);

    // 10. Migrar Orders (Delivery)
    console.log('📦 Migrando órdenes...');
    const ordersResult = await Order.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${ordersResult.modifiedCount} órdenes migradas\n`);

    // 11. Migrar Empleados
    console.log('👔 Migrando empleados...');
    const empleadosResult = await EmployeeHistory.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${empleadosResult.modifiedCount} empleados migrados\n`);

    // 12. Migrar Asistencias
    console.log('📋 Migrando asistencias...');
    const asistenciasResult = await Attendance.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${asistenciasResult.modifiedCount} asistencias migradas\n`);

    // 13. Migrar Vacaciones
    console.log('🏖️  Migrando vacaciones...');
    const vacacionesResult = await VacationRequest.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${vacacionesResult.modifiedCount} vacaciones migradas\n`);

    // 14. Migrar Horarios
    console.log('🕐 Migrando horarios...');
    const schedulesResult = await Schedule.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenantId } }
    );
    console.log(`   ✅ ${schedulesResult.modifiedCount} horarios migrados\n`);

    // 15. Actualizar contadores de metadata
    console.log('📊 Actualizando contadores...');

    const totalUsers = await User.countDocuments({ tenantId: tenantId });
    const totalProducts = await Product.countDocuments({ tenantId: tenantId });
    const totalTiendas = await Tienda.countDocuments({ tenantId: tenantId });

    await Tenant.findByIdAndUpdate(tenantId, {
      'metadata.totalUsers': totalUsers,
      'metadata.totalProducts': totalProducts,
      'metadata.totalTiendas': totalTiendas
    });

    console.log(`   Total usuarios: ${totalUsers}`);
    console.log(`   Total productos: ${totalProducts}`);
    console.log(`   Total tiendas: ${totalTiendas}\n`);

    // 6. Resumen final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migración completada exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Tenant creado/actualizado:');
    console.log(`   Nombre: ${defaultTenant.companyName}`);
    console.log(`   Subdomain: ${defaultTenant.subdomain}`);
    console.log(`   ID: ${defaultTenant._id}`);
    console.log(`   Plan: ${defaultTenant.subscription.plan}`);
    console.log(`   Status: ${defaultTenant.subscription.status}\n`);
    console.log('📊 Datos migrados:');
    console.log(`   ${usersResult.modifiedCount} usuarios`);
    console.log(`   ${productsMigrated} productos`);
    console.log(`   ${salesResult.modifiedCount} ventas`);
    console.log(`   ${tiendasResult.modifiedCount} tiendas`);
    console.log(`   ${clientesResult.modifiedCount} clientes`);
    console.log(`   ${turnosResult.modifiedCount} turnos`);
    console.log(`   ${gastosResult.modifiedCount} gastos`);
    console.log(`   ${devolucionesResult.modifiedCount} devoluciones`);
    console.log(`   ${ordersResult.modifiedCount} órdenes`);
    console.log(`   ${empleadosResult.modifiedCount} empleados`);
    console.log(`   ${asistenciasResult.modifiedCount} asistencias`);
    console.log(`   ${vacacionesResult.modifiedCount} vacaciones`);
    console.log(`   ${schedulesResult.modifiedCount} horarios\n`);
    console.log('⚠️  IMPORTANTE: Ahora puedes aplicar los cambios de schema a los modelos restantes');
    console.log('   Ver archivo: apps/api/MULTI_TENANCY_PENDING.md\n');

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Helper para prompt de usuario
function promptUser(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateToMultiTenancy();
}

module.exports = migrateToMultiTenancy;

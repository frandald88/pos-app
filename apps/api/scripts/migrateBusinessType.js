/**
 * Script de migración para agregar businessType a tenants existentes
 *
 * Uso:
 *   node apps/api/scripts/migrateBusinessType.js
 *
 * Este script:
 * 1. Encuentra todos los tenants sin businessType
 * 2. Les asigna 'dark_kitchen' como default
 * 3. Actualiza limits según su plan actual
 * 4. Reporta resultados
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../core/tenants/model');

async function migrateBusinessType() {
  try {
    console.log('🚀 Iniciando migración de businessType...\n');

    // Conectar a la base de datos
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pos-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB:', mongoUri);

    // Encontrar tenants sin businessType o con valores inválidos
    const tenantsToMigrate = await Tenant.find({
      $or: [
        { businessType: { $exists: false } },
        { businessType: null },
        { businessType: '' },
        { businessType: { $nin: ['restaurant', 'dark_kitchen', 'supermarket', 'fruteria'] } }
      ]
    });

    console.log(`\n📊 Encontrados ${tenantsToMigrate.length} tenants para migrar\n`);

    if (tenantsToMigrate.length === 0) {
      console.log('✅ No hay tenants que migrar. Todos están actualizados.');
      await mongoose.connection.close();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const tenant of tenantsToMigrate) {
      try {
        console.log(`\n📝 Migrando tenant: ${tenant.companyName} (${tenant.subdomain})`);
        console.log(`   Plan actual: ${tenant.subscription.plan}`);

        // Asignar businessType default
        tenant.businessType = 'dark_kitchen';

        // Asignar restaurantConfig vacío (con defaults del schema)
        if (!tenant.restaurantConfig) {
          tenant.restaurantConfig = {
            enableTables: false,
            enableWaiters: false,
            enableTips: false,
            enableSplitBills: false,
            enableKitchenDisplay: false,
            maxTables: 0,
            tipSuggestions: [10, 15, 20],
            autoCloseAccountsAfterHours: 24,
            requireManagerForCancellation: true
          };
        }

        // Actualizar límites según el plan actual
        tenant.updateLimitsForPlan(tenant.subscription.plan);

        // Guardar cambios
        await tenant.save();

        console.log(`   ✅ Migrado exitosamente`);
        console.log(`   - businessType: ${tenant.businessType}`);
        console.log(`   - Límites actualizados para plan: ${tenant.subscription.plan}`);
        console.log(`   - maxTables: ${tenant.limits.maxTables}`);
        console.log(`   - maxWaiters: ${tenant.limits.maxWaiters}`);
        console.log(`   - maxOpenAccounts: ${tenant.limits.maxOpenAccounts}`);

        migratedCount++;
      } catch (error) {
        console.error(`   ❌ Error migrando tenant ${tenant.subdomain}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`Total de tenants encontrados: ${tenantsToMigrate.length}`);
    console.log(`✅ Migrados exitosamente: ${migratedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount > 0) {
      console.warn('⚠️  Algunos tenants no se migraron correctamente. Revisa los errores arriba.');
    } else {
      console.log('🎉 ¡Migración completada exitosamente!');
    }

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n✅ Conexión a MongoDB cerrada\n');

  } catch (error) {
    console.error('\n❌ Error fatal en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateBusinessType();

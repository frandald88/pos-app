/**
 * Script de Sincronización: Contadores de recursos vs base de datos
 *
 * Este script sincroniza los contadores en tenant.metadata con los valores reales
 * de la base de datos para usuarios, tiendas y productos.
 *
 * PROPÓSITO: Corregir discrepancias entre los contadores y la realidad,
 * especialmente cuando usuarios fueron creados sin incrementar los contadores.
 *
 * ADVERTENCIA: Este script modifica datos en la base de datos.
 * Asegúrate de hacer un backup antes de ejecutarlo.
 *
 * Uso:
 *   node scripts/syncResourceCounters.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../core/tenants/model');
const User = require('../core/users/model');
const Tienda = require('../modules/tiendas/model');
const Product = require('../core/products/model');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pos-app';
    console.log(`${colors.cyan}Conectando a MongoDB...${colors.reset}`);
    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✓ Conectado a MongoDB${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error al conectar a MongoDB:${colors.reset}`, error);
    process.exit(1);
  }
}

async function syncResourceCounters() {
  try {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   Script de Sincronización: Contadores       ║');
    console.log('║   AstroDish POS                                ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);

    // Obtener todos los tenants
    const tenants = await Tenant.find({});
    console.log(`${colors.cyan}📊 Tenants encontrados: ${tenants.length}${colors.reset}\n`);

    let totalUpdated = 0;
    let totalDiscrepancies = 0;

    for (const tenant of tenants) {
      console.log(`${colors.bright}${colors.blue}Procesando Tenant: ${tenant.businessName || tenant._id}${colors.reset}`);
      console.log(`Plan: ${colors.yellow}${tenant.subscription.plan}${colors.reset}`);

      const discrepancies = [];
      const updates = {};

      // 1. Verificar usuarios
      const actualUsers = await User.countDocuments({
        tenantId: tenant._id,
        deletedAt: null // No contar usuarios eliminados
      });
      const recordedUsers = tenant.metadata?.totalUsers || 0;

      console.log(`  Usuarios: ${colors.cyan}Actual: ${actualUsers}${colors.reset} | ${colors.yellow}Registrado: ${recordedUsers}${colors.reset}`);

      if (actualUsers !== recordedUsers) {
        discrepancies.push(`Usuarios: ${recordedUsers} → ${actualUsers} (diferencia: ${actualUsers - recordedUsers})`);
        updates['metadata.totalUsers'] = actualUsers;
      }

      // 2. Verificar tiendas
      const actualTiendas = await Tienda.countDocuments({ tenantId: tenant._id });
      const recordedTiendas = tenant.metadata?.totalTiendas || 0;

      console.log(`  Tiendas: ${colors.cyan}Actual: ${actualTiendas}${colors.reset} | ${colors.yellow}Registrado: ${recordedTiendas}${colors.reset}`);

      if (actualTiendas !== recordedTiendas) {
        discrepancies.push(`Tiendas: ${recordedTiendas} → ${actualTiendas} (diferencia: ${actualTiendas - recordedTiendas})`);
        updates['metadata.totalTiendas'] = actualTiendas;
      }

      // 3. Verificar productos
      const actualProducts = await Product.countDocuments({ tenantId: tenant._id });
      const recordedProducts = tenant.metadata?.totalProducts || 0;

      console.log(`  Productos: ${colors.cyan}Actual: ${actualProducts}${colors.reset} | ${colors.yellow}Registrado: ${recordedProducts}${colors.reset}`);

      if (actualProducts !== recordedProducts) {
        discrepancies.push(`Productos: ${recordedProducts} → ${actualProducts} (diferencia: ${actualProducts - recordedProducts})`);
        updates['metadata.totalProducts'] = actualProducts;
      }

      // 4. Aplicar actualizaciones si hay discrepancias
      if (discrepancies.length > 0) {
        console.log(`\n  ${colors.yellow}⚠️  Discrepancias encontradas:${colors.reset}`);
        discrepancies.forEach(d => console.log(`    • ${d}`));

        await Tenant.findByIdAndUpdate(tenant._id, { $set: updates });

        console.log(`  ${colors.green}✓ Contadores sincronizados${colors.reset}\n`);
        totalUpdated++;
        totalDiscrepancies += discrepancies.length;
      } else {
        console.log(`  ${colors.green}✓ Sin discrepancias${colors.reset}\n`);
      }
    }

    // Resumen final
    console.log(`${colors.bright}${colors.green}════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✓ Sincronización completada${colors.reset}\n`);
    console.log(`${colors.cyan}Resumen:${colors.reset}`);
    console.log(`  Tenants procesados: ${colors.yellow}${tenants.length}${colors.reset}`);
    console.log(`  Tenants actualizados: ${colors.yellow}${totalUpdated}${colors.reset}`);
    console.log(`  Discrepancias corregidas: ${colors.yellow}${totalDiscrepancies}${colors.reset}\n`);

    if (totalUpdated === 0) {
      console.log(`${colors.green}✓ Todos los contadores están sincronizados correctamente${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Se encontraron y corrigieron ${totalDiscrepancies} discrepancias${colors.reset}`);
      console.log(`${colors.cyan}Recomendación: Verifica que el onboarding incremente los contadores correctamente${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}Error durante la sincronización:${colors.reset}`, error);
    throw error;
  }
}

// Ejecutar script
(async () => {
  try {
    await connectDB();
    await syncResourceCounters();
    console.log(`${colors.green}Script finalizado correctamente${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
})();

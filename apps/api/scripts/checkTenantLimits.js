/**
 * Script de Diagnóstico: Verificar límites y contadores de un tenant
 *
 * Uso:
 *   node scripts/checkTenantLimits.js <tenantId>
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
    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✓ Conectado a MongoDB${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error al conectar a MongoDB:${colors.reset}`, error);
    process.exit(1);
  }
}

async function checkTenantLimits(tenantId) {
  try {
    console.log(`${colors.bright}${colors.blue}Verificando Tenant: ${tenantId}${colors.reset}\n`);

    // Obtener tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      console.log(`${colors.red}❌ Tenant no encontrado${colors.reset}`);
      return;
    }

    console.log(`${colors.cyan}Información del Tenant:${colors.reset}`);
    console.log(`  Nombre: ${colors.yellow}${tenant.businessName}${colors.reset}`);
    console.log(`  Plan: ${colors.yellow}${tenant.subscription.plan}${colors.reset}`);
    console.log(`  Subdomain: ${colors.yellow}${tenant.subdomain}${colors.reset}\n`);

    // Mostrar límites del plan
    console.log(`${colors.cyan}Límites del Plan ${tenant.subscription.plan}:${colors.reset}`);
    console.log(`  maxUsers: ${colors.yellow}${tenant.limits.maxUsers}${colors.reset}`);
    console.log(`  maxTiendas: ${colors.yellow}${tenant.limits.maxTiendas}${colors.reset}`);
    console.log(`  maxProducts: ${colors.yellow}${tenant.limits.maxProducts}${colors.reset}\n`);

    // Contar recursos REALES en la base de datos
    const actualUsers = await User.countDocuments({
      tenantId: tenant._id,
      deletedAt: null
    });

    const actualTiendas = await Tienda.countDocuments({
      tenantId: tenant._id
    });

    const actualTiendasActivas = await Tienda.countDocuments({
      tenantId: tenant._id,
      activa: true
    });

    const actualProducts = await Product.countDocuments({
      tenantId: tenant._id
    });

    // Mostrar contadores registrados
    console.log(`${colors.cyan}Contadores Registrados (metadata):${colors.reset}`);
    console.log(`  totalUsers: ${colors.yellow}${tenant.metadata?.totalUsers || 0}${colors.reset}`);
    console.log(`  totalTiendas: ${colors.yellow}${tenant.metadata?.totalTiendas || 0}${colors.reset}`);
    console.log(`  totalProducts: ${colors.yellow}${tenant.metadata?.totalProducts || 0}${colors.reset}\n`);

    // Mostrar contadores reales
    console.log(`${colors.cyan}Contadores Reales (base de datos):${colors.reset}`);
    console.log(`  Usuarios (activos): ${colors.yellow}${actualUsers}${colors.reset}`);
    console.log(`  Tiendas (todas): ${colors.yellow}${actualTiendas}${colors.reset}`);
    console.log(`  Tiendas (activas): ${colors.yellow}${actualTiendasActivas}${colors.reset}`);
    console.log(`  Productos: ${colors.yellow}${actualProducts}${colors.reset}\n`);

    // Verificar discrepancias
    const userDiscrepancy = actualUsers !== (tenant.metadata?.totalUsers || 0);
    const tiendaDiscrepancy = actualTiendas !== (tenant.metadata?.totalTiendas || 0);
    const productDiscrepancy = actualProducts !== (tenant.metadata?.totalProducts || 0);

    if (userDiscrepancy || tiendaDiscrepancy || productDiscrepancy) {
      console.log(`${colors.red}${colors.bright}⚠️  DISCREPANCIAS DETECTADAS:${colors.reset}`);
      if (userDiscrepancy) {
        console.log(`  ${colors.red}Usuarios: Registrado=${tenant.metadata?.totalUsers || 0}, Real=${actualUsers} (diferencia: ${actualUsers - (tenant.metadata?.totalUsers || 0)})${colors.reset}`);
      }
      if (tiendaDiscrepancy) {
        console.log(`  ${colors.red}Tiendas: Registrado=${tenant.metadata?.totalTiendas || 0}, Real=${actualTiendas} (diferencia: ${actualTiendas - (tenant.metadata?.totalTiendas || 0)})${colors.reset}`);
      }
      if (productDiscrepancy) {
        console.log(`  ${colors.red}Productos: Registrado=${tenant.metadata?.totalProducts || 0}, Real=${actualProducts} (diferencia: ${actualProducts - (tenant.metadata?.totalProducts || 0)})${colors.reset}`);
      }
      console.log(`\n  ${colors.yellow}Ejecuta: node scripts/syncResourceCounters.js${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Todos los contadores están sincronizados${colors.reset}`);
    }

    // Verificar si se están respetando los límites
    console.log(`\n${colors.cyan}Estado de Límites:${colors.reset}`);

    const userStatus = tenant.limits.maxUsers === -1 ? 'ILIMITADO' :
      actualUsers > tenant.limits.maxUsers ? 'EXCEDIDO' :
      actualUsers === tenant.limits.maxUsers ? 'EN EL LÍMITE' : 'OK';

    const tiendaStatus = tenant.limits.maxTiendas === -1 ? 'ILIMITADO' :
      actualTiendas > tenant.limits.maxTiendas ? 'EXCEDIDO' :
      actualTiendas === tenant.limits.maxTiendas ? 'EN EL LÍMITE' : 'OK';

    const productStatus = tenant.limits.maxProducts === -1 ? 'ILIMITADO' :
      actualProducts > tenant.limits.maxProducts ? 'EXCEDIDO' :
      actualProducts === tenant.limits.maxProducts ? 'EN EL LÍMITE' : 'OK';

    const statusColor = (status) => {
      if (status === 'EXCEDIDO') return colors.red;
      if (status === 'EN EL LÍMITE') return colors.yellow;
      if (status === 'ILIMITADO') return colors.blue;
      return colors.green;
    };

    console.log(`  Usuarios: ${statusColor(userStatus)}${actualUsers}/${tenant.limits.maxUsers === -1 ? '∞' : tenant.limits.maxUsers} - ${userStatus}${colors.reset}`);
    console.log(`  Tiendas: ${statusColor(tiendaStatus)}${actualTiendas}/${tenant.limits.maxTiendas === -1 ? '∞' : tenant.limits.maxTiendas} - ${tiendaStatus}${colors.reset}`);
    console.log(`  Productos: ${statusColor(productStatus)}${actualProducts}/${tenant.limits.maxProducts === -1 ? '∞' : tenant.limits.maxProducts} - ${productStatus}${colors.reset}\n`);

    // Listar tiendas
    console.log(`${colors.cyan}Tiendas del Tenant:${colors.reset}`);
    const tiendas = await Tienda.find({ tenantId: tenant._id }).select('nombre activa createdAt');
    tiendas.forEach((tienda, index) => {
      const statusIcon = tienda.activa ? '✓' : '✗';
      const statusColor = tienda.activa ? colors.green : colors.red;
      console.log(`  ${index + 1}. ${statusColor}${statusIcon}${colors.reset} ${tienda.nombre} ${colors.cyan}(${tienda.activa ? 'activa' : 'inactiva'})${colors.reset} - Creada: ${tienda.createdAt.toISOString().split('T')[0]}`);
    });

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    throw error;
  }
}

// Ejecutar script
(async () => {
  try {
    const tenantId = process.argv[2];

    if (!tenantId) {
      console.log(`${colors.yellow}Uso: node scripts/checkTenantLimits.js <tenantId>${colors.reset}`);
      console.log(`\nEjemplo: node scripts/checkTenantLimits.js 507f1f77bcf86cd799439011\n`);
      process.exit(1);
    }

    await connectDB();
    await checkTenantLimits(tenantId);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
})();

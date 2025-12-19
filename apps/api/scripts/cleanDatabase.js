/**
 * Script de Limpieza de Base de Datos para Producción
 *
 * Este script elimina todos los datos de prueba de la base de datos
 * manteniendo la estructura de las colecciones intacta.
 *
 * ADVERTENCIA: Esta acción es IRREVERSIBLE. Asegúrate de hacer un backup antes.
 *
 * Uso:
 *   node scripts/cleanDatabase.js [options]
 *
 * Opciones:
 *   --confirm          Confirma que quieres ejecutar la limpieza (requerido)
 *   --keep-admin       Mantiene el usuario admin principal
 *   --dry-run          Muestra qué se eliminaría sin hacerlo
 *
 * Ejemplos:
 *   node scripts/cleanDatabase.js --confirm --keep-admin
 *   node scripts/cleanDatabase.js --dry-run
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importar todos los modelos
const Sale = require('../core/sales/model');
const Product = require('../core/products/model');
const User = require('../core/users/model');
const Tenant = require('../core/tenants/model');
const Tienda = require('../modules/tiendas/model');
const Cliente = require('../modules/clientes/model');
const Empleado = require('../modules/empleados/model');
const Turno = require('../core/turnos/model');
const Gasto = require('../core/gastos/model');
const Devolucion = require('../core/devoluciones/model');
const Order = require('../core/delivery/model');
const Asistencia = require('../modules/asistencia/model');
const Schedule = require('../modules/schedules/model');
const Table = require('../core/tables/model');
const Account = require('../core/accounts/model');
const PurchaseOrder = require('../modules/purchaseOrders/model');
const Vacacion = require('../modules/vacaciones/model');
const Contact = require('../modules/contact/model');
const Counter = require('../shared/models/Counter');

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

// Parsear argumentos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isConfirmed = args.includes('--confirm');
const keepAdmin = args.includes('--keep-admin');

// Tenants protegidos que NO se eliminarán (como strings para comparación)
const PROTECTED_TENANT_IDS = [
  '69110bb43363b3535ab1b841',
  '6920cb987e1518833f799b55',
  '6920ebccf1fca0f7a063396e'
];

// Convertir a ObjectId para las consultas de MongoDB
const PROTECTED_TENANTS = PROTECTED_TENANT_IDS.map(id => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    console.error(`Error al convertir ID ${id} a ObjectId:`, error);
    return id; // Fallback al string si falla la conversión
  }
});

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

async function getCollectionStats() {
  const stats = {
    sales: await Sale.countDocuments(),
    products: await Product.countDocuments(),
    users: await User.countDocuments(),
    tenants: await Tenant.countDocuments(),
    tiendas: await Tienda.countDocuments(),
    clientes: await Cliente.countDocuments(),
    empleados: await Empleado.countDocuments(),
    turnos: await Turno.countDocuments(),
    gastos: await Gasto.countDocuments(),
    devoluciones: await Devolucion.countDocuments(),
    orders: await Order.countDocuments(),
    asistencias: await Asistencia.countDocuments(),
    schedules: await Schedule.countDocuments(),
    tables: await Table.countDocuments(),
    accounts: await Account.countDocuments(),
    purchaseOrders: await PurchaseOrder.countDocuments(),
    vacaciones: await Vacacion.countDocuments(),
    contacts: await Contact.countDocuments(),
    counters: await Counter.countDocuments()
  };

  return stats;
}

async function verifyProtectedTenants() {
  console.log(`${colors.cyan}Verificando tenants protegidos...${colors.reset}\n`);

  const verification = {
    tenantsExist: 0,
    sales: 0,
    products: 0,
    users: 0,
    tiendas: 0,
    clientes: 0,
    empleados: 0,
    turnos: 0,
    gastos: 0,
    devoluciones: 0,
    orders: 0,
    asistencias: 0,
    schedules: 0,
    tables: 0,
    accounts: 0,
    purchaseOrders: 0,
    vacaciones: 0,
    counters: 0
  };

  // Verificar si los tenants existen
  verification.tenantsExist = await Tenant.countDocuments({ _id: { $in: PROTECTED_TENANTS } });

  // Contar documentos de cada colección que pertenecen a los tenants protegidos
  verification.sales = await Sale.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.products = await Product.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.users = await User.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.tiendas = await Tienda.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.clientes = await Cliente.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.empleados = await Empleado.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.turnos = await Turno.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.gastos = await Gasto.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.devoluciones = await Devolucion.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.orders = await Order.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.asistencias = await Asistencia.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.schedules = await Schedule.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.tables = await Table.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.accounts = await Account.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.purchaseOrders = await PurchaseOrder.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.vacaciones = await Vacacion.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });
  verification.counters = await Counter.countDocuments({ tenantId: { $in: PROTECTED_TENANTS } });

  console.log(`${colors.bright}Datos de Tenants Protegidos:${colors.reset}`);
  console.log('═'.repeat(50));
  console.log(`  ${'Tenants encontrados'.padEnd(30)} ${colors.green}${verification.tenantsExist}${colors.reset} de ${PROTECTED_TENANT_IDS.length}`);
  console.log('─'.repeat(50));

  Object.entries(verification).forEach(([collection, count]) => {
    if (collection === 'tenantsExist') return;
    const color = count > 0 ? colors.green : colors.yellow;
    console.log(`  ${collection.padEnd(30)} ${color}${count.toString().padStart(6)}${colors.reset}`);
  });

  const total = Object.entries(verification)
    .filter(([key]) => key !== 'tenantsExist')
    .reduce((sum, [, count]) => sum + count, 0);
  console.log('─'.repeat(50));
  console.log(`  ${'TOTAL A PROTEGER'.padEnd(30)} ${colors.bright}${colors.green}${total.toString().padStart(6)}${colors.reset}`);
  console.log('═'.repeat(50));
  console.log();

  return verification;
}

function printStats(title, stats) {
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log('═'.repeat(50));

  Object.entries(stats).forEach(([collection, count]) => {
    const color = count > 0 ? colors.yellow : colors.green;
    console.log(`  ${collection.padEnd(20)} ${color}${count.toString().padStart(6)}${colors.reset}`);
  });

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  console.log('─'.repeat(50));
  console.log(`  ${'TOTAL'.padEnd(20)} ${colors.bright}${total.toString().padStart(6)}${colors.reset}`);
  console.log('═'.repeat(50));
  console.log();
}

async function cleanDatabase() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Script de Limpieza de Base de Datos         ║');
  console.log('║   AstroDish POS                                ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  // Mostrar configuración
  console.log(`${colors.cyan}Configuración:${colors.reset}`);
  console.log(`  Modo: ${isDryRun ? colors.yellow + 'DRY RUN (simulación)' : colors.red + 'LIMPIEZA REAL' + colors.reset}`);
  console.log(`  Tenants protegidos: ${colors.green}${PROTECTED_TENANT_IDS.length}${colors.reset}`);
  PROTECTED_TENANT_IDS.forEach(id => {
    console.log(`    - ${colors.green}${id}${colors.reset}`);
  });
  console.log();

  // Obtener estadísticas iniciales
  console.log(`${colors.cyan}Obteniendo estadísticas...${colors.reset}\n`);
  const statsBefore = await getCollectionStats();
  printStats('📊 Estado ANTES de la limpieza:', statsBefore);

  // Verificar tenants protegidos
  const protectedData = await verifyProtectedTenants();

  // Advertencia de seguridad
  if (!isDryRun && !isConfirmed) {
    console.log(`${colors.red}${colors.bright}⚠️  ADVERTENCIA ⚠️${colors.reset}`);
    console.log(`${colors.red}Esta operación eliminará TODOS los datos de prueba.${colors.reset}`);
    console.log(`${colors.red}Esta acción es IRREVERSIBLE.${colors.reset}\n`);
    console.log(`${colors.yellow}Para ejecutar la limpieza, usa: --confirm${colors.reset}`);
    console.log(`${colors.yellow}Para ver qué se eliminaría, usa: --dry-run${colors.reset}\n`);
    process.exit(0);
  }

  if (isDryRun) {
    console.log(`${colors.yellow}${colors.bright}🔍 MODO DRY RUN - No se eliminarán datos reales${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}🗑️  INICIANDO LIMPIEZA REAL...${colors.reset}\n`);
  }

  const results = {};

  try {
    // 1. VENTAS Y RELACIONADOS
    console.log(`${colors.cyan}1️⃣  Limpiando ventas y devoluciones...${colors.reset}`);
    if (!isDryRun) {
      results.sales = await Sale.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
      results.devoluciones = await Devolucion.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const salesToDelete = statsBefore.sales - protectedData.sales;
    const devolucionesToDelete = statsBefore.devoluciones - protectedData.devoluciones;
    console.log(`   ✓ Ventas: ${colors.red}${salesToDelete}${colors.reset} a eliminar de ${statsBefore.sales} (protegiendo ${colors.green}${protectedData.sales}${colors.reset})`);
    console.log(`   ✓ Devoluciones: ${colors.red}${devolucionesToDelete}${colors.reset} a eliminar de ${statsBefore.devoluciones} (protegiendo ${colors.green}${protectedData.devoluciones}${colors.reset})\n`);

    // 2. CAJA Y TURNOS
    console.log(`${colors.cyan}2️⃣  Limpiando turnos y gastos...${colors.reset}`);
    if (!isDryRun) {
      results.turnos = await Turno.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
      results.gastos = await Gasto.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const turnosToDelete = statsBefore.turnos - protectedData.turnos;
    const gastosToDelete = statsBefore.gastos - protectedData.gastos;
    console.log(`   ✓ Turnos: ${colors.red}${turnosToDelete}${colors.reset} a eliminar de ${statsBefore.turnos} (protegiendo ${colors.green}${protectedData.turnos}${colors.reset})`);
    console.log(`   ✓ Gastos: ${colors.red}${gastosToDelete}${colors.reset} a eliminar de ${statsBefore.gastos} (protegiendo ${colors.green}${protectedData.gastos}${colors.reset})\n`);

    // 3. DELIVERY Y ÓRDENES
    console.log(`${colors.cyan}3️⃣  Limpiando órdenes de delivery...${colors.reset}`);
    if (!isDryRun) {
      results.orders = await Order.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const ordersToDelete = statsBefore.orders - protectedData.orders;
    console.log(`   ✓ Órdenes: ${colors.red}${ordersToDelete}${colors.reset} a eliminar de ${statsBefore.orders} (protegiendo ${colors.green}${protectedData.orders}${colors.reset})\n`);

    // 4. COMPRAS
    console.log(`${colors.cyan}4️⃣  Limpiando órdenes de compra...${colors.reset}`);
    if (!isDryRun) {
      results.purchaseOrders = await PurchaseOrder.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const purchaseOrdersToDelete = statsBefore.purchaseOrders - protectedData.purchaseOrders;
    console.log(`   ✓ Órdenes de compra: ${colors.red}${purchaseOrdersToDelete}${colors.reset} a eliminar de ${statsBefore.purchaseOrders} (protegiendo ${colors.green}${protectedData.purchaseOrders}${colors.reset})\n`);

    // 5. ASISTENCIAS Y HORARIOS
    console.log(`${colors.cyan}5️⃣  Limpiando asistencias y horarios...${colors.reset}`);
    if (!isDryRun) {
      results.asistencias = await Asistencia.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
      results.schedules = await Schedule.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const asistenciasToDelete = statsBefore.asistencias - protectedData.asistencias;
    const schedulesToDelete = statsBefore.schedules - protectedData.schedules;
    console.log(`   ✓ Asistencias: ${colors.red}${asistenciasToDelete}${colors.reset} a eliminar de ${statsBefore.asistencias} (protegiendo ${colors.green}${protectedData.asistencias}${colors.reset})`);
    console.log(`   ✓ Horarios: ${colors.red}${schedulesToDelete}${colors.reset} a eliminar de ${statsBefore.schedules} (protegiendo ${colors.green}${protectedData.schedules}${colors.reset})\n`);

    // 6. VACACIONES
    console.log(`${colors.cyan}6️⃣  Limpiando solicitudes de vacaciones...${colors.reset}`);
    if (!isDryRun) {
      results.vacaciones = await Vacacion.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const vacacionesToDelete = statsBefore.vacaciones - protectedData.vacaciones;
    console.log(`   ✓ Vacaciones: ${colors.red}${vacacionesToDelete}${colors.reset} a eliminar de ${statsBefore.vacaciones} (protegiendo ${colors.green}${protectedData.vacaciones}${colors.reset})\n`);

    // 7. RESTAURANTE (MESAS Y CUENTAS)
    console.log(`${colors.cyan}7️⃣  Limpiando mesas y cuentas de restaurante...${colors.reset}`);
    if (!isDryRun) {
      results.accounts = await Account.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
      results.tables = await Table.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const accountsToDelete = statsBefore.accounts - protectedData.accounts;
    const tablesToDelete = statsBefore.tables - protectedData.tables;
    console.log(`   ✓ Cuentas: ${colors.red}${accountsToDelete}${colors.reset} a eliminar de ${statsBefore.accounts} (protegiendo ${colors.green}${protectedData.accounts}${colors.reset})`);
    console.log(`   ✓ Mesas: ${colors.red}${tablesToDelete}${colors.reset} a eliminar de ${statsBefore.tables} (protegiendo ${colors.green}${protectedData.tables}${colors.reset})\n`);

    // 8. CONTACTOS
    console.log(`${colors.cyan}8️⃣  Limpiando mensajes de contacto...${colors.reset}`);
    if (!isDryRun) {
      results.contacts = await Contact.deleteMany({});
    }
    console.log(`   ✓ Contactos: ${statsBefore.contacts} registros\n`);

    // 9. CLIENTES (OPCIONAL - Comentado por si quieres mantenerlos)
    console.log(`${colors.cyan}9️⃣  Limpiando clientes...${colors.reset}`);
    if (!isDryRun) {
      results.clientes = await Cliente.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const clientesToDelete = statsBefore.clientes - protectedData.clientes;
    console.log(`   ✓ Clientes: ${colors.red}${clientesToDelete}${colors.reset} a eliminar de ${statsBefore.clientes} (protegiendo ${colors.green}${protectedData.clientes}${colors.reset})\n`);

    // 10. PRODUCTOS (OPCIONAL - Comentado por si quieres mantenerlos)
    console.log(`${colors.cyan}🔟 Limpiando productos...${colors.reset}`);
    if (!isDryRun) {
      results.products = await Product.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const productsToDelete = statsBefore.products - protectedData.products;
    console.log(`   ✓ Productos: ${colors.red}${productsToDelete}${colors.reset} a eliminar de ${statsBefore.products} (protegiendo ${colors.green}${protectedData.products}${colors.reset})\n`);

    // 11. EMPLEADOS (OPCIONAL)
    console.log(`${colors.cyan}1️⃣1️⃣  Limpiando empleados...${colors.reset}`);
    if (!isDryRun) {
      results.empleados = await Empleado.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const empleadosToDelete = statsBefore.empleados - protectedData.empleados;
    console.log(`   ✓ Empleados: ${colors.red}${empleadosToDelete}${colors.reset} a eliminar de ${statsBefore.empleados} (protegiendo ${colors.green}${protectedData.empleados}${colors.reset})\n`);

    // 12. USUARIOS (Cuidado con este!)
    console.log(`${colors.cyan}1️⃣2️⃣  Limpiando usuarios...${colors.reset}`);
    if (!isDryRun) {
      // Eliminar usuarios que NO pertenecen a los tenants protegidos
      results.users = await User.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const usersToDelete = statsBefore.users - protectedData.users;
    console.log(`   ✓ Usuarios: ${colors.red}${usersToDelete}${colors.reset} a eliminar de ${statsBefore.users} (protegiendo ${colors.green}${protectedData.users}${colors.reset})\n`);

    // 13. TIENDAS
    console.log(`${colors.cyan}1️⃣3️⃣  Limpiando tiendas...${colors.reset}`);
    if (!isDryRun) {
      // Eliminar tiendas que NO pertenecen a los tenants protegidos
      results.tiendas = await Tienda.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const tiendasToDelete = statsBefore.tiendas - protectedData.tiendas;
    console.log(`   ✓ Tiendas: ${colors.red}${tiendasToDelete}${colors.reset} a eliminar de ${statsBefore.tiendas} (protegiendo ${colors.green}${protectedData.tiendas}${colors.reset})\n`);

    // 14. TENANTS
    console.log(`${colors.cyan}1️⃣4️⃣  Limpiando tenants...${colors.reset}`);
    if (!isDryRun) {
      // Eliminar tenants que NO están en la lista de protegidos
      results.tenants = await Tenant.deleteMany({ _id: { $nin: PROTECTED_TENANTS } });
    }
    const tenantsToDelete = statsBefore.tenants - protectedData.tenantsExist;
    console.log(`   ✓ Tenants: ${colors.red}${tenantsToDelete}${colors.reset} a eliminar de ${statsBefore.tenants} (protegiendo ${colors.green}${protectedData.tenantsExist}${colors.reset})\n`);

    // 15. CONTADORES (Reiniciar secuencias)
    console.log(`${colors.cyan}1️⃣5️⃣  Reiniciando contadores...${colors.reset}`);
    if (!isDryRun) {
      // Eliminar contadores que NO pertenecen a los tenants protegidos
      results.counters = await Counter.deleteMany({ tenantId: { $nin: PROTECTED_TENANTS } });
    }
    const countersToDelete = statsBefore.counters - protectedData.counters;
    console.log(`   ✓ Contadores: ${colors.red}${countersToDelete}${colors.reset} a eliminar de ${statsBefore.counters} (protegiendo ${colors.green}${protectedData.counters}${colors.reset})\n`);

    // Mostrar estadísticas finales
    if (!isDryRun) {
      const statsAfter = await getCollectionStats();
      printStats('📊 Estado DESPUÉS de la limpieza:', statsAfter);
    }

    // Resumen
    console.log(`${colors.green}${colors.bright}✓ Limpieza completada exitosamente${colors.reset}\n`);

    if (isDryRun) {
      console.log(`${colors.yellow}Esto fue una simulación. Para ejecutar realmente, usa --confirm${colors.reset}\n`);
    } else {
      const totalDeleted = Object.values(results).reduce((sum, result) => sum + (result?.deletedCount || 0), 0);
      console.log(`${colors.green}Total de registros eliminados: ${totalDeleted}${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}Error durante la limpieza:${colors.reset}`, error);
    throw error;
  }
}

// Ejecutar script
(async () => {
  try {
    await connectDB();
    await cleanDatabase();
    console.log(`${colors.green}Script finalizado correctamente${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
})();

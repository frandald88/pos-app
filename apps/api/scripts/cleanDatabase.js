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
  console.log(`  Mantener admin: ${keepAdmin ? colors.green + 'SÍ' : colors.red + 'NO'}${colors.reset}`);
  console.log();

  // Obtener estadísticas iniciales
  console.log(`${colors.cyan}Obteniendo estadísticas...${colors.reset}\n`);
  const statsBefore = await getCollectionStats();
  printStats('📊 Estado ANTES de la limpieza:', statsBefore);

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
      results.sales = await Sale.deleteMany({});
      results.devoluciones = await Devolucion.deleteMany({});
    }
    console.log(`   ✓ Ventas: ${statsBefore.sales} registros`);
    console.log(`   ✓ Devoluciones: ${statsBefore.devoluciones} registros\n`);

    // 2. CAJA Y TURNOS
    console.log(`${colors.cyan}2️⃣  Limpiando turnos y gastos...${colors.reset}`);
    if (!isDryRun) {
      results.turnos = await Turno.deleteMany({});
      results.gastos = await Gasto.deleteMany({});
    }
    console.log(`   ✓ Turnos: ${statsBefore.turnos} registros`);
    console.log(`   ✓ Gastos: ${statsBefore.gastos} registros\n`);

    // 3. DELIVERY Y ÓRDENES
    console.log(`${colors.cyan}3️⃣  Limpiando órdenes de delivery...${colors.reset}`);
    if (!isDryRun) {
      results.orders = await Order.deleteMany({});
    }
    console.log(`   ✓ Órdenes: ${statsBefore.orders} registros\n`);

    // 4. COMPRAS
    console.log(`${colors.cyan}4️⃣  Limpiando órdenes de compra...${colors.reset}`);
    if (!isDryRun) {
      results.purchaseOrders = await PurchaseOrder.deleteMany({});
    }
    console.log(`   ✓ Órdenes de compra: ${statsBefore.purchaseOrders} registros\n`);

    // 5. ASISTENCIAS Y HORARIOS
    console.log(`${colors.cyan}5️⃣  Limpiando asistencias y horarios...${colors.reset}`);
    if (!isDryRun) {
      results.asistencias = await Asistencia.deleteMany({});
      results.schedules = await Schedule.deleteMany({});
    }
    console.log(`   ✓ Asistencias: ${statsBefore.asistencias} registros`);
    console.log(`   ✓ Horarios: ${statsBefore.schedules} registros\n`);

    // 6. VACACIONES
    console.log(`${colors.cyan}6️⃣  Limpiando solicitudes de vacaciones...${colors.reset}`);
    if (!isDryRun) {
      results.vacaciones = await Vacacion.deleteMany({});
    }
    console.log(`   ✓ Vacaciones: ${statsBefore.vacaciones} registros\n`);

    // 7. RESTAURANTE (MESAS Y CUENTAS)
    console.log(`${colors.cyan}7️⃣  Limpiando mesas y cuentas de restaurante...${colors.reset}`);
    if (!isDryRun) {
      results.accounts = await Account.deleteMany({});
      results.tables = await Table.deleteMany({});
    }
    console.log(`   ✓ Cuentas: ${statsBefore.accounts} registros`);
    console.log(`   ✓ Mesas: ${statsBefore.tables} registros\n`);

    // 8. CONTACTOS
    console.log(`${colors.cyan}8️⃣  Limpiando mensajes de contacto...${colors.reset}`);
    if (!isDryRun) {
      results.contacts = await Contact.deleteMany({});
    }
    console.log(`   ✓ Contactos: ${statsBefore.contacts} registros\n`);

    // 9. CLIENTES (OPCIONAL - Comentado por si quieres mantenerlos)
    console.log(`${colors.cyan}9️⃣  Limpiando clientes...${colors.reset}`);
    if (!isDryRun) {
      results.clientes = await Cliente.deleteMany({});
    }
    console.log(`   ✓ Clientes: ${statsBefore.clientes} registros\n`);

    // 10. PRODUCTOS (OPCIONAL - Comentado por si quieres mantenerlos)
    console.log(`${colors.cyan}🔟 Limpiando productos...${colors.reset}`);
    if (!isDryRun) {
      results.products = await Product.deleteMany({});
    }
    console.log(`   ✓ Productos: ${statsBefore.products} registros\n`);

    // 11. EMPLEADOS (OPCIONAL)
    console.log(`${colors.cyan}1️⃣1️⃣  Limpiando empleados...${colors.reset}`);
    if (!isDryRun) {
      results.empleados = await Empleado.deleteMany({});
    }
    console.log(`   ✓ Empleados: ${statsBefore.empleados} registros\n`);

    // 12. USUARIOS (Cuidado con este!)
    console.log(`${colors.cyan}1️⃣2️⃣  Limpiando usuarios...${colors.reset}`);
    if (!isDryRun) {
      if (keepAdmin) {
        // Mantener el primer usuario admin
        const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (adminUser) {
          results.users = await User.deleteMany({ _id: { $ne: adminUser._id } });
          console.log(`   ℹ️  Manteniendo usuario admin: ${adminUser.username}`);
        } else {
          results.users = await User.deleteMany({});
        }
      } else {
        results.users = await User.deleteMany({});
      }
    }
    console.log(`   ✓ Usuarios: ${statsBefore.users} registros (${keepAdmin ? 'manteniendo 1 admin' : 'todos eliminados'})\n`);

    // 13. TIENDAS
    console.log(`${colors.cyan}1️⃣3️⃣  Limpiando tiendas...${colors.reset}`);
    if (!isDryRun) {
      if (keepAdmin) {
        // Si mantenemos admin, mantener su tienda principal
        const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (adminUser) {
          results.tiendas = await Tienda.deleteMany({ tenantId: { $ne: adminUser.tenantId } });
        } else {
          results.tiendas = await Tienda.deleteMany({});
        }
      } else {
        results.tiendas = await Tienda.deleteMany({});
      }
    }
    console.log(`   ✓ Tiendas: ${statsBefore.tiendas} registros\n`);

    // 14. TENANTS
    console.log(`${colors.cyan}1️⃣4️⃣  Limpiando tenants...${colors.reset}`);
    if (!isDryRun) {
      if (keepAdmin) {
        const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (adminUser) {
          results.tenants = await Tenant.deleteMany({ _id: { $ne: adminUser.tenantId } });
        } else {
          results.tenants = await Tenant.deleteMany({});
        }
      } else {
        results.tenants = await Tenant.deleteMany({});
      }
    }
    console.log(`   ✓ Tenants: ${statsBefore.tenants} registros\n`);

    // 15. CONTADORES (Reiniciar secuencias)
    console.log(`${colors.cyan}1️⃣5️⃣  Reiniciando contadores...${colors.reset}`);
    if (!isDryRun) {
      results.counters = await Counter.deleteMany({});
    }
    console.log(`   ✓ Contadores: ${statsBefore.counters} registros\n`);

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

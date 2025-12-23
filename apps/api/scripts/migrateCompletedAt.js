/**
 * Script de Migración: Poblar campo completedAt en ventas existentes
 *
 * Este script establece el campo completedAt para todas las ventas existentes
 * que ya están en estado 'entregado_y_cobrado', 'parcialmente_devuelta', o 'cancelada'
 *
 * ADVERTENCIA: Este script modifica datos en la base de datos.
 * Asegúrate de hacer un backup antes de ejecutarlo.
 *
 * Uso:
 *   node scripts/migrateCompletedAt.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('../core/sales/model');

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

async function migrateCompletedAt() {
  try {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   Script de Migración: completedAt            ║');
    console.log('║   AstroDish POS                                ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);

    // 1. Encontrar ventas que necesitan migración
    console.log(`${colors.cyan}📊 Analizando ventas...${colors.reset}\n`);

    const ventasSinCompletedAt = await Sale.countDocuments({
      status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'] },
      completedAt: null
    });

    console.log(`${colors.yellow}Ventas encontradas sin completedAt: ${ventasSinCompletedAt}${colors.reset}`);

    if (ventasSinCompletedAt === 0) {
      console.log(`${colors.green}✓ No hay ventas que migrar. Todas las ventas ya tienen completedAt.${colors.reset}\n`);
      return;
    }

    // 2. Desglose por estado
    const porEstado = await Sale.aggregate([
      {
        $match: {
          status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'] },
          completedAt: null
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`\n${colors.cyan}Desglose por estado:${colors.reset}`);
    porEstado.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${colors.yellow}${count}${colors.reset}`);
    });

    // 3. Confirmar antes de proceder
    console.log(`\n${colors.yellow}${colors.bright}⚠️  ADVERTENCIA ⚠️${colors.reset}`);
    console.log(`${colors.yellow}Esta operación modificará ${ventasSinCompletedAt} ventas.${colors.reset}`);
    console.log(`${colors.yellow}Se establecerá completedAt = updatedAt para cada venta.${colors.reset}\n`);

    // 4. Ejecutar migración
    console.log(`${colors.cyan}🔄 Iniciando migración...${colors.reset}\n`);

    const resultado = await Sale.updateMany(
      {
        status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'] },
        completedAt: null
      },
      [
        {
          $set: {
            completedAt: '$updatedAt'
          }
        }
      ]
    );

    // 5. Verificar resultados
    console.log(`${colors.green}${colors.bright}✓ Migración completada exitosamente${colors.reset}\n`);
    console.log(`${colors.cyan}Resultados:${colors.reset}`);
    console.log(`  Ventas actualizadas: ${colors.green}${resultado.modifiedCount}${colors.reset}`);
    console.log(`  Ventas procesadas: ${colors.green}${resultado.matchedCount}${colors.reset}`);

    // 6. Verificación final
    const ventasRestantes = await Sale.countDocuments({
      status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'] },
      completedAt: null
    });

    console.log(`\n${colors.cyan}Verificación final:${colors.reset}`);
    console.log(`  Ventas sin completedAt: ${ventasRestantes === 0 ? colors.green : colors.red}${ventasRestantes}${colors.reset}`);

    if (ventasRestantes === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ Todas las ventas han sido migradas correctamente${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Aún hay ${ventasRestantes} ventas sin migrar. Revisa los logs.${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}Error durante la migración:${colors.reset}`, error);
    throw error;
  }
}

// Ejecutar script
(async () => {
  try {
    await connectDB();
    await migrateCompletedAt();
    console.log(`${colors.green}Script finalizado correctamente${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
})();

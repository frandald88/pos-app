/**
 * Script de Generación: Productos de prueba
 *
 * Genera productos aleatorios para testing de límites y rendimiento
 *
 * Uso:
 *   node scripts/generateTestProducts.js <tenantId> --products 1000
 *   node scripts/generateTestProducts.js <tenantId> --products 1000 --tienda <tiendaId>
 *   node scripts/generateTestProducts.js <tenantId> --products 500 --category "Bebidas"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../core/products/model');
const Tenant = require('../core/tenants/model');
const Tienda = require('../modules/tiendas/model');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Datos de ejemplo para generar productos realistas
const categories = ['Alimentos', 'Bebidas', 'Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Belleza', 'Juguetes'];
const prefixes = ['Super', 'Mega', 'Ultra', 'Premium', 'Deluxe', 'Pro', 'Max', 'Plus'];
const productTypes = {
  Alimentos: ['Pan', 'Cereal', 'Pasta', 'Arroz', 'Galletas', 'Chocolate', 'Snack', 'Dulce'],
  Bebidas: ['Agua', 'Refresco', 'Jugo', 'Té', 'Café', 'Energética', 'Leche', 'Batido'],
  Electrónica: ['Cable', 'Cargador', 'Audífonos', 'Mouse', 'Teclado', 'USB', 'Batería', 'Adaptador'],
  Ropa: ['Playera', 'Pantalón', 'Sudadera', 'Chamarra', 'Calcetines', 'Gorra', 'Bufanda', 'Guantes'],
  Hogar: ['Vela', 'Cojín', 'Toalla', 'Sábana', 'Lámpara', 'Marco', 'Florero', 'Cortina'],
  Deportes: ['Pelota', 'Pesa', 'Banda', 'Guante', 'Red', 'Raqueta', 'Cuerda', 'Colchoneta'],
  Belleza: ['Crema', 'Shampoo', 'Jabón', 'Perfume', 'Loción', 'Mascarilla', 'Serum', 'Tónico'],
  Juguetes: ['Muñeca', 'Carro', 'Peluche', 'Rompecabezas', 'Bloques', 'Pelota', 'Juego', 'Figura']
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

function generateRandomProduct(tenantId, tiendaId, index, category = null) {
  const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
  const types = productTypes[selectedCategory];
  const type = types[Math.floor(Math.random() * types.length)];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  const productName = `${prefix} ${type} ${index}`;
  const price = (Math.random() * 500 + 10).toFixed(2); // Entre $10 y $510
  const stock = Math.floor(Math.random() * 100); // Entre 0 y 100 unidades
  const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 100000)}`.substring(0, 20);
  const barcode = `${Date.now()}${Math.floor(Math.random() * 10000)}`.substring(0, 13);

  return {
    tenantId,
    tienda: tiendaId,
    name: productName,
    sku: sku,
    barcode: barcode,
    price: parseFloat(price),
    stock: stock,
    category: selectedCategory
  };
}

async function generateProducts(tenantId, count, tiendaId = null, category = null) {
  try {
    console.log(`${colors.bright}${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║   Generador de Productos de Prueba            ║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║   AstroDish POS                                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    // Verificar tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      console.log(`${colors.red}❌ Tenant no encontrado${colors.reset}`);
      return;
    }

    console.log(`${colors.cyan}Tenant: ${colors.yellow}${tenant.businessName || tenant.subdomain}${colors.reset}`);
    console.log(`${colors.cyan}Plan: ${colors.yellow}${tenant.subscription.plan}${colors.reset}`);
    console.log(`${colors.cyan}Límite de productos: ${colors.yellow}${tenant.limits.maxProducts === -1 ? '∞' : tenant.limits.maxProducts}${colors.reset}\n`);

    // Verificar productos actuales
    const currentProducts = await Product.countDocuments({ tenantId });
    console.log(`${colors.cyan}Productos actuales: ${colors.yellow}${currentProducts}${colors.reset}`);
    console.log(`${colors.cyan}Productos a crear: ${colors.yellow}${count}${colors.reset}`);
    console.log(`${colors.cyan}Total después: ${colors.yellow}${currentProducts + count}${colors.reset}\n`);

    // Advertencia si excede el límite
    if (tenant.limits.maxProducts !== -1 && (currentProducts + count) > tenant.limits.maxProducts) {
      console.log(`${colors.yellow}${colors.bright}⚠️  ADVERTENCIA ⚠️${colors.reset}`);
      console.log(`${colors.yellow}El total de productos (${currentProducts + count}) excederá el límite del plan (${tenant.limits.maxProducts})${colors.reset}`);
      console.log(`${colors.yellow}Esto es útil para probar que el límite funcione correctamente.${colors.reset}\n`);
    }

    // Seleccionar tienda
    let selectedTienda = tiendaId;
    if (!selectedTienda) {
      const tienda = await Tienda.findOne({ tenantId }).sort({ createdAt: 1 });
      if (!tienda) {
        console.log(`${colors.red}❌ No se encontró ninguna tienda para este tenant${colors.reset}`);
        return;
      }
      selectedTienda = tienda._id;
      console.log(`${colors.cyan}Usando tienda: ${colors.yellow}${tienda.nombre}${colors.reset}\n`);
    }

    // Confirmar antes de continuar
    console.log(`${colors.magenta}Presiona Ctrl+C para cancelar o espera 3 segundos para continuar...${colors.reset}\n`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`${colors.cyan}🔄 Generando productos...${colors.reset}\n`);

    // Generar productos en lotes para mejor rendimiento
    const batchSize = 100;
    let created = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      const products = [];

      for (let j = 0; j < batchCount; j++) {
        products.push(generateRandomProduct(tenantId, selectedTienda, i + j + 1, category));
      }

      try {
        const result = await Product.insertMany(products, { ordered: false });
        const actuallyInserted = result.length;
        created += actuallyInserted;

        // Actualizar contador de productos solo con los realmente insertados
        if (actuallyInserted > 0) {
          await Tenant.findByIdAndUpdate(
            tenantId,
            { $inc: { 'metadata.totalProducts': actuallyInserted } }
          );
        }

        // Contar fallidos en este lote
        const batchFailed = batchCount - actuallyInserted;
        if (batchFailed > 0) {
          failed += batchFailed;
        }

        // Mostrar progreso
        const progress = (((i + batchCount) / count) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
        process.stdout.write(`\r  ${colors.cyan}[${bar}] ${progress}% (${created} creados, ${failed} fallidos)${colors.reset}`);
      } catch (error) {
        failed += batchCount;
        console.error(`\n${colors.red}Error en lote ${Math.floor(i / batchSize) + 1}:${colors.reset}`, error.message);
        if (error.writeErrors && error.writeErrors.length > 0) {
          console.error(`${colors.yellow}Primer error detallado:${colors.reset}`, error.writeErrors[0].err);
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n${colors.green}${colors.bright}✓ Generación completada${colors.reset}\n`);

    console.log(`${colors.cyan}Resultados:${colors.reset}`);
    console.log(`  Productos creados: ${colors.green}${created}${colors.reset}`);
    console.log(`  Productos fallidos: ${colors.red}${failed}${colors.reset}`);
    console.log(`  Tiempo total: ${colors.yellow}${duration}s${colors.reset}`);
    console.log(`  Velocidad: ${colors.yellow}${(created / parseFloat(duration)).toFixed(0)} productos/s${colors.reset}\n`);

    // Verificar contador final
    const finalCount = await Product.countDocuments({ tenantId });
    const recordedCount = tenant.metadata?.totalProducts || 0;

    console.log(`${colors.cyan}Verificación:${colors.reset}`);
    console.log(`  Productos en DB: ${colors.yellow}${finalCount}${colors.reset}`);
    console.log(`  Contador metadata: ${colors.yellow}${recordedCount + created}${colors.reset}`);

    if (category) {
      const categoryCount = await Product.countDocuments({ tenantId, categoria: category });
      console.log(`  Productos de "${category}": ${colors.yellow}${categoryCount}${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error durante la generación:${colors.reset}`, error);
    throw error;
  }
}

// Ejecutar script
(async () => {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.log(`${colors.yellow}Uso:${colors.reset}`);
      console.log(`  node scripts/generateTestProducts.js <tenantId> --products <cantidad>`);
      console.log(`\n${colors.cyan}Opciones:${colors.reset}`);
      console.log(`  --products <N>       Número de productos a crear (requerido)`);
      console.log(`  --tienda <id>        ID de tienda específica (opcional)`);
      console.log(`  --category <name>    Categoría específica (opcional)`);
      console.log(`\n${colors.cyan}Ejemplos:${colors.reset}`);
      console.log(`  node scripts/generateTestProducts.js 507f1f77bcf86cd799439011 --products 1000`);
      console.log(`  node scripts/generateTestProducts.js 507f1f77bcf86cd799439011 --products 500 --category "Bebidas"`);
      console.log(`\n${colors.cyan}Categorías disponibles:${colors.reset}`);
      console.log(`  ${categories.join(', ')}\n`);
      process.exit(1);
    }

    const tenantId = args[0];

    // Parsear argumentos
    let productCount = 100; // Default
    let tiendaId = null;
    let category = null;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--products' && args[i + 1]) {
        productCount = parseInt(args[i + 1]);
        i++;
      } else if (args[i] === '--tienda' && args[i + 1]) {
        tiendaId = args[i + 1];
        i++;
      } else if (args[i] === '--category' && args[i + 1]) {
        category = args[i + 1];
        i++;
      }
    }

    if (isNaN(productCount) || productCount <= 0) {
      console.log(`${colors.red}❌ La cantidad de productos debe ser un número positivo${colors.reset}\n`);
      process.exit(1);
    }

    if (productCount > 10000) {
      console.log(`${colors.yellow}⚠️  Advertencia: Crear más de 10,000 productos puede tardar varios minutos${colors.reset}\n`);
    }

    await connectDB();
    await generateProducts(tenantId, productCount, tiendaId, category);

    console.log(`${colors.green}Script finalizado correctamente${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
})();

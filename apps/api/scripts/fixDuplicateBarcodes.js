require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../core/products/model');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const fixDuplicateBarcodes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error(`${colors.red}❌ MONGO_URI no está definida en .env${colors.reset}`);
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✅ Conectado a MongoDB${colors.reset}\n`);

    // Paso 1: Encontrar barcodes duplicados
    console.log(`${colors.cyan}🔍 Buscando códigos de barras duplicados...${colors.reset}`);

    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: '$barcode',
          count: { $sum: 1 },
          products: { $push: { _id: '$_id', name: '$name', sku: '$sku' } }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    if (duplicates.length === 0) {
      console.log(`${colors.green}✅ No se encontraron códigos de barras duplicados${colors.reset}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`${colors.yellow}⚠️  Encontrados ${duplicates.length} códigos de barras duplicados${colors.reset}\n`);

    let totalProductsFixed = 0;
    let counter = 0;

    // Paso 2: Procesar cada grupo de duplicados
    for (const dup of duplicates) {
      const barcode = dup._id;
      const products = dup.products;

      console.log(`${colors.bright}Barcode: ${barcode} (${products.length} productos)${colors.reset}`);

      // Mantener el primer producto con su barcode original
      const [first, ...rest] = products;
      console.log(`  ✓ Manteniendo: ${first.name} (${first.sku})`);

      // Asignar nuevos barcodes a los demás
      for (const product of rest) {
        // Generar un nuevo barcode único
        let newBarcode;
        let isUnique = false;

        while (!isUnique) {
          // Combinar timestamp + contador + random para garantizar unicidad
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 100000);
          counter++;
          newBarcode = `${timestamp}${counter}${random}`;

          // Verificar que no exista
          const existing = await Product.findOne({ barcode: newBarcode });
          isUnique = !existing;
        }

        // Actualizar el producto con el nuevo barcode
        await Product.findByIdAndUpdate(product._id, { barcode: newBarcode });

        console.log(`  ${colors.green}✓ Actualizado: ${product.name} (${product.sku})${colors.reset}`);
        console.log(`    Nuevo barcode: ${colors.cyan}${newBarcode}${colors.reset}`);

        totalProductsFixed++;
      }

      console.log('');
    }

    // Resumen
    console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✅ Proceso completado${colors.reset}`);
    console.log(`${colors.yellow}📊 Barcodes duplicados encontrados: ${duplicates.length}${colors.reset}`);
    console.log(`${colors.green}✓  Productos actualizados: ${totalProductsFixed}${colors.reset}`);
    console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Verificación final
    console.log(`${colors.cyan}🔍 Verificando que no queden duplicados...${colors.reset}`);
    const remainingDuplicates = await Product.aggregate([
      {
        $group: {
          _id: '$barcode',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (remainingDuplicates.length === 0) {
      console.log(`${colors.green}✅ Todos los barcodes son ahora únicos${colors.reset}\n`);
    } else {
      console.log(`${colors.red}⚠️  Aún hay ${remainingDuplicates.length} duplicados (ejecuta el script de nuevo)${colors.reset}\n`);
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  }
};

fixDuplicateBarcodes();

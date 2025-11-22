/**
 * Script para limpiar índices obsoletos de purchaseorders
 * Ejecutar con: node apps/api/scripts/cleanPurchaseOrderIndexes.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function cleanIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ No se encontró MONGO_URI en las variables de entorno');
      process.exit(1);
    }

    console.log('Conectando a MongoDB...');

    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('purchaseorders');

    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log('\nÍndices actuales:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Eliminar índice problemático si existe
    const folioIndex = indexes.find(idx => idx.name === 'tenantId_1_folio_1');
    if (folioIndex) {
      console.log('\nEliminando índice tenantId_1_folio_1...');
      await collection.dropIndex('tenantId_1_folio_1');
      console.log('Índice eliminado exitosamente');
    } else {
      console.log('\nEl índice tenantId_1_folio_1 no existe');
    }

    // Listar índices después de la limpieza
    const newIndexes = await collection.indexes();
    console.log('\nÍndices después de limpieza:');
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Limpieza completada');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

cleanIndexes();

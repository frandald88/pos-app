const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script para limpiar índices antiguos antes de la migración multi-tenancy
 * Esto es necesario porque los índices antiguos pueden causar conflictos
 */

async function cleanIndexes() {
  try {
    console.log('🧹 Iniciando limpieza de índices...\n');

    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Lista de colecciones que necesitan limpieza de índices
    const collections = [
      'users',
      'products',
      'sales',
      'tiendas',
      'clientes',
      'turnos',
      'expenses',
      'returns',
      'orders',
      'employeehistories',
      'attendances',
      'vacationrequests',
      'schedules'
    ];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);

        // Verificar si la colección existe
        const collectionExists = await db.listCollections({ name: collectionName }).hasNext();

        if (!collectionExists) {
          console.log(`⏭️  Colección "${collectionName}" no existe, saltando...`);
          continue;
        }

        // Obtener índices actuales
        const indexes = await collection.indexes();
        console.log(`📋 Colección "${collectionName}": ${indexes.length} índices encontrados`);

        // Eliminar todos los índices excepto _id
        for (const index of indexes) {
          if (index.name !== '_id_') {
            await collection.dropIndex(index.name);
            console.log(`   ❌ Eliminado índice: ${index.name}`);
          }
        }

        console.log(`   ✅ Índices limpiados en "${collectionName}"\n`);
      } catch (error) {
        // Si la colección no existe o hay otro error, continuar
        console.log(`   ⚠️  Error en "${collectionName}": ${error.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Limpieza de índices completada!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Próximo paso:');
    console.log('   Ejecuta: node apps/api/scripts/migrateToMultiTenancy.js\n');

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar limpieza si se llama directamente
if (require.main === module) {
  cleanIndexes();
}

module.exports = cleanIndexes;

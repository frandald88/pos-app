// 📁 backend/scripts/updateClienteIndexes.js
// ✅ Script para actualizar índices de la colección de clientes

require('dotenv').config();
const mongoose = require('mongoose');
const Cliente = require('../modules/clientes/model');

// Configuración de conexión a MongoDB (igual que server.js)
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';

async function updateClienteIndexes() {
  try {
    console.log('🚀 Iniciando actualización de índices de clientes...\n');

    // Mostrar URI (ocultando credenciales)
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔗 Conectando a: ${safeUri}\n`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener la colección directamente
    const collection = mongoose.connection.collection('clientes');

    console.log('📋 Obteniendo índices actuales...\n');
    const currentIndexes = await collection.indexes();

    console.log('Índices actuales:');
    currentIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    console.log('');

    // Eliminar todos los índices excepto _id
    console.log('🗑️  Eliminando índices antiguos (excepto _id)...\n');
    for (const index of currentIndexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`  ✅ Índice "${index.name}" eliminado`);
        } catch (error) {
          console.log(`  ⚠️  No se pudo eliminar índice "${index.name}":`, error.message);
        }
      }
    }
    console.log('');

    // Crear el nuevo índice compuesto único
    console.log('🔨 Creando nuevo índice compuesto único...\n');
    try {
      await collection.createIndex(
        {
          nombre: 1,
          primerApellido: 1,
          segundoApellido: 1
        },
        {
          unique: true,
          collation: { locale: 'es', strength: 2 }, // Case-insensitive
          name: 'nombre_apellidos_unique'
        }
      );
      console.log('  ✅ Índice compuesto creado: nombre_apellidos_unique');
    } catch (error) {
      console.error('  ❌ Error al crear índice:', error.message);
    }
    console.log('');

    // Crear índice para búsquedas en nombreCompleto
    console.log('🔨 Creando índice para búsquedas en nombreCompleto...\n');
    try {
      await collection.createIndex(
        { nombreCompleto: 1 },
        { name: 'nombreCompleto_search' }
      );
      console.log('  ✅ Índice de búsqueda creado: nombreCompleto_search');
    } catch (error) {
      console.error('  ❌ Error al crear índice:', error.message);
    }
    console.log('');

    // Verificar índices finales
    console.log('📋 Verificando índices finales...\n');
    const finalIndexes = await collection.indexes();

    console.log('Índices finales:');
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) {
        console.log(`    (ÚNICO)`);
      }
      if (index.collation) {
        console.log(`    (Collation: ${index.collation.locale}, strength: ${index.collation.strength})`);
      }
    });
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Actualización de índices completada exitosamente');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error durante la actualización:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar actualización
updateClienteIndexes();

// 📁 backend/scripts/checkDuplicateClientes.js
// ✅ Script para detectar clientes duplicados antes de crear índice único

require('dotenv').config();
const mongoose = require('mongoose');
const Cliente = require('../modules/clientes/model');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';

async function checkDuplicateClientes() {
  try {
    console.log('🚀 Verificando clientes duplicados...\n');

    // Mostrar URI (ocultando credenciales)
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔗 Conectando a: ${safeUri}\n`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar duplicados usando agregación
    const duplicates = await Cliente.aggregate([
      {
        $group: {
          _id: {
            nombre: { $toLower: '$nombre' },
            primerApellido: { $toLower: { $ifNull: ['$primerApellido', ''] } },
            segundoApellido: { $toLower: { $ifNull: ['$segundoApellido', ''] } }
          },
          count: { $sum: 1 },
          clientes: {
            $push: {
              _id: '$_id',
              nombre: '$nombre',
              primerApellido: '$primerApellido',
              segundoApellido: '$segundoApellido',
              telefono: '$telefono'
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron clientes duplicados\n');
      console.log('Puedes proceder a crear el índice único con seguridad.\n');
    } else {
      console.log(`⚠️  Se encontraron ${duplicates.length} grupos de clientes duplicados:\n`);

      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. Nombre: "${dup._id.nombre} ${dup._id.primerApellido} ${dup._id.segundoApellido}".trim()`);
        console.log(`   Total de duplicados: ${dup.count}`);
        console.log('   Clientes:');
        dup.clientes.forEach((cliente, idx) => {
          console.log(`     ${idx + 1}. ID: ${cliente._id}`);
          console.log(`        Nombre: ${cliente.nombre}`);
          console.log(`        Apellido1: ${cliente.primerApellido || '(vacío)'}`);
          console.log(`        Apellido2: ${cliente.segundoApellido || '(vacío)'}`);
          console.log(`        Teléfono: ${cliente.telefono}`);
        });
        console.log('');
      });

      console.log('='.repeat(60));
      console.log('⚠️  ACCIÓN REQUERIDA:');
      console.log('='.repeat(60));
      console.log('Antes de crear el índice único, debes:');
      console.log('1. Revisar manualmente cada grupo de duplicados');
      console.log('2. Decidir qué registro mantener');
      console.log('3. Eliminar o actualizar los duplicados');
      console.log('4. Luego ejecutar el script de actualización de índices');
      console.log('='.repeat(60));
    }

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar verificación
checkDuplicateClientes();

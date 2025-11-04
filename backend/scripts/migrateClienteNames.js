// 📁 backend/scripts/migrateClienteNames.js
// ✅ Script de migración para dividir nombres completos en nombre, primerApellido, segundoApellido

require('dotenv').config(); // ⭐ Cargar variables de entorno
const mongoose = require('mongoose');
const Cliente = require('../modules/clientes/model');

// Configuración de conexión a MongoDB (igual que server.js)
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';

/**
 * Divide un nombre completo en componentes
 * @param {string} nombreCompleto
 * @returns {{ nombre: string, primerApellido: string, segundoApellido: string }}
 */
function splitNombreCompleto(nombreCompleto) {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  }

  const partes = nombreCompleto.trim().split(/\s+/);

  if (partes.length === 0) {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  } else if (partes.length === 1) {
    // Solo nombre
    return { nombre: partes[0], primerApellido: '', segundoApellido: '' };
  } else if (partes.length === 2) {
    // Nombre + Apellido
    return { nombre: partes[0], primerApellido: partes[1], segundoApellido: '' };
  } else if (partes.length === 3) {
    // Nombre + Primer Apellido + Segundo Apellido
    return { nombre: partes[0], primerApellido: partes[1], segundoApellido: partes[2] };
  } else {
    // Más de 3 partes: asumir que primeras partes son nombre(s)
    // Última parte es segundo apellido, penúltima es primer apellido
    const segundoApellido = partes[partes.length - 1];
    const primerApellido = partes[partes.length - 2];
    const nombre = partes.slice(0, partes.length - 2).join(' ');

    return { nombre, primerApellido, segundoApellido };
  }
}

async function migrateClienteNames() {
  try {
    console.log('🚀 Iniciando migración de nombres de clientes...\n');

    // Mostrar URI (ocultando credenciales)
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔗 Conectando a: ${safeUri}\n`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todos los clientes
    const clientes = await Cliente.find({});
    console.log(`📊 Total de clientes encontrados: ${clientes.length}\n`);

    let procesados = 0;
    let actualizados = 0;
    let errores = 0;

    for (const cliente of clientes) {
      procesados++;

      try {
        // Si ya tiene los campos nuevos y están llenos, saltar
        if (cliente.primerApellido || cliente.segundoApellido) {
          console.log(`⏭️  [${procesados}/${clientes.length}] Cliente "${cliente.nombre}" ya tiene apellidos, saltando...`);
          continue;
        }

        // Dividir el nombre completo actual
        const nombreOriginal = cliente.nombre;
        const { nombre, primerApellido, segundoApellido } = splitNombreCompleto(nombreOriginal);

        // Construir nombreCompleto
        const nombreCompleto = `${nombre} ${primerApellido} ${segundoApellido}`.trim();

        // Actualizar el cliente
        await Cliente.findByIdAndUpdate(
          cliente._id,
          {
            nombre: nombre,
            primerApellido: primerApellido,
            segundoApellido: segundoApellido,
            nombreCompleto: nombreCompleto
          },
          { runValidators: false } // Desactivar validadores para evitar problemas con índice único
        );

        actualizados++;
        console.log(`✅ [${procesados}/${clientes.length}] "${nombreOriginal}" → Nombre: "${nombre}", Apellido1: "${primerApellido}", Apellido2: "${segundoApellido}"`);
      } catch (error) {
        errores++;
        console.error(`❌ [${procesados}/${clientes.length}] Error al actualizar cliente "${cliente.nombre}":`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log('='.repeat(60));
    console.log(`Total procesados: ${procesados}`);
    console.log(`Actualizados:     ${actualizados}`);
    console.log(`Errores:          ${errores}`);
    console.log(`Saltados:         ${procesados - actualizados - errores}`);
    console.log('='.repeat(60));

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar migración
migrateClienteNames();

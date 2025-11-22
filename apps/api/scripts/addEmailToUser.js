/**
 * Script para agregar email a un usuario existente
 * Uso: node scripts/addEmailToUser.js <userId> <email>
 * Ejemplo: node scripts/addEmailToUser.js 68a4f4e8feb76de00503f9d0 admin@test.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';
const userId = process.argv[2];
const email = process.argv[3];

if (!userId || !email) {
  console.log('Uso: node scripts/addEmailToUser.js <userId> <email>');
  console.log('Ejemplo: node scripts/addEmailToUser.js 68a4f4e8feb76de00503f9d0 admin@test.com');
  process.exit(1);
}

async function addEmail() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { email: email.toLowerCase().trim() } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ Usuario no encontrado');
    } else if (result.modifiedCount === 0) {
      console.log('⚠️ Usuario encontrado pero no se modificó (puede que ya tenga ese email)');
    } else {
      console.log(`✅ Email "${email}" agregado al usuario ${userId}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addEmail();

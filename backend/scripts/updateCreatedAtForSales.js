const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Sale = require('../core/sales/model');

async function updateMissingCreatedAt() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 Conectado a MongoDB');

    const salesWithoutCreatedAt = await Sale.find({ createdAt: { $exists: false } });
    console.log(`🔍 Ventas encontradas sin createdAt: ${salesWithoutCreatedAt.length}`);

    let updatedCount = 0;

    for (const sale of salesWithoutCreatedAt) {
      const fecha = sale.date || new Date();

      const result = await Sale.updateOne(
        { _id: sale._id },
        { $set: { createdAt: fecha, updatedAt: fecha } }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`✅ Actualizada venta ${sale._id} con createdAt: ${fecha}`);
      } else {
        console.log(`⚠️ No se actualizó venta ${sale._id}`);
      }
    }

    console.log(`✅ Proceso terminado. Total de ventas actualizadas: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

updateMissingCreatedAt();

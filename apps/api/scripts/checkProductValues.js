require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../core/products/model');

const checkProductValues = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI no está definida en .env');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener 5 productos de muestra
    const sampleProducts = await Product.find().limit(5);

    console.log('\n📦 Productos de muestra:\n');
    sampleProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   TenantId: ${p.tenantId} (tipo: ${typeof p.tenantId})`);
      console.log(`   Price: ${p.price} (tipo: ${typeof p.price})`);
      console.log(`   Stock: ${p.stock} (tipo: ${typeof p.stock})`);
      console.log(`   Valor: ${p.price} × ${p.stock} = ${p.price * p.stock}`);
      console.log('');
    });

    // Intentar el aggregate manualmente
    const result = await Product.aggregate([
      { $limit: 10 },
      {
        $project: {
          name: 1,
          price: 1,
          stock: 1,
          priceType: { $type: '$price' },
          stockType: { $type: '$stock' },
          value: { $multiply: ['$price', '$stock'] }
        }
      }
    ]);

    console.log('\n🔍 Resultado del aggregate:\n');
    console.log(JSON.stringify(result, null, 2));

    // Probar el aggregate con el tenantId real
    const testTenantId = sampleProducts[0].tenantId;
    console.log(`\n🔍 Probando aggregate con tenantId: ${testTenantId}\n`);

    const testAgg = await Product.aggregate([
      { $match: { tenantId: testTenantId } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: [{ $toDouble: '$price' }, 0] },
                { $ifNull: [{ $toDouble: '$stock' }, 0] }
              ]
            }
          }
        }
      }
    ]);

    console.log('Resultado del aggregate con filtro:', testAgg);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkProductValues();

// 📁 /backend/tests/setup.js
// ✅ Configuración base para tests

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Configurar base de datos de test
const MONGO_URI_TEST = process.env.MONGO_URI_TEST || process.env.MONGO_URI + '_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Helper para limpiar base de datos entre tests
global.cleanDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

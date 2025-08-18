const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('🔍 SERVIDOR CON DEBUGGING PASO A PASO');
console.log('====================================');

// Database connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';
console.log('🔍 Connecting to MongoDB Atlas...');
console.log('🔍 URI found:', mongoUri ? 'yes' : 'no');

mongoose.connect(mongoUri)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

// Cargar rutas UNA POR UNA con debugging
console.log('\n🔍 Cargando rutas paso a paso...');

try {
  console.log('\n📋 1. Cargando auth routes...');
  const authRoutes = require('./backend/core/auth/routes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes: OK');
} catch (error) {
  console.log('❌ Auth routes: ERROR -', error.message);
  process.exit(1);
}

try {
  console.log('\n📋 2. Cargando users routes...');
  const usersRoutes = require('./backend/core/users/routes');
  app.use('/api/users', usersRoutes);
  console.log('✅ Users routes: OK');
} catch (error) {
  console.log('❌ Users routes: ERROR -', error.message);
  process.exit(1);
}

try {
  console.log('\n📋 3. Cargando products routes...');
  const productsRoutes = require('./backend/core/products/routes');
  app.use('/api/products', productsRoutes);
  console.log('✅ Products routes: OK');
} catch (error) {
  console.log('❌ Products routes: ERROR -', error.message);
  process.exit(1);
}

try {
  console.log('\n📋 4. Cargando sales routes...');
  const salesRoutes = require('./backend/core/sales/routes');
  app.use('/api/sales', salesRoutes);
  console.log('✅ Sales routes: OK');
} catch (error) {
  console.log('❌ Sales routes: ERROR -', error.message);
  process.exit(1);
}

try {
  console.log('\n📋 5. Cargando tiendas routes...');
  const tiendasRoutes = require('./backend/core/tiendas/routes');
  app.use('/api/tiendas', tiendasRoutes);
  console.log('✅ Tiendas routes: OK');
} catch (error) {
  console.log('❌ Tiendas routes: ERROR -', error.message);
  process.exit(1);
}

try {
  console.log('\n📋 6. Cargando clientes routes...');
  const clientesRoutes = require('./backend/modules/clientes/routes');
  app.use('/api/clientes', clientesRoutes);
  console.log('✅ Clientes routes: OK');
} catch (error) {
  console.log('❌ Clientes routes: ERROR -', error.message);
  console.log('⚠️ Continuando sin clientes...');
}

try {
  console.log('\n📋 7. Cargando devoluciones routes...');
  const devolucionesRoutes = require('./backend/modules/devoluciones/routes');
  app.use('/api/returns', devolucionesRoutes);
  console.log('✅ Devoluciones routes: OK');
} catch (error) {
  console.log('❌ Devoluciones routes: ERROR -', error.message);
  console.log('⚠️ Continuando sin devoluciones...');
}

// Health check
console.log('\n📋 8. Agregando health check...');
app.get('/', (req, res) => {
  res.json({ 
    message: 'POS Backend API is running - DEBUG VERSION',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1
  });
});
console.log('✅ Health check: OK');

// Error handling
console.log('\n📋 9. Configurando error handlers...');
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
console.log('✅ Error handlers: OK');

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

console.log('\n📋 10. Iniciando servidor...');
const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(`✅ Debug server running on port ${PORT}`);
    console.log(`🎯 Si llegaste hasta aquí, todas las rutas están bien`);
    console.log(`🔗 Test: http://localhost:${PORT}/`);
  });
} catch (error) {
  console.error('❌ Error starting server:', error);
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  if (req.method === 'DELETE') {
    console.log('🗑️🗑️🗑️ DELETE REQUEST DETECTADA');
    console.log('Path:', req.path);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Headers:', req.headers.authorization ? 'Token presente' : 'No token');
  }
  next();
});

// Database connection usando la URI correcta del .env
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-app';

if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Connecting to MongoDB Atlas...');
}

mongoose.connect(mongoUri)
.then(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Connected to MongoDB Atlas successfully');
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

// Core routes
const authRoutes = require('./core/auth/routes');
const usersRoutes = require('./core/users/routes');
const productsRoutes = require('./core/products/routes');
const salesRoutes = require('./core/sales/routes');

// Module routes - con try/catch para módulos opcionales
let clientesRoutes, devolucionesRoutes, deliveryRoutes, reportesRoutes, attendanceRoutes, expensesRoutes, empleadosRoutes, cajaRoutes, vacacionesRoutes, schedulesRoutes, tiendasRoutes;

try {
  clientesRoutes = require('./modules/clientes/routes');
} catch (e) {
  // Module not found - silent in production
}

try {
  devolucionesRoutes = require('./core/devoluciones/routes');
} catch (e) {
  // Module not found - silent in production
}

try {
  deliveryRoutes = require('./core/delivery/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  reportesRoutes = require('./modules/reportes/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  attendanceRoutes = require('./modules/asistencia/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  expensesRoutes = require('./core/gastos/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  empleadosRoutes = require('./modules/empleados/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  cajaRoutes = require('./core/caja/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  vacacionesRoutes = require('./modules/vacaciones/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  schedulesRoutes = require('./modules/schedules/routes');
} catch (e) {
  // Module not available - silent in production
}

try {
  tiendasRoutes = require('./modules/tiendas/routes');
} catch (e) {
  // Module not available - silent in production
}

// Configure routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);

if (tiendasRoutes) app.use('/api/tiendas', tiendasRoutes);
if (clientesRoutes) app.use('/api/clientes', clientesRoutes);
if (devolucionesRoutes) app.use('/api/returns', devolucionesRoutes);
if (deliveryRoutes) app.use('/api/orders', deliveryRoutes);
if (reportesRoutes) app.use('/api/report', reportesRoutes);
if (attendanceRoutes) app.use('/api/attendance', attendanceRoutes);
if (expensesRoutes) app.use('/api/expenses', expensesRoutes);
if (empleadosRoutes) app.use('/api/employees', empleadosRoutes);
if (cajaRoutes) app.use('/api/caja', cajaRoutes);
if (vacacionesRoutes) app.use('/api/vacations', vacacionesRoutes);
if (schedulesRoutes) app.use('/api/schedules', schedulesRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Health check adicional
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      users: '/api/users', 
      products: '/api/products',
      sales: '/api/sales',
      tiendas: '/api/tiendas',
      clientes: clientesRoutes ? '/api/clientes' : 'not available',
      devoluciones: devolucionesRoutes ? '/api/devoluciones' : 'not available',
      returns: devolucionesRoutes ? '/api/returns' : 'not available',
      orders: deliveryRoutes ? '/api/orders' : 'not available',
      reports: reportesRoutes ? '/api/report' : 'not available',
      attendance: attendanceRoutes ? '/api/attendance' : 'not available',
      expenses: expensesRoutes ? '/api/expenses' : 'not available',
      employees: empleadosRoutes ? '/api/employees' : 'not available',
      caja: cajaRoutes ? '/api/caja' : 'not available',
      vacations: vacacionesRoutes ? '/api/vacations' : 'not available',
      schedules: schedulesRoutes ? '/api/schedules' : 'not available' // ✅ NUEVO
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  
  // Proporcionar mensajes más amigables según la ruta
  let friendlyMessage = 'Ruta no encontrada';
  
  if (req.originalUrl.includes('/api/attendance')) {
    friendlyMessage = 'Error en el servicio de asistencia. Verifica tu conexión e intenta nuevamente.';
  } else if (req.originalUrl.includes('/api/')) {
    friendlyMessage = 'El servicio solicitado no está disponible. Contacta al administrador del sistema.';
  }
  
  res.status(404).json({ 
    message: friendlyMessage,
    error: 'ROUTE_NOT_FOUND',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      '/api/auth',
      '/api/users',
      '/api/products', 
      '/api/sales',
      '/api/tiendas',
      '/api/clientes',
      '/api/devoluciones',
      '/api/returns',
      '/api/orders',
      '/api/report',
      '/api/attendance',
      '/api/expenses',
      '/api/employees',
      '/api/caja',
      '/api/vacations',
      '/api/schedules' // ✅ NUEVO
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 POS System running on port ${PORT}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  }
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection usando la URI correcta del .env
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

// Core routes
const authRoutes = require('./core/auth/routes');
const usersRoutes = require('./core/users/routes');
const productsRoutes = require('./core/products/routes');
const salesRoutes = require('./core/sales/routes');
const tiendasRoutes = require('./core/tiendas/routes');

// Module routes - con try/catch para módulos opcionales
let clientesRoutes, devolucionesRoutes, deliveryRoutes, reportesRoutes, attendanceRoutes, expensesRoutes, empleadosRoutes, cajaRoutes, vacacionesRoutes, schedulesRoutes;

try {
  clientesRoutes = require('./modules/clientes/routes');
} catch (e) {
  console.log('⚠️ Clientes module not found');
}

try {
  devolucionesRoutes = require('./modules/devoluciones/routes');
} catch (e) {
  console.log('⚠️ Devoluciones module not found');
}

// ✅ AGREGAR: Cargar rutas de delivery
try {
  deliveryRoutes = require('./modules/delivery/routes');
  console.log('✅ Delivery module loaded successfully');
} catch (e) {
  console.log('⚠️ Delivery module not found:', e.message);
}

// ✅ NUEVO: Cargar rutas de reportes
try {
  reportesRoutes = require('./modules/reportes/routes');
  console.log('✅ Reportes module loaded successfully');
} catch (e) {
  console.log('⚠️ Reportes module not found:', e.message);
}

try {
  attendanceRoutes = require('./modules/asistencia/routes');
  console.log('✅ Asistencia module loaded successfully');
} catch (e) {
  console.log('⚠️ Asistencia module not found:', e.message);
}

try {
  expensesRoutes = require('./modules/gastos/routes');
  console.log('✅ Gastos module loaded successfully');
} catch (e) {
  console.log('⚠️ Gastos module not found:', e.message);
}

try {
  empleadosRoutes = require('./modules/empleados/routes');
  console.log('✅ Empleados module loaded successfully');
} catch (e) {
  console.log('⚠️ Empleados module not found:', e.message);
}

try {
  cajaRoutes = require('./modules/caja/routes');
  console.log('✅ Caja module loaded successfully');
} catch (e) {
  console.log('⚠️ Caja module not found:', e.message);
}

try {
  vacacionesRoutes = require('./modules/vacaciones/routes');
  console.log('✅ Vacaciones module loaded successfully');
} catch (e) {
  console.log('⚠️ Vacaciones module not found:', e.message);
}

// ✅ NUEVO: Cargar rutas de horarios
try {
  schedulesRoutes = require('./modules/schedules/routes');
  console.log('✅ Schedules module loaded successfully');
} catch (e) {
  console.log('⚠️ Schedules module not found:', e.message);
}

// Configure routes
console.log('🔍 Configuring routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tiendas', tiendasRoutes);

if (clientesRoutes) app.use('/api/clientes', clientesRoutes);

if (devolucionesRoutes) {
  app.use('/api/returns', devolucionesRoutes);
  console.log('✅ Returns routes configured at /api/returns');
}

if (deliveryRoutes) {
  app.use('/api/orders', deliveryRoutes);
  console.log('✅ Delivery/Orders routes configured at /api/orders');
}

if (reportesRoutes) {
  app.use('/api/report', reportesRoutes);
  console.log('✅ Reports routes configured at /api/report');
}

if (attendanceRoutes) {
  app.use('/api/attendance', attendanceRoutes);
  console.log('✅ Attendance routes configured at /api/attendance');
}

if (expensesRoutes) {
  app.use('/api/expenses', expensesRoutes);
  console.log('✅ Expenses routes configured at /api/expenses');
}

if (empleadosRoutes) {
  app.use('/api/employees', empleadosRoutes);
  console.log('✅ Employees routes configured at /api/employees');
}

if (cajaRoutes) {
  app.use('/api/caja', cajaRoutes);
  console.log('✅ Caja routes configured at /api/caja');
}

if (vacacionesRoutes) {
  app.use('/api/vacations', vacacionesRoutes);
  console.log('✅ Vacaciones routes configured at /api/vacations');
}

// ✅ NUEVO: Configurar rutas de horarios
if (schedulesRoutes) {
  app.use('/api/schedules', schedulesRoutes);
  console.log('✅ Schedules routes configured at /api/schedules');
}

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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'using fallback'}`);
  console.log(`🔍 MongoDB URI: ${process.env.MONGO_URI ? 'configured' : 'not found'}`);
  
  console.log('\n📋 Available routes:');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/users');
  console.log('   GET  /api/products');
  console.log('   GET  /api/sales');
  console.log('   GET  /api/tiendas');
  if (clientesRoutes) console.log('   GET  /api/clientes');
  if (devolucionesRoutes) {
    console.log('   GET  /api/devoluciones');
    console.log('   POST /api/devoluciones');
    console.log('   GET  /api/returns');
    console.log('   POST /api/returns');
  }
  if (deliveryRoutes) {
    console.log('   GET  /api/orders');
    console.log('   POST /api/orders');
    console.log('   PUT  /api/orders/:id');
    console.log('   DELETE /api/orders/:id');
  }
  if (reportesRoutes) {
    console.log('   GET  /api/report/ventas');
    console.log('   GET  /api/report/productos/top');
    console.log('   GET  /api/report/usuarios/performance');
  }
  if (attendanceRoutes) {
    console.log('   POST /api/attendance/checkin');
    console.log('   POST /api/attendance/checkout');
    console.log('   POST /api/attendance/absence');
    console.log('   GET  /api/attendance/report');
    console.log('   GET  /api/attendance/today');
    console.log('   GET  /api/attendance/mine');
    console.log('   GET  /api/attendance/schedule-check'); // ✅ NUEVO
  }
  if (expensesRoutes) {
    console.log('   GET  /api/expenses');
    console.log('   POST /api/expenses');
    console.log('   GET  /api/expenses/report');
    console.log('   PUT  /api/expenses/:id');
    console.log('   DELETE /api/expenses/:id');
  }
  if (empleadosRoutes) {
    console.log('   GET  /api/employees/history');
    console.log('   POST /api/employees/history');
    console.log('   PUT  /api/employees/history/:id');
    console.log('   DELETE /api/employees/history/:id');
    console.log('   GET  /api/employees/history/ranking/faltas');
    console.log('   GET  /api/employees/activos');
  }
  if (cajaRoutes) {
    console.log('   GET  /api/caja/reporte');
    console.log('   POST /api/caja/corte');
    console.log('   GET  /api/caja/historiales');
  }
  if (vacacionesRoutes) {
    console.log('   GET  /api/vacations/all');
    console.log('   GET  /api/vacations/mine');
    console.log('   POST /api/vacations');
    console.log('   PUT  /api/vacations/:id/status');
    console.log('   GET  /api/vacations/days/:userId');
  }
  // ✅ NUEVO: Mostrar rutas de horarios
  if (schedulesRoutes) {
    console.log('   GET  /api/schedules');
    console.log('   POST /api/schedules');
    console.log('   GET  /api/schedules/employee/:employeeId');
    console.log('   GET  /api/schedules/mine');
    console.log('   PUT  /api/schedules/:id');
    console.log('   DELETE /api/schedules/:id');
    console.log('   POST /api/schedules/default/:employeeId');
    console.log('   GET  /api/schedules/workday-check/:employeeId');
  }
});
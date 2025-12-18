const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

// Cargar .env desde la raíz del proyecto (2 niveles arriba)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// Cargar sistema de licencias
const { loadLicense, isModuleEnabled, getLicenseInfo } = require('./shared/middleware/licenseMiddleware');
loadLicense();

// Importar servicio de cierre automático de turnos
const { cerrarTurnosAutomaticamente } = require('./core/turnos/autoClose');

// Importar job de chequeo de suscripciones
const subscriptionCheckJob = require('./shared/jobs/subscriptionCheckJob');

// Middleware
app.use(cors());

// IMPORTANTE: Stripe webhook necesita body raw, montarlo ANTES de express.json()
const paymentController = require('./controllers/core/paymentController');
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// Aumentar límite de tamaño del body para permitir imágenes en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
const tenantsRoutes = require('./core/tenants/routes');
const paymentRoutes = require('./core/payments/routes');
const onboardingRoutes = require('./core/onboarding/routes');

// ✨ NUEVO: Core routes para restaurant
const tablesRoutes = require('./core/tables/routes');
const accountsRoutes = require('./core/accounts/routes');

// Contact routes (público)
const contactRoutes = require('./modules/contact/routes');

// Importar rutas de turnos con manejo de errores
let turnosRoutes;
try {
  turnosRoutes = require('./routes/core/turnos');
  console.log('✅ Módulo de rutas de turnos cargado correctamente');
} catch (error) {
  console.error('❌ Error al cargar rutas de turnos:', error.message);
}

// Module routes - con try/catch para módulos opcionales
let clientesRoutes, devolucionesRoutes, deliveryRoutes, reportesRoutes, attendanceRoutes, expensesRoutes, empleadosRoutes, cajaRoutes, vacacionesRoutes, schedulesRoutes, tiendasRoutes, purchaseOrdersRoutes;

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
  console.log('✅ Módulo de vacaciones cargado correctamente');
} catch (e) {
  console.error('❌ Error al cargar módulo de vacaciones:', e.message);
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

try {
  purchaseOrdersRoutes = require('./modules/purchaseOrders/routes');
} catch (e) {
  // Module not available - silent in production
}

// Configure routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/payments', paymentRoutes); // Las otras rutas de payments (excepto webhook)
app.use('/api/onboarding', onboardingRoutes);

// ✨ NUEVO: Restaurant routes
app.use('/api/tables', tablesRoutes);
app.use('/api/accounts', accountsRoutes);

// Contact (público - sin auth)
app.use('/api/contact', contactRoutes);

// Verificar y montar rutas de turnos
if (turnosRoutes) {
  app.use('/api/turnos', turnosRoutes);
  console.log('✅ Rutas de turnos montadas en /api/turnos');
} else {
  console.error('❌ turnosRoutes es undefined - no se pudieron montar las rutas de turnos');
}

// Core modules (siempre disponibles)
if (devolucionesRoutes) app.use('/api/returns', devolucionesRoutes);
if (deliveryRoutes) app.use('/api/orders', deliveryRoutes);
if (purchaseOrdersRoutes) app.use('/api/purchase-orders', purchaseOrdersRoutes);
if (expensesRoutes) app.use('/api/expenses', expensesRoutes);
if (cajaRoutes) app.use('/api/caja', cajaRoutes);

// Optional modules (requieren licencia)
if (tiendasRoutes && isModuleEnabled('tiendas')) {
  app.use('/api/tiendas', tiendasRoutes);
  console.log('✅ Módulo "tiendas" habilitado');
}

if (clientesRoutes && isModuleEnabled('clientes')) {
  app.use('/api/clientes', clientesRoutes);
  console.log('✅ Módulo "clientes" habilitado');
}

if (reportesRoutes && isModuleEnabled('reportes')) {
  app.use('/api/report', reportesRoutes);
  console.log('✅ Módulo "reportes" habilitado');
}

if (empleadosRoutes && isModuleEnabled('empleados')) {
  app.use('/api/employees', empleadosRoutes);
  console.log('✅ Módulo "empleados" habilitado');
}

if (vacacionesRoutes && isModuleEnabled('vacaciones')) {
  app.use('/api/vacations', vacacionesRoutes);
  console.log('✅ Módulo "vacaciones" habilitado');
}

if (attendanceRoutes && isModuleEnabled('empleados')) {
  app.use('/api/attendance', attendanceRoutes);
  console.log('✅ Módulo "asistencia" habilitado (parte de empleados)');
}

if (schedulesRoutes && isModuleEnabled('empleados')) {
  app.use('/api/schedules', schedulesRoutes);
  console.log('✅ Módulo "schedules" habilitado (parte de empleados)');
}

// Endpoint para obtener información de licencia
app.get('/api/license', getLicenseInfo);

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
      tenants: '/api/tenants',
      payments: '/api/payments',
      turnos: turnosRoutes ? '/api/turnos' : 'not available',
      tiendas: tiendasRoutes ? '/api/tiendas' : 'not available',
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
      schedules: schedulesRoutes ? '/api/schedules' : 'not available'
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
      '/api/tenants',
      '/api/payments',
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
      '/api/schedules',
      '/api/purchase-orders'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 POS System running on port ${PORT}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  }

  // Iniciar cron job para cierre automático de turnos
  // Se ejecuta todos los días a las 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    console.log('\n⏰ Ejecutando tarea programada: Cierre automático de turnos');
    await cerrarTurnosAutomaticamente();
  }, {
    scheduled: true,
    timezone: "America/Mexico_City" // Ajusta según tu zona horaria
  });

  // Iniciar cron job para chequeo de suscripciones
  subscriptionCheckJob.start();

  console.log('⏰ Cron job configurado: Cierre automático de turnos a las 11:59 PM');
});



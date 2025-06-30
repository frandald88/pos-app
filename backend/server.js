const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

const cajaRoutes = require('./routes/caja');
app.use('/api/caja', cajaRoutes);

const returnsRoutes = require('./routes/returns');
app.use('/api/returns', returnsRoutes);

app.use('/uploads', express.static('uploads'));

const ordersRoutes = require('./routes/orders');
app.use('/api/orders', ordersRoutes);

const employeeHistoryRoutes = require('./routes/employeeHistory');
app.use('/api/employees/history', employeeHistoryRoutes)

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const salesRoutes = require('./routes/sales');
app.use('/api/sales', salesRoutes);

// ✅ NUEVA RUTA para clientes
const clienteRoutes = require('./routes/clientes');
app.use('/api/clientes', clienteRoutes);

const attendanceRoutes = require("./routes/attendance");
app.use("/api/attendance", attendanceRoutes);

const expensesRoutes = require('./routes/expenses');
app.use('/api/expenses', expensesRoutes);

const tiendasRoutes = require('./routes/tiendas');
app.use('/api/tiendas', tiendasRoutes);




// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('API del POS funcionando ✅');
});

// Conexión a MongoDB y encender el servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🟢 Conectado a MongoDB');
    app.listen(5000, () => console.log('🚀 Servidor corriendo en http://localhost:5000'));
  })
  .catch(err => {
    console.error('🔴 Error al conectar a MongoDB:', err);
  });

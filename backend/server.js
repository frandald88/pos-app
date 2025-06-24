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
app.use('/api', authRoutes); // <- ¡ESTO ES CRUCIAL!

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('API del POS funcionando ✅');
});


const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const salesRoutes = require('./routes/sales');
app.use('/api/sales', salesRoutes);

// Conexión a MongoDB y encender el servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🟢 Conectado a MongoDB');
    app.listen(5000, () => console.log('🚀 Servidor corriendo en http://localhost:5000'));
  })
  .catch(err => {
    console.error('🔴 Error al conectar a MongoDB:', err);
  });

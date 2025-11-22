// 📁 /backend/core/index.js
// ✅ COPIAR Y PEGAR ESTE ARCHIVO COMPLETO

const express = require('express');
const { getActiveModules } = require('../config/modules');

function initializeCore(app) {
  const activeModules = getActiveModules();
  
  // 🎛️ Cargar rutas del CORE (siempre)
  if (activeModules.auth) {
    const authRoutes = require('./auth/routes');
    app.use('/api', authRoutes);
    console.log('✅ Auth core loaded at /api');
  }
  
  if (activeModules.users) {
    const userRoutes = require('./users/routes');
    app.use('/api/users', userRoutes);
    console.log('✅ Users core loaded at /api/users');
  }
  
  if (activeModules.tiendas) {
    const tiendasRoutes = require('./tiendas/routes');
    app.use('/api/tiendas', tiendasRoutes);
    console.log('✅ Tiendas core loaded at /api/tiendas');
  }
  
  if (activeModules.products) {
    const productRoutes = require('./products/routes');
    app.use('/api/products', productRoutes);
    console.log('✅ Products core loaded at /api/products');
  }
  
  if (activeModules.sales) {
    const salesRoutes = require('./sales/routes');
    app.use('/api/sales', salesRoutes);
    console.log('✅ Sales core loaded at /api/sales');
  }
  
  console.log('🎛️ Core modules initialized');
}

module.exports = { initializeCore };
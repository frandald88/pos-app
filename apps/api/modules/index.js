// 📁 /backend/modules/index.js
// ✅ COPIAR Y PEGAR ESTE ARCHIVO COMPLETO

const express = require('express');
const { getActiveModules } = require('../config/modules');

function initializeModules(app) {
  const activeModules = getActiveModules();
  const loadedModules = [];
  
  // 🧩 Cargar módulos opcionales (solo si están activos)
  if (activeModules.empleados) {
    const employeeRoutes = require('./empleados/routes');
    app.use('/api/employees', employeeRoutes);
    loadedModules.push('empleados');
  }
  
  if (activeModules.asistencia) {
    const attendanceRoutes = require('./asistencia/routes');
    app.use('/api/attendance', attendanceRoutes);
    loadedModules.push('asistencia');
  }
  
  if (activeModules.vacaciones) {
    const vacationsRoutes = require('./vacaciones/routes');
    app.use('/api/vacations', vacationsRoutes);
    loadedModules.push('vacaciones');
  }
  
  if (activeModules.reportes) {
    const reportRoutes = require('./reportes/routes');
    app.use('/api/report', reportRoutes);
    loadedModules.push('reportes');
  }
  
  if (activeModules.delivery) {
    const ordersRoutes = require('./delivery/routes');
    app.use('/api/orders', ordersRoutes);
    loadedModules.push('delivery');
  }
  
  if (activeModules.clientes) {
    const clienteRoutes = require('./clientes/routes');
    app.use('/api/clientes', clienteRoutes);
    loadedModules.push('clientes');
  }
  
  if (activeModules.gastos) {
    const expensesRoutes = require('./gastos/routes');
    app.use('/api/expenses', expensesRoutes);
    loadedModules.push('gastos');
  }
  
  if (activeModules.caja) {
    const cajaRoutes = require('./caja/routes');
    app.use('/api/caja', cajaRoutes);
    loadedModules.push('caja');
  }
  
  if (activeModules.devoluciones) {
    const returnsRoutes = require('./devoluciones/routes');
    app.use('/api/returns', returnsRoutes);
    loadedModules.push('devoluciones');
  }
  
  if (loadedModules.length > 0) {
    console.log('🧩 Optional modules loaded:', loadedModules.join(', '));
  } else {
    console.log('🧩 No optional modules enabled');
  }
}

module.exports = { initializeModules };
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generar token para testing
const payload = {
  id: '507f1f77bcf86cd799439011', // ID ficticio
  role: 'admin'
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

console.log('🎫 TOKEN GENERADO PARA TESTING:');
console.log('=' .repeat(50));
console.log(token);
console.log('=' .repeat(50));
console.log('');
console.log('📋 CÓMO USAR EN POSTMAN:');
console.log('1. Ve a Headers');
console.log('2. Agrega: Authorization: Bearer ' + token);
console.log('');
console.log('⏰ Expira en: 24 horas');
console.log('👤 Role: admin');
console.log('🆔 User ID: 507f1f77bcf86cd799439011 (ficticio)');
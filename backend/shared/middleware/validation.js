// 📁 /backend/shared/middleware/validation.js
// ✅ Middleware de validación

const { validationErrorResponse } = require('../utils/responseHelper');

const validateRequired = (fields) => {
  return (req, res, next) => {
    const errors = [];
    
    fields.forEach(field => {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        errors.push(`${field} es requerido`);
      }
    });
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    next();
  };
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationErrorResponse(res, ['Email inválido']);
    }
  }
  
  next();
};

const validatePhone = (req, res, next) => {
  const { telefono } = req.body;
  
  if (telefono) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(telefono)) {
      return validationErrorResponse(res, ['Teléfono debe tener 10 dígitos']);
    }
  }
  
  next();
};

const validatePositiveNumber = (field) => {
  return (req, res, next) => {
    const value = req.body[field];
    
    if (value !== undefined) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return validationErrorResponse(res, [`${field} debe ser un número positivo`]);
      }
    }
    
    next();
  };
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePositiveNumber
};

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
app.use(express.json());

// Configurar rutas
const clientesRoutes = require('../../modules/clientes/routes');
app.use('/api/clientes', clientesRoutes);

const Cliente = require('../../modules/clientes/model');

// Mock de auth middleware
jest.mock('../../shared/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 'testUserId';
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

describe('Clientes Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/clientes', () => {
    it('should return all clientes', async () => {
      const mockClientes = [
        { _id: '1', nombre: 'Cliente 1', telefono: '1234567890' },
        { _id: '2', nombre: 'Cliente 2', telefono: '0987654321' }
      ];

      jest.spyOn(Cliente, 'find').mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockClientes)
      });

      const response = await request(app)
        .get('/api/clientes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientes).toHaveLength(2);
      expect(response.body.data.clientes[0].nombre).toBe('Cliente 1');
    });
  });

  describe('POST /api/clientes', () => {
    it('should create a new cliente', async () => {
      const newClienteData = {
        nombre: 'Nuevo Cliente',
        direccion: 'Nueva Dirección',
        telefono: '1234567890',
        email: 'nuevo@test.com'
      };

      jest.spyOn(Cliente, 'findOne').mockResolvedValue(null);

      jest.spyOn(Cliente.prototype, 'save').mockImplementation(function() {
        this._id = 'newId';
        return Promise.resolve(this);
      });

      const response = await request(app)
        .post('/api/clientes')
        .send(newClienteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cliente.nombre).toBe(newClienteData.nombre);
    });

    it('should return error for duplicate nombre', async () => {
      const duplicateData = {
        nombre: 'Cliente Existente',
        telefono: '1234567890'
      };

      jest.spyOn(Cliente, 'findOne').mockResolvedValue({
        _id: 'existingId',
        nombre: 'Cliente Existente'
      });

      const response = await request(app)
        .post('/api/clientes')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ya existe un cliente');
    });
  });
});

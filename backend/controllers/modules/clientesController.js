const Cliente = require('../../modules/clientes/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class ClientesController {
  // Obtener todos los clientes
  async getAll(req, res) {
    try {
      const { search, limit = 50 } = req.query;
      let filter = {};

      if (search) {
        filter = {
          $or: [
            { nombre: { $regex: search, $options: 'i' } },
            { primerApellido: { $regex: search, $options: 'i' } },
            { segundoApellido: { $regex: search, $options: 'i' } },
            { nombreCompleto: { $regex: search, $options: 'i' } },
            { telefono: { $regex: search, $options: 'i' } }
          ]
        };
      }

      const clientes = await Cliente.find(filter)
        .limit(parseInt(limit))
        .sort({ nombre: 1, primerApellido: 1 })
        .lean();

      return successResponse(res, {
        clientes,
        total: clientes.length
      }, 'Clientes obtenidos exitosamente');
    } catch (error) {
      console.error('Error en getAll clientes:', error);
      return errorResponse(res, 'Error al obtener clientes', 500);
    }
  }

  // Obtener cliente por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        return errorResponse(res, 'Cliente no encontrado', 404);
      }
      
      return successResponse(res, cliente, 'Cliente obtenido exitosamente');
    } catch (error) {
      console.error('Error en getById cliente:', error);
      return errorResponse(res, 'Error al obtener cliente', 500);
    }
  }

  // Crear cliente
  async create(req, res) {
    try {
      const { nombre, primerApellido, segundoApellido, direccion, telefono, email } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre del cliente es requerido', 400);
      }

      // ⭐ Construir nombreCompleto para búsquedas
      const nombreCompleto = `${nombre.trim()} ${(primerApellido || '').trim()} ${(segundoApellido || '').trim()}`.trim();

      // ⭐ Crear cliente - MongoDB manejará la validación de duplicados vía índice único
      const cliente = new Cliente({
        nombre: nombre.trim(),
        primerApellido: (primerApellido || '').trim(),
        segundoApellido: (segundoApellido || '').trim(),
        nombreCompleto: nombreCompleto,
        direccion: direccion?.trim(),
        telefono: telefono?.trim(),
        email: email?.trim()
      });

      await cliente.save();
      console.log('✅ Cliente creado:', cliente);
      return successResponse(res, { cliente }, 'Cliente creado exitosamente', 201);
    } catch (error) {
      console.error('❌ Error en create cliente:', error);

      // ⭐ Manejar error de índice único (código 11000)
      if (error.code === 11000) {
        // Extraer información del campo duplicado si está disponible
        const duplicateKey = error.keyValue || {};
        console.log('🔍 Cliente duplicado:', duplicateKey);
        return errorResponse(res, 'Ya existe un cliente con ese nombre completo', 400);
      }

      // ⭐ Manejar errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return errorResponse(res, messages.join(', '), 400);
      }

      return errorResponse(res, 'Error al crear cliente', 500);
    }
  }

  // Actualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, primerApellido, segundoApellido, direccion, telefono, email } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre del cliente es requerido', 400);
      }

      const clienteExistente = await Cliente.findById(id);
      if (!clienteExistente) {
        return errorResponse(res, 'Cliente no encontrado', 404);
      }

      // ⭐ Construir nombreCompleto
      const nombreCompleto = `${nombre.trim()} ${(primerApellido || '').trim()} ${(segundoApellido || '').trim()}`.trim();

      // ⭐ Actualizar - MongoDB manejará la validación de duplicados vía índice único
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        id,
        {
          nombre: nombre.trim(),
          primerApellido: (primerApellido || '').trim(),
          segundoApellido: (segundoApellido || '').trim(),
          nombreCompleto: nombreCompleto,
          direccion: direccion?.trim(),
          telefono: telefono?.trim(),
          email: email?.trim()
        },
        { new: true, runValidators: true }
      );

      return successResponse(res, { cliente: clienteActualizado }, 'Cliente actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error en update cliente:', error);

      // ⭐ Manejar error de índice único (código 11000)
      if (error.code === 11000) {
        const duplicateKey = error.keyValue || {};
        console.log('🔍 Cliente duplicado:', duplicateKey);
        return errorResponse(res, 'Ya existe otro cliente con ese nombre completo', 400);
      }

      // ⭐ Manejar errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return errorResponse(res, messages.join(', '), 400);
      }

      return errorResponse(res, 'Error al actualizar cliente', 500);
    }
  }

  // Eliminar cliente
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        return errorResponse(res, 'Cliente no encontrado', 404);
      }
      
      // Aquí podrías verificar si tiene ventas asociadas
      // const Sale = require('../../core/sales/model');
      // const ventasAsociadas = await Sale.findOne({ cliente: id });
      // if (ventasAsociadas) {
      //   return errorResponse(res, 'No se puede eliminar el cliente porque tiene ventas asociadas', 400);
      // }
      
      await Cliente.findByIdAndDelete(id);
      
      return successResponse(res, { 
        cliente: { _id: id, nombre: cliente.nombre }
      }, 'Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error en delete cliente:', error);
      return errorResponse(res, 'Error al eliminar cliente', 500);
    }
  }

  // Buscar clientes (para autocomplete)
  async search(req, res) {
    try {
      const { term } = req.params;
      const { limit = 10 } = req.query;

      if (!term || term.length < 2) {
        return errorResponse(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const clientes = await Cliente.find({
        $or: [
          { nombre: { $regex: term, $options: 'i' } },
          { primerApellido: { $regex: term, $options: 'i' } },
          { segundoApellido: { $regex: term, $options: 'i' } },
          { nombreCompleto: { $regex: term, $options: 'i' } },
          { telefono: { $regex: term, $options: 'i' } }
        ]
      })
      .select('_id nombre primerApellido segundoApellido nombreCompleto telefono')
      .limit(parseInt(limit))
      .sort({ nombre: 1, primerApellido: 1 })
      .lean();

      return successResponse(res, clientes, 'Búsqueda completada');
    } catch (error) {
      console.error('Error en search clientes:', error);
      return errorResponse(res, 'Error en búsqueda de clientes', 500);
    }
  }
}

module.exports = new ClientesController();
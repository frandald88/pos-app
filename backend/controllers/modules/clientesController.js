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
            { telefono: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      const clientes = await Cliente.find(filter)
        .limit(parseInt(limit))
        .sort({ nombre: 1 })
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
      const { nombre, direccion, telefono, email } = req.body;
      
      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre del cliente es requerido', 400);
      }
      
      // Verificar duplicado
      const existingCliente = await Cliente.findOne({ nombre: nombre.trim() });
      if (existingCliente) {
        return errorResponse(res, 'Ya existe un cliente con ese nombre', 400);
      }
      
      const cliente = new Cliente({
        nombre: nombre.trim(),
        direccion: direccion?.trim(),
        telefono: telefono?.trim(),
        email: email?.trim()
      });
      
      await cliente.save();
      console.log('Cliente que se devolverá:', cliente);
      return successResponse(res, { cliente }, 'Cliente creado exitosamente', 201);
    } catch (error) {
      console.error('Error en create cliente:', error);
      return errorResponse(res, 'Error al crear cliente', 500);
    }
  }

  // Actualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, direccion, telefono, email } = req.body;
      
      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre del cliente es requerido', 400);
      }
      
      const clienteExistente = await Cliente.findById(id);
      if (!clienteExistente) {
        return errorResponse(res, 'Cliente no encontrado', 404);
      }
      
      // Verificar duplicado (excluyendo el actual)
      const nombreDuplicado = await Cliente.findOne({ 
        nombre: nombre.trim(),
        _id: { $ne: id }
      });
      
      if (nombreDuplicado) {
        return errorResponse(res, 'Ya existe otro cliente con ese nombre', 400);
      }
      
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        id, 
        {
          nombre: nombre.trim(),
          direccion: direccion?.trim(),
          telefono: telefono?.trim(),
          email: email?.trim()
        },
        { new: true, runValidators: true }
      );
      
      return successResponse(res, { cliente: clienteActualizado }, 'Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error en update cliente:', error);
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
          { telefono: { $regex: term, $options: 'i' } }
        ]
      })
      .select('_id nombre telefono')
      .limit(parseInt(limit))
      .sort({ nombre: 1 })
      .lean();
      
      return successResponse(res, clientes, 'Búsqueda completada');
    } catch (error) {
      console.error('Error en search clientes:', error);
      return errorResponse(res, 'Error en búsqueda de clientes', 500);
    }
  }
}

module.exports = new ClientesController();
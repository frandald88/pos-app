const Table = require('./model');
const Tenant = require('../tenants/model');
const Account = require('../accounts/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class TablesController {
  // Crear nueva mesa
  async create(req, res) {
    try {
      const tenantId = req.tenantId;
      const { tiendaId, number, section, capacity, position, notes } = req.body;

      // Validaciones
      if (!tiendaId || !number) {
        return errorResponse(res, 'TiendaId y número de mesa son requeridos', 400);
      }

      // Verificar que el tenant es tipo restaurant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      if (tenant.businessType !== 'restaurant') {
        return errorResponse(res, 'Esta funcionalidad solo está disponible para restaurants', 403);
      }

      // Verificar límite de mesas según el plan
      const currentTablesCount = await Table.countDocuments({ tenantId, isActive: true });
      const maxTables = tenant.limits.maxTables;

      if (maxTables !== -1 && currentTablesCount >= maxTables) {
        return errorResponse(res, `Has alcanzado el límite de ${maxTables} mesas para tu plan`, 403);
      }

      // Verificar que no exista otra mesa con el mismo número en la misma tienda
      const existingTable = await Table.findOne({
        tenantId,
        tiendaId,
        number,
        isActive: true
      });

      if (existingTable) {
        return errorResponse(res, `Ya existe una mesa con el número "${number}" en esta tienda`, 400);
      }

      // Crear mesa
      const table = new Table({
        tenantId,
        tiendaId,
        number,
        section: section || 'General',
        capacity: capacity || 4,
        position,
        notes,
        status: 'available',
        isActive: true
      });

      await table.save();

      return successResponse(res, { table }, 'Mesa creada exitosamente', 201);
    } catch (error) {
      console.error('Error creando mesa:', error);
      return errorResponse(res, 'Error al crear mesa', 500);
    }
  }

  // Listar mesas
  async getAll(req, res) {
    try {
      const tenantId = req.tenantId;
      const { tiendaId, status, section } = req.query;

      // Construir filtro
      const filter = { tenantId, isActive: true };

      if (tiendaId) {
        filter.tiendaId = tiendaId;
      }

      if (status) {
        filter.status = status;
      }

      if (section) {
        filter.section = section;
      }

      // Obtener mesas con cuenta actual poblada
      const tables = await Table.find(filter)
        .populate('currentAccount', 'folio status subtotal total')
        .sort({ section: 1, number: 1 });

      // Obtener estadísticas
      const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        reserved: tables.filter(t => t.status === 'reserved').length,
        cleaning: tables.filter(t => t.status === 'cleaning').length
      };

      return successResponse(res, { tables, stats });
    } catch (error) {
      console.error('Error obteniendo mesas:', error);
      return errorResponse(res, 'Error al obtener mesas', 500);
    }
  }

  // Obtener mesa por ID
  async getById(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const table = await Table.findOne({ _id: id, tenantId })
        .populate('currentAccount')
        .populate('tiendaId', 'nombre direccion');

      if (!table) {
        return errorResponse(res, 'Mesa no encontrada', 404);
      }

      return successResponse(res, { table });
    } catch (error) {
      console.error('Error obteniendo mesa:', error);
      return errorResponse(res, 'Error al obtener mesa', 500);
    }
  }

  // Actualizar mesa
  async update(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { number, section, capacity, position, notes } = req.body;

      const table = await Table.findOne({ _id: id, tenantId });

      if (!table) {
        return errorResponse(res, 'Mesa no encontrada', 404);
      }

      // Si está cambiando el número, verificar que no exista
      if (number && number !== table.number) {
        const existingTable = await Table.findOne({
          tenantId,
          tiendaId: table.tiendaId,
          number,
          isActive: true,
          _id: { $ne: id }
        });

        if (existingTable) {
          return errorResponse(res, `Ya existe una mesa con el número "${number}" en esta tienda`, 400);
        }

        table.number = number;
      }

      // Actualizar campos
      if (section !== undefined) table.section = section;
      if (capacity !== undefined) table.capacity = capacity;
      if (position !== undefined) table.position = position;
      if (notes !== undefined) table.notes = notes;

      await table.save();

      return successResponse(res, { table }, 'Mesa actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando mesa:', error);
      return errorResponse(res, 'Error al actualizar mesa', 500);
    }
  }

  // Cambiar estado de mesa
  async changeStatus(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Estado inválido', 400);
      }

      const table = await Table.findOne({ _id: id, tenantId });

      if (!table) {
        return errorResponse(res, 'Mesa no encontrada', 404);
      }

      // Si está ocupada, no permitir cambiar a otro estado manualmente
      if (table.status === 'occupied' && status !== 'cleaning') {
        return errorResponse(res, 'No puedes cambiar el estado de una mesa ocupada. Cierra la cuenta primero.', 400);
      }

      // Usar métodos helper según el estado
      switch (status) {
        case 'available':
          await table.release();
          break;
        case 'reserved':
          await table.reserve();
          break;
        case 'cleaning':
          await table.setForCleaning();
          break;
        default:
          table.status = status;
          await table.save();
      }

      return successResponse(res, { table }, `Estado cambiado a: ${status}`);
    } catch (error) {
      console.error('Error cambiando estado de mesa:', error);
      return errorResponse(res, 'Error al cambiar estado', 500);
    }
  }

  // Eliminar mesa (soft delete)
  async delete(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const table = await Table.findOne({ _id: id, tenantId });

      if (!table) {
        return errorResponse(res, 'Mesa no encontrada', 404);
      }

      // Verificar que no esté ocupada
      if (table.status === 'occupied') {
        return errorResponse(res, 'No puedes eliminar una mesa ocupada', 400);
      }

      // Verificar que no tenga cuenta activa
      if (table.currentAccount) {
        const account = await Account.findById(table.currentAccount);
        if (account && ['open', 'closed_pending', 'split_pending'].includes(account.status)) {
          return errorResponse(res, 'No puedes eliminar una mesa con cuenta activa', 400);
        }
      }

      // Soft delete
      table.isActive = false;
      await table.save();

      return successResponse(res, { table }, 'Mesa eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando mesa:', error);
      return errorResponse(res, 'Error al eliminar mesa', 500);
    }
  }

  // Obtener secciones únicas
  async getSections(req, res) {
    try {
      const tenantId = req.tenantId;
      const { tiendaId } = req.query;

      const filter = { tenantId, isActive: true };
      if (tiendaId) {
        filter.tiendaId = tiendaId;
      }

      const sections = await Table.distinct('section', filter);

      return successResponse(res, { sections: sections.filter(s => s) }); // Filtrar nulls
    } catch (error) {
      console.error('Error obteniendo secciones:', error);
      return errorResponse(res, 'Error al obtener secciones', 500);
    }
  }
}

module.exports = new TablesController();

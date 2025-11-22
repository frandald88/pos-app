const Schedule = require('../../modules/schedules/model');
const User = require('../../core/users/model');

class SchedulesController {

  // ✅ Crear plantilla de horario (reutilizable)
  async createTemplate(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { name, schedule, defaultTolerance, notes, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'El nombre de la plantilla es requerido' });
      }
      
      const template = new Schedule({
        tenantId: req.tenantId, // Asignar tenant
        name, // Nombre de la plantilla
        employee: null, // Sin empleado específico
        tienda: null, // Sin tienda específica
        schedule: schedule || undefined,
        defaultTolerance: defaultTolerance || 15,
        notes,
        description,
        isTemplate: true, // ✅ NUEVO: Marca como plantilla
        isActive: true
      });
      
      await template.save();
      
      res.status(201).json(template);
    } catch (err) {
      console.error('Error creando plantilla:', err);
      res.status(500).json({ message: 'Error al crear plantilla', error: err.message });
    }
  }

  // ✅ Obtener plantillas disponibles
  async getTemplates(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const templates = await Schedule.find({
        tenantId: req.tenantId, // Filtrar por tenant
        isTemplate: true,
        isActive: true
      }).sort({ name: 1 });
      
      res.json(templates);
    } catch (err) {
      console.error('Error obteniendo plantillas:', err);
      res.status(500).json({ message: 'Error al obtener plantillas', error: err.message });
    }
  }

  // ✅ Asignar horario a empleado (puede ser desde plantilla)
  async assignSchedule(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employeeId, templateId, customSchedule } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: 'EmployeeId es requerido' });
      }
      
      // Verificar que el empleado existe
      const user = await User.findOne({ _id: employeeId, tenantId: req.tenantId });
      if (!user) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }

      if (!user.tienda) {
        return res.status(400).json({ message: 'El empleado no tiene tienda asignada' });
      }

      // Desactivar horario actual si existe
      await Schedule.updateMany(
        { tenantId: req.tenantId, employee: employeeId, isActive: true, isTemplate: false },
        { isActive: false }
      );

      let scheduleData;

      if (templateId) {
        // Usar plantilla existente
        const template = await Schedule.findOne({ _id: templateId, tenantId: req.tenantId });
        if (!template || !template.isTemplate) {
          return res.status(404).json({ message: 'Plantilla no encontrada' });
        }

        scheduleData = {
          tenantId: req.tenantId, // Asignar tenant
          employee: employeeId,
          tienda: user.tienda,
          schedule: template.schedule,
          defaultTolerance: template.defaultTolerance,
          notes: template.notes,
          templateUsed: templateId, // Referencia a la plantilla
          templateName: template.name,
          isTemplate: false
        };
      } else if (customSchedule) {
        // Horario personalizado
        scheduleData = {
          tenantId: req.tenantId, // Asignar tenant
          employee: employeeId,
          tienda: user.tienda,
          schedule: customSchedule.schedule,
          defaultTolerance: customSchedule.defaultTolerance || 15,
          notes: customSchedule.notes,
          isTemplate: false
        };
      } else {
        return res.status(400).json({ message: 'Se requiere templateId o customSchedule' });
      }
      
      const newSchedule = new Schedule(scheduleData);
      await newSchedule.save();
      
      const populatedSchedule = await Schedule.findOne({ _id: newSchedule._id, tenantId: req.tenantId })
        .populate('employee', 'username role')
        .populate('tienda', 'nombre');
      
      res.status(201).json(populatedSchedule);
    } catch (err) {
      console.error('Error asignando horario:', err);
      res.status(500).json({ message: 'Error al asignar horario', error: err.message });
    }
  }

  // ✅ Crear horario por defecto usando plantilla
  async assignDefaultSchedule(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employeeId } = req.params;
      const { templateId } = req.body;
      
      const user = await User.findOne({ _id: employeeId, tenantId: req.tenantId });
      if (!user) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }

      if (!user.tienda) {
        return res.status(400).json({ message: 'El empleado no tiene tienda asignada' });
      }

      // Desactivar horario actual
      await Schedule.updateMany(
        { tenantId: req.tenantId, employee: employeeId, isActive: true, isTemplate: false },
        { isActive: false }
      );

      let scheduleData;

      if (templateId) {
        const template = await Schedule.findOne({ _id: templateId, tenantId: req.tenantId });
        if (!template || !template.isTemplate) {
          return res.status(404).json({ message: 'Plantilla no encontrada' });
        }

        scheduleData = {
          tenantId: req.tenantId, // Asignar tenant
          employee: employeeId,
          tienda: user.tienda,
          schedule: template.schedule,
          defaultTolerance: template.defaultTolerance,
          notes: template.notes,
          templateUsed: templateId,
          templateName: template.name,
          isTemplate: false
        };
      } else {
        // Horario por defecto estándar
        scheduleData = {
          tenantId: req.tenantId, // Asignar tenant
          employee: employeeId,
          tienda: user.tienda,
          isTemplate: false
        };
      }
      
      const schedule = new Schedule(scheduleData);
      await schedule.save();
      
      const populatedSchedule = await Schedule.findById(schedule._id)
        .populate('employee', 'username role')
        .populate('tienda', 'nombre');
      
      res.status(201).json(populatedSchedule);
    } catch (err) {
      console.error('Error asignando horario por defecto:', err);
      res.status(500).json({ message: 'Error al asignar horario por defecto', error: err.message });
    }
  }

  // Obtener horario específico de un empleado
  async getEmployeeSchedule(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employeeId } = req.params;
      
      const schedule = await Schedule.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        employee: employeeId,
        isActive: true,
        isTemplate: false
      })
      .populate('employee', 'username role')
      .populate('tienda', 'nombre');
      
      if (!schedule) {
        return res.status(404).json({ message: 'No se encontró horario activo para este empleado' });
      }
      
      res.json(schedule);
    } catch (err) {
      console.error('Error obteniendo horario del empleado:', err);
      res.status(500).json({ message: 'Error al obtener horario', error: err.message });
    }
  }

  // Obtener mi horario (empleado actual)
  async getMySchedule(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const schedule = await Schedule.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        employee: req.userId,
        isActive: true,
        isTemplate: false
      })
      .populate('tienda', 'nombre');
      
      if (!schedule) {
        return res.status(404).json({ message: 'No tienes un horario asignado' });
      }
      
      // Agregar información del día actual
      const todaySchedule = schedule.getTodaySchedule();
      const isWorkdayToday = schedule.isWorkdayToday();
      const lateLimitToday = schedule.getLateLimitToday();
      
      res.json({
        ...schedule.toObject(),
        todayInfo: {
          dayOfWeek: new Date().getDay(),
          isWorkday: isWorkdayToday,
          todaySchedule,
          lateLimit: lateLimitToday
        }
      });
    } catch (err) {
      console.error('Error obteniendo mi horario:', err);
      res.status(500).json({ message: 'Error al obtener horario', error: err.message });
    }
  }

  // Verificar si un empleado debe trabajar hoy
  async checkWorkday(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employeeId } = req.params;
      
      const schedule = await Schedule.findOne({
        tenantId: req.tenantId, // Filtrar por tenant
        employee: employeeId,
        isActive: true,
        isTemplate: false
      });

      if (!schedule) {
        return res.json({
          hasSchedule: false,
          isWorkday: false,
          message: 'No se encontró horario asignado'
        });
      }
      
      const isWorkday = schedule.isWorkdayToday();
      const todaySchedule = schedule.getTodaySchedule();
      const lateLimit = schedule.getLateLimitToday();
      
      res.json({
        hasSchedule: true,
        isWorkday,
        todaySchedule,
        lateLimit,
        dayOfWeek: new Date().getDay(),
        templateUsed: schedule.templateName || 'Personalizado'
      });
    } catch (err) {
      console.error('Error verificando día laboral:', err);
      res.status(500).json({ message: 'Error al verificar día laboral', error: err.message });
    }
  }

  // ✅ Obtener todos los horarios (separados por tipo)
  async getAll(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employeeId, tiendaId, isActive, type = 'all', limit = 50 } = req.query;

      const filter = {
        tenantId: req.tenantId // Filtrar por tenant
      };
      if (employeeId) filter.employee = employeeId;
      if (tiendaId) filter.tienda = tiendaId;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      
      // Filtrar por tipo
      if (type === 'templates') {
        filter.isTemplate = true;
      } else if (type === 'assignments') {
        filter.isTemplate = false;
        filter.employee = { $ne: null };
      }
      
      const schedules = await Schedule.find(filter)
        .populate('employee', 'username role telefono')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      res.json(schedules);
    } catch (err) {
      console.error('Error obteniendo horarios:', err);
      res.status(500).json({ message: 'Error al obtener horarios', error: err.message });
    }
  }

  // ✅ Crear horario personalizado para empleado
  async create(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { employee, tienda, schedule, defaultTolerance, notes } = req.body;
      
      if (!employee || !tienda) {
        return res.status(400).json({ message: 'Employee y tienda son requeridos' });
      }
      
      // Verificar que el empleado existe
      const user = await User.findOne({ _id: employee, tenantId: req.tenantId });
      if (!user) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }

      // Desactivar horario actual
      await Schedule.updateMany(
        { tenantId: req.tenantId, employee, isActive: true, isTemplate: false },
        { isActive: false }
      );

      const newSchedule = new Schedule({
        tenantId: req.tenantId, // Asignar tenant
        employee,
        tienda,
        schedule: schedule || undefined,
        defaultTolerance: defaultTolerance || 15,
        notes,
        isTemplate: false
      });
      
      await newSchedule.save();
      
      const populatedSchedule = await Schedule.findOne({ _id: newSchedule._id, tenantId: req.tenantId })
        .populate('employee', 'username role')
        .populate('tienda', 'nombre');
      
      res.status(201).json(populatedSchedule);
    } catch (err) {
      console.error('Error creando horario:', err);
      res.status(500).json({ message: 'Error al crear horario', error: err.message });
    }
  }

  // ✅ MEJORADO: Actualizar horario (plantillas y asignaciones)
  async update(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { id } = req.params;
      const { schedule, defaultTolerance, notes, name, description, isActive } = req.body;
      
      const updateData = {};
      if (schedule !== undefined) updateData.schedule = schedule;
      if (defaultTolerance !== undefined) updateData.defaultTolerance = defaultTolerance;
      if (notes !== undefined) updateData.notes = notes;
      if (name !== undefined) updateData.name = name; // Para plantillas
      if (description !== undefined) updateData.description = description; // Para plantillas
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: id, tenantId: req.tenantId }, // Filtrar por tenant
        updateData,
        { new: true, runValidators: true }
      )
      .populate('employee', 'username role')
      .populate('tienda', 'nombre');
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: 'Horario no encontrado' });
      }
      
      res.json(updatedSchedule);
    } catch (err) {
      console.error('Error actualizando horario:', err);
      res.status(500).json({ message: 'Error al actualizar horario', error: err.message });
    }
  }

  // ✅ MEJORADO: Eliminar horario o plantilla
  async delete(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { id } = req.params;
      
      const schedule = await Schedule.findOne({ _id: id, tenantId: req.tenantId });
      if (!schedule) {
        return res.status(404).json({ message: 'Horario no encontrado' });
      }

      // Si es una plantilla, verificar que no esté siendo usada
      if (schedule.isTemplate) {
        const usageCount = await Schedule.countDocuments({
          tenantId: req.tenantId, // Filtrar por tenant
          templateUsed: id,
          isActive: true
        });

        if (usageCount > 0) {
          return res.status(400).json({
            message: `No se puede eliminar: esta plantilla está siendo usada por ${usageCount} empleado(s)`
          });
        }
      }

      await Schedule.findOneAndDelete({ _id: id, tenantId: req.tenantId });
      
      const type = schedule.isTemplate ? 'plantilla' : 'horario';
      res.json({ message: `${type} eliminado exitosamente` });
    } catch (err) {
      console.error('Error eliminando horario:', err);
      res.status(500).json({ message: 'Error al eliminar horario', error: err.message });
    }
  }
}

module.exports = new SchedulesController();
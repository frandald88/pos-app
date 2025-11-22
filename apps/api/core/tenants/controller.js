const Tenant = require('./model');
const User = require('../users/model');
const Tienda = require('../../modules/tiendas/model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const { validatePassword } = require('../../shared/utils/passwordValidation');

// Lista de subdomains reservados
const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'dashboard', 'panel', 'portal',
  'mail', 'email', 'smtp', 'pop', 'imap', 'ftp', 'cdn', 'static',
  'support', 'help', 'docs', 'documentation', 'blog', 'forum',
  'shop', 'store', 'cart', 'checkout', 'payment', 'billing',
  'account', 'login', 'register', 'signup', 'signin', 'auth',
  'status', 'health', 'monitor', 'metrics', 'analytics',
  'test', 'demo', 'sandbox', 'staging', 'dev', 'development'
];

class TenantsController {
  // ✅ NUEVO: Verificar disponibilidad de subdomain
  async checkSubdomain(req, res) {
    try {
      const { subdomain } = req.params;

      // Validar formato
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        return successResponse(res, {
          available: false,
          reason: 'El subdomain solo puede contener letras minúsculas, números y guiones'
        }, 'Subdomain validado');
      }

      // Validar longitud
      if (subdomain.length < 3 || subdomain.length > 30) {
        return successResponse(res, {
          available: false,
          reason: 'El subdomain debe tener entre 3 y 30 caracteres'
        }, 'Subdomain validado');
      }

      // Verificar si está reservado
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return successResponse(res, {
          available: false,
          reason: 'Este subdomain está reservado'
        }, 'Subdomain validado');
      }

      // Verificar si ya existe
      const existing = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
      if (existing) {
        return successResponse(res, {
          available: false,
          reason: 'Este subdomain ya está en uso'
        }, 'Subdomain validado');
      }

      return successResponse(res, {
        available: true,
        subdomain: subdomain.toLowerCase()
      }, 'Subdomain disponible');
    } catch (error) {
      console.error('Error verificando subdomain:', error);
      return errorResponse(res, 'Error al verificar subdomain', 500);
    }
  }

  // ✅ NUEVO: Registro completo (tenant + owner + tienda + JWT)
  async register(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        // Datos del negocio
        companyName,
        subdomain,
        // Datos del admin
        ownerName,
        ownerEmail,
        ownerPassword,
        // Plan (opcional, default: launch)
        plan = 'launch'
      } = req.body;

      // ========== VALIDACIONES ==========

      // Validar campos requeridos (solo los esenciales)
      if (!companyName || !subdomain || !ownerName || !ownerEmail || !ownerPassword) {
        await session.abortTransaction();
        return errorResponse(res, 'Todos los campos son requeridos: companyName, subdomain, ownerName, ownerEmail, ownerPassword', 400);
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ownerEmail)) {
        await session.abortTransaction();
        return errorResponse(res, 'El formato del email es inválido', 400);
      }

      // Validar formato de subdomain
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        await session.abortTransaction();
        return errorResponse(res, 'El subdomain solo puede contener letras minúsculas, números y guiones', 400);
      }

      // Validar longitud de subdomain
      if (subdomain.length < 3 || subdomain.length > 30) {
        await session.abortTransaction();
        return errorResponse(res, 'El subdomain debe tener entre 3 y 30 caracteres', 400);
      }

      // Verificar subdomain reservado
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        await session.abortTransaction();
        return errorResponse(res, 'Este subdomain está reservado', 400);
      }

      // Verificar subdomain duplicado
      const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
      if (existingTenant) {
        await session.abortTransaction();
        return errorResponse(res, 'El subdomain ya está en uso', 400);
      }

      // Verificar email duplicado
      const existingUser = await User.findOne({ email: ownerEmail });
      if (existingUser) {
        await session.abortTransaction();
        return errorResponse(res, 'El email ya está registrado', 400);
      }

      // Validar fortaleza de contraseña
      const passwordValidation = validatePassword(ownerPassword, {
        name: ownerName,
        email: ownerEmail
      });
      if (!passwordValidation.valid) {
        await session.abortTransaction();

        // Si hay sugerencias, incluirlas en el mensaje
        if (passwordValidation.suggestions && passwordValidation.suggestions.length > 0) {
          return errorResponse(res, passwordValidation.message, 400, {
            suggestions: passwordValidation.suggestions
          });
        }

        return errorResponse(res, passwordValidation.message, 400);
      }

      // ========== DEFINIR LÍMITES SEGÚN PLAN ==========

      const planLimits = {
        // Plan Lanzamiento - $1,249 por 3 meses
        launch: {
          maxUsers: 5,
          maxTiendas: 1,
          maxProducts: 500,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: false,
          maxTables: 10,
          maxWaiters: 5,
          maxOpenAccounts: 20
        },
        // Plan Basic Anual - $5,999/año
        basic: {
          maxUsers: 5,
          maxTiendas: 1,
          maxProducts: 500,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: false,
          maxTables: 10,
          maxWaiters: 5,
          maxOpenAccounts: 20
        },
        // Plan Pro Anual - $8,499/año
        pro: {
          maxUsers: 20,
          maxTiendas: 3,
          maxProducts: 2000,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: true,
          maxTables: 30,
          maxWaiters: 15,
          maxOpenAccounts: 50
        },
        // Plan Founder Lifetime - $9,999 (solo 15 disponibles)
        founder: {
          maxUsers: 8,
          maxTiendas: 2,
          maxProducts: 1000,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: false,
          maxTables: 15,
          maxWaiters: 8,
          maxOpenAccounts: 30
        },
        // Plan Enterprise - Contactar
        enterprise: {
          maxUsers: -1, // Ilimitado
          maxTiendas: -1, // Ilimitado
          maxProducts: -1, // Ilimitado
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: true,
          maxTables: -1,
          maxWaiters: -1,
          maxOpenAccounts: -1
        }
      };

      // ========== CREAR TENANT ==========

      const tenant = new Tenant({
        companyName: companyName.trim(),
        subdomain: subdomain.toLowerCase().trim(),
        owner: null, // Se asignará después de crear el usuario
        subscription: {
          plan,
          status: 'active',
          periodStart: new Date(),
          periodEnd: plan === 'launch'
            ? new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000) // 3 meses para launch
            : new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 meses para anuales
          isLifetime: plan === 'founder',
          billingCycle: plan === 'founder' ? 'lifetime' : (plan === 'launch' ? 'monthly' : 'annual')
        },
        limits: planLimits[plan],
        contact: {
          email: ownerEmail,
          phone: '', // Se configurará en onboarding
          address: '' // Se configurará en onboarding
        },
        isActive: true,
        metadata: {
          onboardingCompleted: false,
          onboardingCurrentStep: 0,
          onboardingStepsCompleted: [],
          onboardingSkippedSteps: [],
          totalUsers: 1,
          totalTiendas: 1, // Se creará una tienda inicial
          totalProducts: 0
        }
      });

      await tenant.save({ session });

      // ========== CREAR USUARIO OWNER ==========

      const ownerUser = new User({
        username: ownerName.trim(),
        password: ownerPassword, // Se hasheará por el pre-save hook
        email: ownerEmail,
        role: 'admin',
        tenantId: tenant._id,
        tienda: null, // Se asignará después de crear la tienda
        isActive: true
      });

      await ownerUser.save({ session });

      // ========== CREAR TIENDA INICIAL (con datos mínimos) ==========
      // La tienda se configurará completamente en el onboarding

      const tiendaInicial = new Tienda({
        tenantId: tenant._id,
        nombre: `${companyName} - Principal`,
        direccion: '', // Se configurará en onboarding
        telefono: '', // Se configurará en onboarding
        activa: true,
        ticketConfig: {
          nombreNegocio: companyName,
          mensajeInferior: '¡GRACIAS POR SU COMPRA!\nVuelva pronto'
        }
      });

      await tiendaInicial.save({ session });

      // ========== ACTUALIZAR REFERENCIAS ==========

      // Asignar owner al tenant
      tenant.owner = ownerUser._id;
      await tenant.save({ session });

      // NOTA: No asignamos tienda al owner porque es admin
      // Los admins pueden gestionar todas las tiendas del tenant
      // El campo tienda quedará como null para admins (por el pre-save hook)

      // ========== GENERAR JWT TOKEN ==========

      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
      const token = jwt.sign(
        {
          id: ownerUser._id,
          role: ownerUser.role,
          username: ownerUser.username,
          // Admin no tiene tienda asignada, puede acceder a todas
          tienda: ownerUser.role === 'admin' ? null : ownerUser.tienda,
          tenantId: tenant._id
        },
        jwtSecret,
        { expiresIn: '1d' }
      );

      // ========== COMMIT TRANSACCIÓN ==========

      await session.commitTransaction();
      session.endSession();

      // ========== RESPUESTA EXITOSA ==========

      return successResponse(res, {
        token,
        tenant: {
          _id: tenant._id,
          companyName: tenant.companyName,
          subdomain: tenant.subdomain,
          plan: tenant.subscription.plan,
          status: tenant.subscription.status,
          trialEndsAt: tenant.subscription.trialEndsAt
        },
        user: {
          _id: ownerUser._id,
          username: ownerUser.username,
          email: ownerUser.email,
          role: ownerUser.role
        },
        tienda: {
          _id: tiendaInicial._id,
          nombre: tiendaInicial.nombre
        }
      }, 'Registro completado exitosamente. ¡Bienvenido!', 201);

    } catch (error) {
      console.error('Error en registro:', error);

      // Rollback en caso de error
      await session.abortTransaction();
      session.endSession();

      // Manejar errores específicos
      if (error.code === 11000) {
        return errorResponse(res, 'El subdomain o email ya está en uso', 400);
      }

      return errorResponse(res, 'Error al completar el registro', 500);
    }
  }

  // Crear nuevo tenant
  async create(req, res) {
    try {
      const {
        companyName,
        subdomain,
        ownerEmail,
        ownerUsername,
        ownerPassword,
        plan = 'trial',
        contact
      } = req.body;

      // Validaciones
      if (!companyName || !subdomain) {
        return errorResponse(res, 'companyName y subdomain son requeridos', 400);
      }

      if (!ownerEmail || !ownerUsername || !ownerPassword) {
        return errorResponse(res, 'Datos del owner (email, username, password) son requeridos', 400);
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ownerEmail)) {
        return errorResponse(res, 'El formato del email es inválido', 400);
      }

      // Validar email en contact si se proporciona
      if (contact?.email && !emailRegex.test(contact.email)) {
        return errorResponse(res, 'El formato del email de contacto es inválido', 400);
      }

      // Verificar que subdomain no exista
      const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
      if (existingTenant) {
        return errorResponse(res, 'El subdomain ya está en uso', 400);
      }

      // Verificar que email no exista
      const existingUser = await User.findOne({ username: ownerEmail });
      if (existingUser) {
        return errorResponse(res, 'El email ya está registrado', 400);
      }

      // Definir límites según el plan
      const planLimits = {
        trial: {
          maxUsers: 3,
          maxTiendas: 1,
          maxProducts: 100,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: false
        },
        basic: {
          maxUsers: 5,
          maxTiendas: 1,
          maxProducts: 500,
          canUseDelivery: false,
          canUseReports: true,
          canUseMultiTienda: false
        },
        pro: {
          maxUsers: 20,
          maxTiendas: 3,
          maxProducts: 2000,
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: true
        },
        enterprise: {
          maxUsers: -1, // Ilimitado
          maxTiendas: -1, // Ilimitado
          maxProducts: -1, // Ilimitado
          canUseDelivery: true,
          canUseReports: true,
          canUseMultiTienda: true
        }
      };

      // Crear tenant primero (sin owner aún)
      const tenant = new Tenant({
        companyName: companyName.trim(),
        subdomain: subdomain.toLowerCase().trim(),
        owner: null, // Se asignará después de crear el usuario
        subscription: {
          plan,
          status: plan === 'trial' ? 'trialing' : 'active'
        },
        limits: planLimits[plan],
        contact: {
          email: ownerEmail,
          phone: contact?.phone || '',
          address: contact?.address || ''
        },
        isActive: true
      });

      // Crear usuario owner
      const ownerUser = new User({
        username: ownerUsername,
        password: ownerPassword, // Se hasheará por el pre-save hook del modelo
        email: ownerEmail,
        role: 'admin',
        tenantId: tenant._id,
        tienda: null, // Se asignará cuando cree su primera tienda
        isActive: true
      });

      await ownerUser.save();

      // Actualizar tenant con el owner
      tenant.owner = ownerUser._id;
      await tenant.save();

      // Incrementar contador
      tenant.metadata.totalUsers = 1;
      await tenant.save();

      return successResponse(res, {
        tenant: {
          _id: tenant._id,
          companyName: tenant.companyName,
          subdomain: tenant.subdomain,
          plan: tenant.subscription.plan,
          status: tenant.subscription.status,
          trialEndsAt: tenant.subscription.trialEndsAt
        },
        owner: {
          _id: ownerUser._id,
          username: ownerUser.username,
          email: ownerUser.email,
          role: ownerUser.role
        }
      }, 'Tenant creado exitosamente', 201);

    } catch (error) {
      console.error('Error creando tenant:', error);

      // Manejar error de subdomain duplicado
      if (error.code === 11000) {
        return errorResponse(res, 'El subdomain ya está en uso', 400);
      }

      return errorResponse(res, 'Error al crear tenant', 500);
    }
  }

  // Obtener tenant por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findById(id)
        .populate('owner', 'username email')
        .lean();

      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      return successResponse(res, tenant, 'Tenant obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo tenant:', error);
      return errorResponse(res, 'Error al obtener tenant', 500);
    }
  }

  // Listar todos los tenants (solo para super admin)
  async getAll(req, res) {
    try {
      const { status, plan, limit = 50 } = req.query;

      const filter = {};
      if (status) filter['subscription.status'] = status;
      if (plan) filter['subscription.plan'] = plan;

      const tenants = await Tenant.find(filter)
        .populate('owner', 'username email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return successResponse(res, {
        tenants,
        total: tenants.length
      }, 'Tenants obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo tenants:', error);
      return errorResponse(res, 'Error al obtener tenants', 500);
    }
  }

  // Actualizar tenant
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validar email si se está actualizando
      if (updates.contact?.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.contact.email)) {
          return errorResponse(res, 'El formato del email es inválido', 400);
        }
      }

      // Campos que no se pueden actualizar directamente
      delete updates.owner;
      delete updates.subdomain;
      delete updates._id;

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      return successResponse(res, tenant, 'Tenant actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando tenant:', error);
      return errorResponse(res, 'Error al actualizar tenant', 500);
    }
  }

  // Suspender tenant
  async suspend(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        {
          'subscription.status': 'suspended',
          isActive: false
        },
        { new: true }
      );

      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      return successResponse(res, tenant, 'Tenant suspendido exitosamente');
    } catch (error) {
      console.error('Error suspendiendo tenant:', error);
      return errorResponse(res, 'Error al suspender tenant', 500);
    }
  }

  // Reactivar tenant
  async reactivate(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        {
          'subscription.status': 'active',
          isActive: true
        },
        { new: true }
      );

      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      return successResponse(res, tenant, 'Tenant reactivado exitosamente');
    } catch (error) {
      console.error('Error reactivando tenant:', error);
      return errorResponse(res, 'Error al reactivar tenant', 500);
    }
  }

  // Obtener estadísticas del tenant actual
  async getStats(req, res) {
    try {
      const tenantId = req.tenantId;

      const tenant = await Tenant.findById(tenantId).lean();
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      return successResponse(res, {
        metadata: tenant.metadata,
        limits: tenant.limits,
        subscription: {
          plan: tenant.subscription.plan,
          status: tenant.subscription.status,
          trialEndsAt: tenant.subscription.trialEndsAt
        },
        usage: {
          users: `${tenant.metadata.totalUsers || 0}${tenant.limits.maxUsers > 0 ? `/${tenant.limits.maxUsers}` : ''}`,
          products: `${tenant.metadata.totalProducts || 0}${tenant.limits.maxProducts > 0 ? `/${tenant.limits.maxProducts}` : ''}`,
          tiendas: `${tenant.metadata.totalTiendas || 0}${tenant.limits.maxTiendas > 0 ? `/${tenant.limits.maxTiendas}` : ''}`
        }
      }, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return errorResponse(res, 'Error al obtener estadísticas', 500);
    }
  }

  // ========== MÉTODOS PARA PLAN FOUNDER ==========

  /**
   * Obtener información de slots de Founder disponibles
   */
  async getFounderSlots(req, res) {
    try {
      const FOUNDER_LIMIT = 15;

      // Contar cuántos founders ya existen
      const founderCount = await Tenant.countDocuments({
        'subscription.plan': 'founder'
      });

      const slotsAvailable = FOUNDER_LIMIT - founderCount;
      const isAvailable = slotsAvailable > 0;

      return successResponse(res, {
        total: FOUNDER_LIMIT,
        claimed: founderCount,
        available: slotsAvailable,
        isAvailable,
        percentage: Math.round((founderCount / FOUNDER_LIMIT) * 100)
      }, 'Información de slots Founder obtenida');

    } catch (error) {
      console.error('Error obteniendo slots founder:', error);
      return errorResponse(res, 'Error al obtener información de slots', 500);
    }
  }

  /**
   * Asignar número de founder al registrarse con plan founder
   */
  async assignFounderNumber() {
    try {
      const FOUNDER_LIMIT = 15;

      // Obtener el último número de founder asignado
      const lastFounder = await Tenant.findOne({
        'subscription.plan': 'founder',
        'subscription.founderNumber': { $ne: null }
      })
      .sort({ 'subscription.founderNumber': -1 })
      .select('subscription.founderNumber');

      const nextNumber = lastFounder?.subscription?.founderNumber
        ? lastFounder.subscription.founderNumber + 1
        : 1;

      // Verificar que no excedamos el límite
      if (nextNumber > FOUNDER_LIMIT) {
        return { success: false, message: 'Slots de Founder agotados' };
      }

      return { success: true, founderNumber: nextNumber };

    } catch (error) {
      console.error('Error asignando número founder:', error);
      return { success: false, message: 'Error al asignar número de founder' };
    }
  }

  /**
   * Actualizar plan de tenant (para upgrades/downgrades)
   */
  async upgradePlan(req, res) {
    try {
      const { tenantId } = req.params;
      const { newPlan, billingCycle } = req.body;

      // Validar plan
      const validPlans = ['launch', 'basic', 'pro', 'founder', 'enterprise'];
      if (!validPlans.includes(newPlan)) {
        return errorResponse(res, 'Plan inválido', 400);
      }

      // Si es founder, verificar disponibilidad
      if (newPlan === 'founder') {
        const founderAssignment = await this.assignFounderNumber();
        if (!founderAssignment.success) {
          return errorResponse(res, founderAssignment.message, 400);
        }
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Actualizar plan
      tenant.subscription.plan = newPlan;
      tenant.subscription.status = 'active';
      tenant.subscription.billingCycle = billingCycle || 'monthly';

      if (newPlan === 'founder') {
        const founderAssignment = await this.assignFounderNumber();
        tenant.subscription.isLifetime = true;
        tenant.subscription.founderNumber = founderAssignment.founderNumber;
        tenant.subscription.billingCycle = 'lifetime';
      }

      // El middleware pre-save actualizará los límites automáticamente
      await tenant.save();

      return successResponse(res, {
        plan: tenant.subscription.plan,
        founderNumber: tenant.subscription.founderNumber,
        limits: tenant.limits
      }, 'Plan actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando plan:', error);
      return errorResponse(res, 'Error al actualizar plan', 500);
    }
  }
}

module.exports = new TenantsController();

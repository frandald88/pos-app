const Tenant = require('../../core/tenants/model');
const Tienda = require('../../modules/tiendas/model');
const Product = require('../../core/products/model');
const User = require('../../core/users/model');
const EmployeeHistory = require('../../modules/empleados/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const { COUNTRY_CODES, validateInternationalPhone } = require('../../shared/utils/phoneValidation');
const emailService = require('../../shared/services/emailService');

// Datos de ejemplo para productos - Supermercado/Frutería
const SAMPLE_PRODUCTS_SUPERMARKET = [
  {
    name: 'Coca-Cola 600ml',
    sku: '1',
    barcode: '7501055300006',
    price: 15,
    cost: 10,
    stock: 100,
    category: 'Bebidas',
    unit: 'Pieza'
  },
  {
    name: 'Agua Bonafont 1L',
    sku: '2',
    barcode: '7501055310005',
    price: 10,
    cost: 7,
    stock: 150,
    category: 'Bebidas',
    unit: 'Pieza'
  },
  {
    name: 'Sabritas Original 45g',
    sku: '3',
    barcode: '7501055320004',
    price: 18,
    cost: 12,
    stock: 80,
    category: 'Botanas',
    unit: 'Pieza'
  },
  {
    name: 'Pan Bimbo Blanco',
    sku: '4',
    barcode: '7501055330003',
    price: 35,
    cost: 25,
    stock: 50,
    category: 'Panadería',
    unit: 'Pieza'
  },
  {
    name: 'Leche Lala 1L',
    sku: '5',
    barcode: '7501055340002',
    price: 22,
    cost: 17,
    stock: 60,
    category: 'Lácteos',
    unit: 'Litro'
  },
  {
    name: 'Huevo Bachoco 12 pzas',
    sku: '6',
    barcode: '7501055350001',
    price: 45,
    cost: 35,
    stock: 40,
    category: 'Abarrotes',
    unit: 'Paquete'
  },
  {
    name: 'Aceite 123 900ml',
    sku: '7',
    barcode: '7501055360000',
    price: 38,
    cost: 30,
    stock: 30,
    category: 'Abarrotes',
    unit: 'Botella'
  },
  {
    name: 'Arroz Morelos 1kg',
    sku: '8',
    barcode: '7501055370009',
    price: 25,
    cost: 18,
    stock: 70,
    category: 'Abarrotes',
    unit: 'Kilogramo'
  }
];

// Datos de ejemplo para productos - Restaurant/Dark Kitchen
const SAMPLE_PRODUCTS_RESTAURANT = [
  {
    name: 'Boneless',
    sku: '1',
    barcode: '',
    price: 129,
    cost: 65,
    stock: 999,
    category: 'Alitas',
    unit: 'Orden'
  },
  {
    name: 'Hamburguesa Clásica',
    sku: '2',
    barcode: '',
    price: 99,
    cost: 45,
    stock: 999,
    category: 'Hamburguesas',
    unit: 'Pieza'
  },
  {
    name: 'Poke Bowl',
    sku: '3',
    barcode: '',
    price: 159,
    cost: 75,
    stock: 999,
    category: 'Bowls',
    unit: 'Orden'
  },
  {
    name: 'Burro Percherón Mixto',
    sku: '4',
    barcode: '',
    price: 89,
    cost: 40,
    stock: 999,
    category: 'Burritos',
    unit: 'Pieza'
  },
  {
    name: 'Ensalada Caesar',
    sku: '5',
    barcode: '',
    price: 89,
    cost: 35,
    stock: 999,
    category: 'Ensaladas',
    unit: 'Orden'
  },
  {
    name: 'Wrap Pollo Chipotle',
    sku: '6',
    barcode: '',
    price: 79,
    cost: 35,
    stock: 999,
    category: 'Wraps',
    unit: 'Pieza'
  },
  {
    name: 'Pizza de Pepperoni',
    sku: '7',
    barcode: '',
    price: 169,
    cost: 70,
    stock: 999,
    category: 'Pizzas',
    unit: 'Pieza'
  },
  {
    name: 'Sushi California de Camarón',
    sku: '8',
    barcode: '',
    price: 149,
    cost: 65,
    stock: 999,
    category: 'Sushi',
    unit: 'Rollo'
  }
];

// Función helper para obtener productos según tipo de negocio
const getSampleProductsByBusinessType = (businessType) => {
  if (businessType === 'restaurant' || businessType === 'dark_kitchen') {
    return SAMPLE_PRODUCTS_RESTAURANT;
  }
  return SAMPLE_PRODUCTS_SUPERMARKET;
};

class OnboardingController {
  // Obtener estado del onboarding con info de tienda y tenant
  async getStatus(req, res) {
    try {
      const tenantId = req.tenantId;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Obtener la tienda principal del tenant
      const tienda = await Tienda.findOne({ tenantId: tenantId }).sort({ createdAt: 1 });

      return successResponse(res, {
        // Estado del onboarding
        completed: tenant.metadata.onboardingCompleted,
        completedAt: tenant.metadata.onboardingCompletedAt,
        currentStep: tenant.metadata.onboardingCurrentStep || 0,
        stepsCompleted: tenant.metadata.onboardingStepsCompleted || [],
        skippedSteps: tenant.metadata.onboardingSkippedSteps || [],
        firstSaleMade: tenant.metadata.firstSaleMade,
        teamInvited: tenant.metadata.teamInvited,
        // Info del tenant y tienda para pre-poblar formularios
        tenant: {
          companyName: tenant.companyName,
          subdomain: tenant.subdomain
        },
        tienda: tienda ? {
          _id: tienda._id,
          nombre: tienda.nombre,
          direccion: tienda.direccion,
          telefono: tienda.telefono,
          nombreNegocio: tienda.ticketConfig?.nombreNegocio || '',
          rfc: tienda.ticketConfig?.rfc || ''
        } : null
      }, 'Estado de onboarding obtenido');
    } catch (error) {
      console.error('Error obteniendo estado de onboarding:', error);
      return errorResponse(res, 'Error al obtener estado de onboarding', 500);
    }
  }

  // Actualizar progreso del onboarding
  async updateProgress(req, res) {
    try {
      const tenantId = req.tenantId;
      const { currentStep, completedSteps, skippedSteps } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Actualizar solo los campos proporcionados
      if (currentStep !== undefined) {
        tenant.metadata.onboardingCurrentStep = currentStep;
      }
      if (completedSteps !== undefined) {
        tenant.metadata.onboardingStepsCompleted = completedSteps;
      }
      if (skippedSteps !== undefined) {
        tenant.metadata.onboardingSkippedSteps = skippedSteps;
      }

      await tenant.save();

      return successResponse(res, {
        currentStep: tenant.metadata.onboardingCurrentStep,
        stepsCompleted: tenant.metadata.onboardingStepsCompleted,
        skippedSteps: tenant.metadata.onboardingSkippedSteps
      }, 'Progreso actualizado');
    } catch (error) {
      console.error('Error actualizando progreso:', error);
      return errorResponse(res, 'Error al actualizar progreso', 500);
    }
  }

  // Completar onboarding
  async complete(req, res) {
    try {
      const tenantId = req.tenantId;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      if (tenant.metadata.onboardingCompleted) {
        return errorResponse(res, 'Onboarding ya completado', 400);
      }

      tenant.metadata.onboardingCompleted = true;
      tenant.metadata.onboardingCompletedAt = new Date();
      await tenant.save();

      return successResponse(res, {
        completed: true,
        completedAt: tenant.metadata.onboardingCompletedAt
      }, '¡Onboarding completado exitosamente!');
    } catch (error) {
      console.error('Error completando onboarding:', error);
      return errorResponse(res, 'Error al completar onboarding', 500);
    }
  }

  // Reiniciar onboarding (para testing o re-ver el tour)
  async reset(req, res) {
    try {
      const tenantId = req.tenantId;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Resetear todo el onboarding
      tenant.metadata.onboardingCompleted = false;
      tenant.metadata.onboardingCompletedAt = null;
      tenant.metadata.onboardingCurrentStep = 0;
      tenant.metadata.onboardingStepsCompleted = [];
      tenant.metadata.onboardingSkippedSteps = [];

      await tenant.save();

      return successResponse(res, {
        completed: false,
        currentStep: 0
      }, 'Onboarding reiniciado');
    } catch (error) {
      console.error('Error reiniciando onboarding:', error);
      return errorResponse(res, 'Error al reiniciar onboarding', 500);
    }
  }

  // Obtener productos de ejemplo
  async getSampleProducts(req, res) {
    try {
      const tenantId = req.tenantId;
      const tenant = await Tenant.findById(tenantId);
      const businessType = tenant?.businessType || 'supermarket';
      const products = getSampleProductsByBusinessType(businessType);

      return successResponse(res, {
        products
      }, 'Productos de ejemplo obtenidos');
    } catch (error) {
      console.error('Error obteniendo productos de ejemplo:', error);
      return errorResponse(res, 'Error al obtener productos de ejemplo', 500);
    }
  }

  // Cargar productos de ejemplo
  async loadSampleProducts(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Obtener usuario
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let tienda;

      // Si es admin, puede usar cualquier tienda del tenant
      if (user.role === 'admin') {
        // Buscar la primera tienda activa del tenant
        tienda = await Tienda.findOne({ tenantId: tenantId, activa: true });

        if (!tienda) {
          return errorResponse(res, 'No se encontró una tienda activa para este tenant', 404);
        }
      } else {
        // Usuarios no-admin DEBEN tener tienda asignada
        if (!user.tienda) {
          return errorResponse(res, 'Usuario no tiene tienda asignada', 400);
        }

        tienda = await Tienda.findById(user.tienda);
        if (!tienda) {
          return errorResponse(res, 'Tienda no encontrada', 404);
        }
      }

      // Obtener productos según el tipo de negocio
      const sampleProducts = getSampleProductsByBusinessType(tenant.businessType);

      // Crear productos de ejemplo
      const productsToCreate = sampleProducts.map(product => ({
        ...product,
        tenantId: tenantId,
        tienda: tienda._id,
        isActive: true
      }));

      const createdProducts = await Product.insertMany(productsToCreate);

      // Actualizar contador de productos
      tenant.metadata.totalProducts = (tenant.metadata.totalProducts || 0) + createdProducts.length;
      await tenant.save();

      return successResponse(res, {
        count: createdProducts.length,
        products: createdProducts
      }, `${createdProducts.length} productos de ejemplo agregados exitosamente`);
    } catch (error) {
      console.error('Error cargando productos de ejemplo:', error);
      return errorResponse(res, 'Error al cargar productos de ejemplo', 500);
    }
  }

  // Obtener códigos de área de países
  async getCountryCodes(req, res) {
    try {
      return successResponse(res, {
        countryCodes: COUNTRY_CODES
      }, 'Códigos de área obtenidos');
    } catch (error) {
      console.error('Error obteniendo códigos de área:', error);
      return errorResponse(res, 'Error al obtener códigos de área', 500);
    }
  }

  // Actualizar configuración de tienda (Paso 1 del onboarding)
  async updateStoreConfig(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { nombre, direccion, telefono, nombreNegocio, rfc } = req.body;

      if (!nombre) {
        return errorResponse(res, 'El nombre de la tienda es requerido', 400);
      }

      // Validar teléfono si se proporciona
      if (telefono) {
        const phoneValidation = validateInternationalPhone(telefono);
        if (!phoneValidation.valid) {
          return errorResponse(res, phoneValidation.message, 400);
        }
      }

      // Obtener usuario
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let tienda;

      // Si es admin, actualizar la primera tienda del tenant o crearla
      if (user.role === 'admin') {
        // Buscar si ya existe una tienda para este tenant
        tienda = await Tienda.findOne({ tenantId: tenantId });

        if (tienda) {
          // Actualizar tienda existente
          tienda.nombre = nombre;
          tienda.direccion = direccion || '';
          tienda.telefono = telefono || '';
          tienda.ticketConfig.nombreNegocio = nombreNegocio || nombre;
          tienda.ticketConfig.rfc = rfc || '';
          await tienda.save();
        } else {
          // Crear nueva tienda
          tienda = new Tienda({
            tenantId: tenantId,
            nombre,
            direccion: direccion || '',
            telefono: telefono || '',
            activa: true,
            ticketConfig: {
              nombreNegocio: nombreNegocio || nombre,
              rfc: rfc || '',
              mensajeInferior: '¡GRACIAS POR SU COMPRA!\nVuelva pronto'
            }
          });

          await tienda.save();

          // Incrementar contador de tiendas
          const tenant = await Tenant.findById(tenantId);
          tenant.metadata.totalTiendas = (tenant.metadata.totalTiendas || 0) + 1;
          await tenant.save();
        }
      } else {
        // Usuario no-admin: debe tener tienda asignada
        if (!user.tienda) {
          return errorResponse(res, 'Usuario no tiene tienda asignada', 400);
        }

        // Actualizar tienda del usuario
        tienda = await Tienda.findOneAndUpdate(
          { _id: user.tienda, tenantId: tenantId },
          {
            nombre,
            direccion: direccion || '',
            telefono: telefono || '',
            'ticketConfig.nombreNegocio': nombreNegocio || nombre,
            'ticketConfig.rfc': rfc || ''
          },
          { new: true, runValidators: true }
        );

        if (!tienda) {
          return errorResponse(res, 'Tienda no encontrada', 404);
        }
      }

      return successResponse(res, {
        tienda: {
          _id: tienda._id,
          nombre: tienda.nombre,
          direccion: tienda.direccion,
          telefono: tienda.telefono
        }
      }, 'Tienda configurada exitosamente');
    } catch (error) {
      console.error('Error actualizando configuración de tienda:', error);
      return errorResponse(res, 'Error al configurar tienda', 500);
    }
  }

  // Crear miembro del equipo como vendedor
  async createTeamMember(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, 'El email es requerido', 400);
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, 'Formato de email inválido', 400);
      }

      // Verificar si el email ya existe en el tenant
      const existingUser = await User.findOne({
        username: email.toLowerCase().trim(),
        tenantId: tenantId
      });

      if (existingUser) {
        return errorResponse(res, 'Ya existe un usuario con este email', 400);
      }

      // Obtener tenant para verificar límites
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Verificar límite de usuarios
      const currentUsers = await User.countDocuments({ tenantId: tenantId });
      if (currentUsers >= tenant.limits.maxUsers) {
        return errorResponse(res, `Has alcanzado el límite de ${tenant.limits.maxUsers} usuarios para tu plan`, 400);
      }

      // Obtener la tienda principal del tenant
      const tienda = await Tienda.findOne({ tenantId: tenantId }).sort({ createdAt: 1 });
      if (!tienda) {
        return errorResponse(res, 'No se encontró una tienda. Por favor completa el paso 1 primero', 400);
      }

      // Generar contraseña temporal (el usuario deberá cambiarla)
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      // Extraer nombre de usuario del email (parte antes del @)
      const emailUsername = email.split('@')[0].toLowerCase().trim();

      // Crear el usuario vendedor
      const newUser = new User({
        username: emailUsername,
        email: email.toLowerCase().trim(),
        password: tempPassword,
        role: 'vendedor',
        tienda: tienda._id,
        tenantId: tenantId,
        mustChangePassword: true
      });

      await newUser.save();

      // Crear historial laboral básico para el nuevo empleado
      const employeeHistory = new EmployeeHistory({
        tenantId: tenantId,
        employee: newUser._id,
        tienda: tienda._id,
        nombre: email.split('@')[0], // Usar parte antes del @ como nombre temporal
        apellidoPaterno: 'Pendiente',
        apellidoMaterno: 'Actualizar',
        startDate: new Date(),
        position: 'Vendedor',
        salary: 0, // Sueldo pendiente de definir
        seguroSocial: 'No',
        notes: 'Usuario creado durante onboarding. Actualizar datos personales y sueldo.'
      });

      await employeeHistory.save();

      // Actualizar contador de usuarios en el tenant
      tenant.metadata.totalUsers = (tenant.metadata.totalUsers || 0) + 1;
      tenant.metadata.teamInvited = true;
      await tenant.save();

      // ✅ NUEVO: Enviar email con credenciales
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login`;
        const changePasswordUrl = `${frontendUrl}/change-password`;

        await emailService.sendNewUserCredentialsEmail({
          to: email.toLowerCase().trim(),
          username: emailUsername,
          email: email.toLowerCase().trim(),
          tempPassword: tempPassword,
          loginUrl: loginUrl,
          changePasswordUrl: changePasswordUrl
        });

        console.log(`✅ Email de credenciales enviado a ${email}`);
      } catch (emailError) {
        // No fallar si el email falla, solo registrar el error
        console.error('⚠️ Error enviando email de credenciales:', emailError.message);
        console.log('📧 El usuario fue creado exitosamente, pero el email no pudo ser enviado');
      }

      return successResponse(res, {
        user: {
          _id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          tienda: tienda.nombre
        },
        tempPassword: tempPassword,
        emailSent: true,
        message: `Usuario vendedor creado. Se ha enviado un correo con las credenciales a ${email}`
      }, 'Miembro del equipo agregado exitosamente');
    } catch (error) {
      console.error('Error creando miembro del equipo:', error);
      return errorResponse(res, 'Error al crear miembro del equipo', 500);
    }
  }

  // ✨ NUEVO: Actualizar tipo de negocio
  async updateBusinessType(req, res) {
    try {
      const tenantId = req.tenantId;
      const { businessType } = req.body;

      // Validar businessType
      const validTypes = ['restaurant', 'dark_kitchen', 'supermarket'];
      if (!businessType || !validTypes.includes(businessType)) {
        return errorResponse(res, 'Tipo de negocio inválido', 400);
      }

      // Buscar tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Actualizar businessType
      tenant.businessType = businessType;

      // Habilitar configuración de restaurant si corresponde
      if (businessType === 'restaurant') {
        tenant.restaurantConfig = {
          enableTables: true,
          enableWaiters: true,
          enableTips: true,
          enableSplitBills: true,
          enableKitchenDisplay: false, // Por defecto deshabilitado
          maxTables: tenant.limits.maxTables || 0,
          tipSuggestions: [10, 15, 20],
          autoCloseAccountsAfterHours: 24,
          requireManagerForCancellation: true
        };
      }

      await tenant.save();

      return successResponse(res, {
        businessType: tenant.businessType,
        restaurantConfig: tenant.restaurantConfig
      }, `Tipo de negocio actualizado a: ${businessType}`);
    } catch (error) {
      console.error('Error actualizando tipo de negocio:', error);
      return errorResponse(res, 'Error al actualizar tipo de negocio', 500);
    }
  }
}

module.exports = new OnboardingController();

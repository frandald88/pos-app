const jwt = require('jsonwebtoken');
const Tenant = require('../../core/tenants/model');
const User = require('../../core/users/model');

/**
 * Middleware para identificar el tenant de la petición
 *
 * Identifica el tenant por:
 * 1. JWT token (tenantId en el payload)
 * 2. Header X-Tenant-ID
 * 3. Subdomain (en producción)
 *
 * Adjunta tenant al request: req.tenant y req.tenantId
 */
async function identifyTenant(req, res, next) {
  try {
    let tenantId = null;
    let tenant = null;

    // 1. Intentar obtener tenantId del JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
        const decoded = jwt.verify(token, jwtSecret);

        // Si el token tiene tenantId, usarlo
        if (decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
        // Si no, buscar el usuario y obtener su tenantId
        else if (decoded.id) {
          const user = await User.findById(decoded.id).select('tenantId');
          if (user && user.tenantId) {
            tenantId = user.tenantId;
          }
        }
      } catch (err) {
        // Token inválido o expirado, continuar sin tenantId del token
        console.log('⚠️  Token inválido o sin tenantId');
      }
    }

    // 2. Si no se encontró en el token, intentar con header
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }

    // 3. Si no se encontró, intentar con subdomain (solo en producción)
    if (!tenantId && process.env.NODE_ENV === 'production') {
      const host = req.headers.host || '';
      const parts = host.split('.');

      // Si es un subdominio (ej: cliente1.tupos.com)
      if (parts.length >= 3) {
        const subdomain = parts[0];

        // Buscar tenant por subdomain
        tenant = await Tenant.findOne({ subdomain, isActive: true })
          .select('_id companyName subscription limits metadata')
          .lean();

        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
    }

    // Si no se pudo identificar el tenant, verificar si es ruta pública
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/tenants/register',
      '/api/tenants/check-subdomain',
      '/api/health',
      '/'
    ];

    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

    if (!tenantId && !isPublicRoute) {
      return res.status(400).json({
        message: 'No se pudo identificar el tenant. Por favor inicia sesión nuevamente.',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Si se identificó el tenant, cargarlo
    if (tenantId && !tenant) {
      tenant = await Tenant.findById(tenantId)
        .select('_id companyName subdomain subscription limits metadata settings isActive suspendedAt')
        .lean();

      if (!tenant) {
        return res.status(404).json({
          message: 'Tenant no encontrado',
          code: 'TENANT_NOT_FOUND'
        });
      }
    }

    // Verificar estado del tenant
    if (tenant) {
      // Verificar si está suspendido
      if (!tenant.isActive || tenant.suspendedAt) {
        return res.status(403).json({
          message: 'Esta cuenta ha sido suspendida. Por favor contacta a soporte.',
          code: 'TENANT_SUSPENDED'
        });
      }

      // Verificar estado de suscripción
      const { subscription } = tenant;

      if (subscription.status === 'past_due' || subscription.status === 'canceled') {
        // Permitir acceso limitado a ciertas rutas para renovar suscripción
        const allowedRoutesForPastDue = [
          '/api/billing',
          '/api/users/profile',
          '/api/auth/logout'
        ];

        const isAllowedRoute = allowedRoutesForPastDue.some(route => req.path.startsWith(route));

        if (!isAllowedRoute) {
          return res.status(402).json({
            message: subscription.status === 'past_due'
              ? 'Tu suscripción está vencida. Por favor actualiza tu método de pago.'
              : 'Tu suscripción ha sido cancelada.',
            code: 'SUBSCRIPTION_' + subscription.status.toUpperCase(),
            subscription: {
              status: subscription.status,
              plan: subscription.plan
            }
          });
        }
      }

      // Verificar si el trial expiró
      if (subscription.status === 'trialing' && subscription.trialEndsAt) {
        const trialEnd = new Date(subscription.trialEndsAt);
        const now = new Date();

        if (now > trialEnd) {
          return res.status(402).json({
            message: 'Tu periodo de prueba ha expirado. Por favor selecciona un plan.',
            code: 'TRIAL_EXPIRED',
            subscription: {
              status: 'trial_expired',
              trialEndsAt: subscription.trialEndsAt
            }
          });
        }
      }

      // Adjuntar tenant al request
      req.tenant = tenant;
      req.tenantId = tenant._id.toString();

      console.log(`✅ Tenant identificado: ${tenant.companyName} (${tenant.subdomain})`);
    }

    next();
  } catch (error) {
    console.error('❌ Error en identifyTenant middleware:', error);
    return res.status(500).json({
      message: 'Error al identificar tenant',
      error: error.message
    });
  }
}

/**
 * Middleware para requerir que el tenant esté identificado
 * Usar después de identifyTenant en rutas protegidas
 */
function requireTenant(req, res, next) {
  if (!req.tenant || !req.tenantId) {
    return res.status(401).json({
      message: 'Se requiere autenticación con tenant válido',
      code: 'TENANT_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware para verificar acceso a features según el plan del tenant
 * @param {string} feature - Nombre del feature a verificar
 */
function checkFeatureAccess(feature) {
  return (req, res, next) => {
    // Si no hay tenant, dejar que requireTenant lo maneje
    if (!req.tenant) {
      return next();
    }

    const { limits, subscription } = req.tenant;

    // Mapeo de features a límites del tenant
    const featureMap = {
      'reports': true, // Siempre permitido (puede limitarse por plan)
      'employees': limits?.maxEmployees !== 0,
      'gastos': limits?.maxExpenses !== 0,
      'clientes': limits?.maxClientes !== 0,
      'delivery': limits?.maxDeliveries !== 0,
      'vacaciones': true,
      'asistencia': true,
      'caja': true,
      'devoluciones': true
    };

    // Por defecto, permitir acceso si no está en el mapa
    const hasAccess = featureMap[feature] !== false;

    if (!hasAccess) {
      return res.status(403).json({
        message: `Tu plan actual no incluye acceso a ${feature}. Actualiza tu suscripción para usar esta función.`,
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        currentPlan: subscription?.plan || 'unknown'
      });
    }

    next();
  };
}

module.exports = {
  identifyTenant,
  requireTenant,
  checkFeatureAccess
};

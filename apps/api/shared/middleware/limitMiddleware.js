const Tenant = require('../../core/tenants/model');

/**
 * Middleware factory para verificar límites de recursos
 *
 * Uso:
 *   router.post('/users', identifyTenant, checkResourceLimit('users'), createUser);
 *   router.post('/tiendas', identifyTenant, checkResourceLimit('tiendas'), createTienda);
 */
function checkResourceLimit(resource) {
  return async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({
          message: 'Tenant no identificado',
          code: 'TENANT_REQUIRED'
        });
      }

      // Cargar tenant completo si no está en el request
      let tenant = req.tenant;
      if (!tenant || !tenant.limits || !tenant.metadata) {
        tenant = await Tenant.findById(req.tenantId);

        if (!tenant) {
          return res.status(404).json({
            message: 'Tenant no encontrado',
            code: 'TENANT_NOT_FOUND'
          });
        }
      }

      // Mapeo de recursos a campos de límites y metadata
      const resourceMap = {
        users: {
          limitKey: 'maxUsers',
          metadataKey: 'totalUsers',
          displayName: 'usuarios'
        },
        tiendas: {
          limitKey: 'maxTiendas',
          metadataKey: 'totalTiendas',
          displayName: 'tiendas'
        },
        products: {
          limitKey: 'maxProducts',
          metadataKey: 'totalProducts',
          displayName: 'productos'
        }
      };

      const config = resourceMap[resource];

      if (!config) {
        // Recurso no definido, permitir (no todos los recursos tienen límites)
        return next();
      }

      const limit = tenant.limits[config.limitKey];
      const current = tenant.metadata[config.metadataKey] || 0;

      // -1 significa ilimitado
      if (limit === -1) {
        return next();
      }

      // Verificar si se alcanzó el límite
      if (current >= limit) {
        return res.status(403).json({
          message: `Has alcanzado el límite de ${config.displayName} para tu plan (${limit} ${config.displayName}).`,
          code: 'RESOURCE_LIMIT_REACHED',
          resource: resource,
          limit: limit,
          current: current,
          plan: tenant.subscription.plan,
          upgradeMessage: tenant.subscription.plan === 'trial' || tenant.subscription.plan === 'basic'
            ? 'Actualiza a un plan superior para aumentar tus límites.'
            : 'Contacta con soporte para aumentar tus límites.'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error en checkResourceLimit middleware:', error);
      return res.status(500).json({
        message: 'Error al verificar límites de recursos',
        error: error.message
      });
    }
  };
}

/**
 * Middleware para verificar acceso a features
 *
 * Uso:
 *   router.get('/delivery', identifyTenant, checkFeatureAccess('delivery'), getOrders);
 */
function checkFeatureAccess(feature) {
  return async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({
          message: 'Tenant no identificado',
          code: 'TENANT_REQUIRED'
        });
      }

      // Cargar tenant si no está en el request
      let tenant = req.tenant;
      if (!tenant || !tenant.limits) {
        tenant = await Tenant.findById(req.tenantId);

        if (!tenant) {
          return res.status(404).json({
            message: 'Tenant no encontrado',
            code: 'TENANT_NOT_FOUND'
          });
        }
      }

      // Mapeo de features a campos de límites
      const featureMap = {
        delivery: {
          limitKey: 'canUseDelivery',
          displayName: 'Módulo de Delivery'
        },
        reports: {
          limitKey: 'canUseReports',
          displayName: 'Reportes Avanzados'
        },
        multiTienda: {
          limitKey: 'canUseMultiTienda',
          displayName: 'Multi-tienda'
        }
      };

      const config = featureMap[feature];

      if (!config) {
        // Feature no definida, permitir
        return next();
      }

      const hasAccess = tenant.limits[config.limitKey];

      if (!hasAccess) {
        return res.status(403).json({
          message: `${config.displayName} no está disponible en tu plan actual.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: feature,
          plan: tenant.subscription.plan,
          upgradeMessage: tenant.subscription.plan === 'trial' || tenant.subscription.plan === 'basic'
            ? 'Actualiza a un plan Pro o Enterprise para acceder a esta funcionalidad.'
            : 'Contacta con soporte para habilitar esta funcionalidad.'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error en checkFeatureAccess middleware:', error);
      return res.status(500).json({
        message: 'Error al verificar acceso a feature',
        error: error.message
      });
    }
  };
}

/**
 * Middleware para actualizar contador de recursos después de crear
 *
 * Uso:
 *   router.post('/users', ..., incrementResourceCount('users'));
 */
function incrementResourceCount(resource) {
  return async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return next(); // Sin tenant, no hay nada que actualizar
      }

      const resourceMap = {
        users: 'totalUsers',
        tiendas: 'totalTiendas',
        products: 'totalProducts'
      };

      const metadataKey = resourceMap[resource];

      if (metadataKey) {
        await Tenant.findByIdAndUpdate(
          req.tenantId,
          { $inc: { [`metadata.${metadataKey}`]: 1 } }
        );

        console.log(`📈 Incrementado ${metadataKey} para tenant ${req.tenantId}`);
      }

      next();
    } catch (error) {
      console.error('❌ Error en incrementResourceCount:', error);
      // No fallar la petición por error en contador
      next();
    }
  };
}

/**
 * Middleware para decrementar contador de recursos después de eliminar
 */
function decrementResourceCount(resource) {
  return async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return next();
      }

      const resourceMap = {
        users: 'totalUsers',
        tiendas: 'totalTiendas',
        products: 'totalProducts'
      };

      const metadataKey = resourceMap[resource];

      if (metadataKey) {
        await Tenant.findByIdAndUpdate(
          req.tenantId,
          { $inc: { [`metadata.${metadataKey}`]: -1 } }
        );

        console.log(`📉 Decrementado ${metadataKey} para tenant ${req.tenantId}`);
      }

      next();
    } catch (error) {
      console.error('❌ Error en decrementResourceCount:', error);
      // No fallar la petición por error en contador
      next();
    }
  };
}

module.exports = {
  checkResourceLimit,
  checkFeatureAccess,
  incrementResourceCount,
  decrementResourceCount
};

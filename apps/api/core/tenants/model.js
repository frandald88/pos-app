const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Información básica
  companyName: {
    type: String,
    required: true,
    trim: true
  },

  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,  // Solo letras minúsculas, números y guiones
    minlength: 3,
    maxlength: 30
  },

  // Owner del tenant (primer usuario - admin)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Opcional durante creación inicial
  },

  // Plan de suscripción
  subscription: {
    plan: {
      type: String,
      enum: ['launch', 'basic', 'pro', 'founder', 'enterprise'],
      default: 'launch'
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'suspended'],
      default: 'active'
    },
    // Fecha de inicio del período actual
    periodStart: {
      type: Date,
      default: () => new Date()
    },
    // Fecha de fin del período (3 meses para launch, 12 meses para anual)
    periodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000) // 3 meses para launch
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    // Campos específicos para plan Founder
    isLifetime: {
      type: Boolean,
      default: false
    },
    founderNumber: {
      type: Number,  // 1-20
      default: null
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'lifetime'],
      default: 'monthly'
    }
  },

  // Stripe integration
  billing: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    paymentMethod: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date
  },

  // ✨ Tipo de negocio
  businessType: {
    type: String,
    enum: ['restaurant', 'dark_kitchen', 'supermarket'],
    required: true,
    default: 'dark_kitchen' // Mantener compatibilidad con tenants existentes
  },

  // ✨ NUEVO: Configuración específica para restaurants
  restaurantConfig: {
    enableTables: { type: Boolean, default: false },
    enableWaiters: { type: Boolean, default: false },
    enableTips: { type: Boolean, default: false },
    enableSplitBills: { type: Boolean, default: false },
    enableKitchenDisplay: { type: Boolean, default: false },
    maxTables: { type: Number, default: 0 },

    // Sugerencias de propina (porcentajes)
    tipSuggestions: {
      type: [Number],
      default: [10, 15, 20]
    },

    // Auto-cerrar cuentas después de X horas
    autoCloseAccountsAfterHours: {
      type: Number,
      default: 24
    },

    // Requiere autorización de manager para cancelar cuentas
    requireManagerForCancellation: {
      type: Boolean,
      default: true
    }
  },

  // Límites según el plan
  limits: {
    maxUsers: {
      type: Number,
      default: 3  // Plan básico
    },
    maxTiendas: {
      type: Number,
      default: 1  // Plan básico
    },
    maxProducts: {
      type: Number,
      default: 500  // Plan básico
    },
    // Límites adicionales
    canUseDelivery: {
      type: Boolean,
      default: false
    },
    canUseReports: {
      type: Boolean,
      default: true
    },
    canUseMultiTienda: {
      type: Boolean,
      default: false
    },
    // ✨ NUEVO: Límites para restaurant
    maxTables: {
      type: Number,
      default: 0
    },
    maxWaiters: {
      type: Number,
      default: 0
    },
    maxOpenAccounts: {
      type: Number,
      default: 0
    }
  },

  // Configuración del tenant
  settings: {
    timezone: {
      type: String,
      default: 'America/Mexico_City'
    },
    language: {
      type: String,
      default: 'es'
    },
    currency: {
      type: String,
      default: 'MXN'
    },
    // Configuración de marca
    branding: {
      logo: String,
      primaryColor: {
        type: String,
        default: '#23334e'
      },
      secondaryColor: String
    }
  },

  // Información de contacto
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: String
  },

  // Metadata
  metadata: {
    // Onboarding tracking
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    onboardingCompletedAt: Date,
    onboardingCurrentStep: {
      type: Number,
      default: 0
    },
    onboardingStepsCompleted: {
      type: [Number],
      default: []
    },
    onboardingSkippedSteps: {
      type: [Number],
      default: []
    },
    firstSaleMade: {
      type: Boolean,
      default: false
    },
    teamInvited: {
      type: Boolean,
      default: false
    },

    // General metadata
    lastLoginAt: Date,
    totalUsers: {
      type: Number,
      default: 1
    },
    totalTiendas: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    }
  },

  // Control de estado
  isActive: {
    type: Boolean,
    default: true
  },

  suspendedAt: Date,
  suspensionReason: String,

}, {
  timestamps: true
});

// Índices (subdomain ya tiene unique: true en el schema)
tenantSchema.index({ owner: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ isActive: 1 });

// Métodos virtuales
tenantSchema.virtual('isTrialing').get(function() {
  return this.subscription.status === 'trialing';
});

tenantSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.isTrialing || !this.subscription.trialEndsAt) return 0;

  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndsAt);
  const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
});

// Métodos de instancia
tenantSchema.methods.hasReachedLimit = function(resource) {
  const resourceMap = {
    users: 'maxUsers',
    tiendas: 'maxTiendas',
    products: 'maxProducts'
  };

  const limitKey = resourceMap[resource];
  if (!limitKey) return false;

  const currentCount = this.metadata[`total${resource.charAt(0).toUpperCase() + resource.slice(1)}`] || 0;
  const limit = this.limits[limitKey];

  return currentCount >= limit;
};

tenantSchema.methods.canAccessFeature = function(feature) {
  const featureMap = {
    delivery: 'canUseDelivery',
    reports: 'canUseReports',
    multiTienda: 'canUseMultiTienda'
  };

  const featureKey = featureMap[feature];
  if (!featureKey) return false;

  return this.limits[featureKey] === true;
};

tenantSchema.methods.updateLimitsForPlan = function(plan) {
  const planLimits = {
    // Plan Lanzamiento - $1,249 por 3 meses (igual a Basic)
    launch: {
      maxUsers: 5,
      maxTiendas: 1,
      maxProducts: 500,
      canUseDelivery: true,
      canUseReports: true,
      canUseMultiTienda: false,
      // Límites de restaurant
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
      // Límites de restaurant
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
      // Límites de restaurant
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
      // Límites de restaurant
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
      // Límites de restaurant
      maxTables: -1, // Ilimitado
      maxWaiters: -1, // Ilimitado
      maxOpenAccounts: -1 // Ilimitado
    }
  };

  const limits = planLimits[plan];
  if (limits) {
    Object.assign(this.limits, limits);
  }

  return this;
};

// Middleware pre-save
tenantSchema.pre('save', function(next) {
  // Actualizar límites si cambia el plan
  if (this.isModified('subscription.plan')) {
    this.updateLimitsForPlan(this.subscription.plan);
  }

  // Si el trial expira, cambiar estado
  if (this.isTrialing && this.subscription.trialEndsAt < new Date()) {
    this.subscription.status = 'past_due';
  }

  next();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;

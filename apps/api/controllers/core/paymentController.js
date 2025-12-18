const Tenant = require('../../core/tenants/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

// Inicialización condicional de Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe inicializado correctamente');
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY no configurada. Las funciones de pago estarán deshabilitadas.');
}

// Configuración de planes (debe coincidir con Stripe Dashboard)
const PLAN_CONFIGS = {
  launch: {
    name: 'Plan Lanzamiento',
    price: 1249, // MXN por 3 meses
    priceId: process.env.STRIPE_PRICE_LAUNCH, // Se configura en .env
    lookupKey: 'plan_launch', // Para usar con lookup_key en Stripe
    features: [
      '1 tienda',
      '5 usuarios',
      '500 productos',
      'Delivery incluido',
      'Reportes completos',
      'Soporte por email'
    ]
  },
  basic: {
    name: 'Plan Básico Anual',
    price: 5999, // MXN por año
    priceId: process.env.STRIPE_PRICE_BASIC, // Se configura en .env
    lookupKey: 'plan_basic_anual', // Para usar con lookup_key en Stripe
    features: [
      '1 tienda',
      '5 usuarios',
      '500 productos',
      'Delivery incluido',
      'Reportes completos',
      'Soporte por email'
    ]
  },
  pro: {
    name: 'Plan Pro Anual',
    price: 8499, // MXN por año
    priceId: process.env.STRIPE_PRICE_PRO, // Se configura en .env
    lookupKey: 'plan_pro_anual', // Para usar con lookup_key en Stripe
    features: [
      '3 tiendas',
      '20 usuarios',
      '2000 productos',
      'Multi-tienda',
      'Reportes avanzados',
      'Soporte prioritario'
    ]
  },
  enterprise: {
    name: 'Plan Enterprise',
    price: 'Contactar',
    priceId: null, // Custom pricing
    lookupKey: null,
    features: [
      'Tiendas ilimitadas',
      'Usuarios ilimitados',
      'Productos ilimitados',
      'API personalizada',
      'Integraciones',
      'Soporte 24/7',
      'Capacitación incluida'
    ]
  }
};

// Helper para verificar si Stripe está disponible
function checkStripeAvailable(res) {
  if (!stripe) {
    return errorResponse(res, 'Stripe no está configurado. Contacta al administrador del sistema.', 503);
  }
  return null;
}

// ============================================
// FUNCIONES HELPER PARA WEBHOOKS (standalone)
// ============================================

// Manejar checkout completado
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout completado:', session.id);

  const planId = session.metadata.planId;
  const pendingRegistration = session.metadata.pendingRegistration === 'true';

  // Caso 1: Pre-registro (nuevo usuario que pagó desde landing)
  if (pendingRegistration) {
    console.log('📝 Creando cuenta automáticamente para nuevo usuario...');

    const customerEmail = session.metadata.customerEmail || session.customer_details?.email;
    const customerName = session.metadata.customerName;
    const companyName = session.metadata.companyName;

    if (!customerEmail || !companyName) {
      console.error('❌ Faltan datos para crear cuenta:', { customerEmail, companyName });
      return;
    }

    try {
      // Crear el tenant automáticamente
      const crypto = require('crypto');
      const User = require('../../core/users/model');

      // Generar token de activación (válido por 48 horas)
      const activationToken = crypto.randomBytes(32).toString('hex');
      const activationTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Generar subdomain desde el nombre de la compañía
      const subdomain = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20) + '-' + Math.random().toString(36).substring(2, 6);

      // Determinar duración según el plan
      let periodDuration;
      let isOneTimePayment = false;

      if (planId === 'launch') {
        // Plan de lanzamiento: 3 meses (one-time payment)
        periodDuration = 90 * 24 * 60 * 60 * 1000; // 90 días
        isOneTimePayment = true;
      } else {
        // Planes anuales: 1 año
        periodDuration = 365 * 24 * 60 * 60 * 1000; // 365 días
        isOneTimePayment = !session.subscription;
      }

      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(Date.now() + periodDuration);

      const newTenant = new Tenant({
        companyName: companyName,
        subdomain: subdomain,
        contact: {
          email: customerEmail,
          phone: ''
        },
        subscription: {
          plan: planId,
          status: 'active',
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          isOneTimePayment: isOneTimePayment
        },
        billing: {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription || null,
          stripePaymentIntentId: session.payment_intent
        },
        isActive: true
      });

      await newTenant.save();

      // Crear usuario admin SIN contraseña (la creará al activar)
      const adminUser = new User({
        username: customerEmail, // Usar email como username
        email: customerEmail,
        password: null,
        role: 'admin',
        tenantId: newTenant._id,
        isActive: false,
        activationToken: activationToken,
        activationTokenExpires: activationTokenExpires
      });

      await adminUser.save();

      console.log('✅ Cuenta creada exitosamente');
      console.log('   - Tenant:', newTenant.subdomain);
      console.log('   - Email:', customerEmail);
      console.log('   - Token de activacion:', activationToken);
      console.log('   - Token expira:', activationTokenExpires);

      // Enviar email con link de activación
      const activationUrl = `${process.env.FRONTEND_URL}/activate-account?token=${activationToken}`;

      try {
        console.log('📧 Enviando email de activacion...');
        const emailService = require('../../shared/services/emailService');
        await emailService.sendAccountActivationEmail({
          to: customerEmail,
          companyName: companyName,
          activationUrl: activationUrl,
          expiresInHours: 48
        });
        console.log('✅ Email de activacion enviado exitosamente a:', customerEmail);
      } catch (emailError) {
        console.error('❌ Error enviando email de activacion:', emailError);
        console.error('Stack:', emailError.stack);
        console.log('🔗 Link de activacion (manual):', activationUrl);
      }

    } catch (error) {
      console.error('❌ Error creando cuenta automáticamente:', error);
      console.error('Stack:', error.stack);
    }
  }
  // Caso 2: Usuario existente actualizando su suscripción
  else {
    const tenantId = session.metadata.tenantId;
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      console.error('Tenant no encontrado:', tenantId);
      return;
    }

    // Actualizar tenant con subscription ID
    if (session.subscription) {
      tenant.billing.stripeSubscriptionId = session.subscription;
      tenant.subscription.plan = planId;
      tenant.subscription.status = 'active';
      await tenant.save();
      console.log('✅ Tenant actualizado con suscripción:', session.subscription);
    }
  }
}

// Manejar actualización de suscripción
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Suscripción actualizada:', subscription.id);

  const tenantId = subscription.metadata.tenantId;
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    console.error('Tenant no encontrado:', tenantId);
    return;
  }

  // Actualizar estado de suscripción
  tenant.subscription.status = subscription.status;
  tenant.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  tenant.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  tenant.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Si está activa, quitar flag de trial
  if (subscription.status === 'active') {
    tenant.subscription.trialEndsAt = null;
  }

  await tenant.save();
  console.log('✅ Estado de suscripción actualizado:', subscription.status);
}

// Manejar eliminación de suscripción
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Suscripción cancelada:', subscription.id);

  const tenantId = subscription.metadata.tenantId;
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    console.error('Tenant no encontrado:', tenantId);
    return;
  }

  // Actualizar tenant
  tenant.subscription.status = 'canceled';
  tenant.billing.stripeSubscriptionId = null;
  tenant.isActive = false;
  tenant.suspendedAt = new Date();
  tenant.suspensionReason = 'Suscripción cancelada';

  await tenant.save();
  console.log('✅ Tenant suspendido por cancelación de suscripción');
}

// Manejar pago exitoso
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Pago exitoso:', invoice.id);

  const customerId = invoice.customer;
  const tenant = await Tenant.findOne({ 'billing.stripeCustomerId': customerId });
  if (!tenant) {
    console.error('Tenant no encontrado para customer:', customerId);
    return;
  }

  // Actualizar fecha de último pago
  tenant.billing.lastPaymentDate = new Date(invoice.created * 1000);
  tenant.billing.nextPaymentDate = new Date(invoice.period_end * 1000);

  // Asegurar que está activo
  if (!tenant.isActive) {
    tenant.isActive = true;
    tenant.suspendedAt = null;
    tenant.suspensionReason = null;
  }

  await tenant.save();
  console.log('✅ Fechas de pago actualizadas');
}

// Manejar fallo de pago
async function handleInvoicePaymentFailed(invoice) {
  console.log('⚠️ Pago fallido:', invoice.id);

  const customerId = invoice.customer;
  const tenant = await Tenant.findOne({ 'billing.stripeCustomerId': customerId });
  if (!tenant) {
    console.error('Tenant no encontrado para customer:', customerId);
    return;
  }

  // Marcar como past_due
  tenant.subscription.status = 'past_due';

  // Opcionalmente suspender después de X intentos fallidos
  const attemptCount = invoice.attempt_count || 0;
  if (attemptCount >= 3) {
    tenant.isActive = false;
    tenant.suspendedAt = new Date();
    tenant.suspensionReason = 'Múltiples intentos de pago fallidos';
  }

  await tenant.save();
  console.log(`⚠️ Tenant marcado como past_due (intento ${attemptCount})`);
}

// ============================================
// PAYMENT CONTROLLER CLASS
// ============================================

class PaymentController {

  // Obtener lista de planes disponibles
  async getPlans(req, res) {
    try {
      return successResponse(res, {
        plans: [
          { id: 'basic', ...PLAN_CONFIGS.basic },
          { id: 'pro', ...PLAN_CONFIGS.pro },
          { id: 'enterprise', ...PLAN_CONFIGS.enterprise }
        ]
      }, 'Planes obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      return errorResponse(res, 'Error al obtener planes', 500);
    }
  }

  // Crear customer en Stripe
  async createCustomer(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId;
      const { email, name } = req.body;

      // Buscar tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Verificar si ya tiene customer
      if (tenant.billing.stripeCustomerId) {
        return errorResponse(res, 'Ya existe un customer de Stripe para este tenant', 400);
      }

      // Crear customer en Stripe
      const customer = await stripe.customers.create({
        email: email || tenant.contact.email,
        name: name || tenant.companyName,
        metadata: {
          tenantId: tenant._id.toString(),
          subdomain: tenant.subdomain
        }
      });

      // Actualizar tenant
      tenant.billing.stripeCustomerId = customer.id;
      await tenant.save();

      return successResponse(res, {
        customerId: customer.id
      }, 'Customer de Stripe creado exitosamente');

    } catch (error) {
      console.error('Error creando customer:', error);
      return errorResponse(res, 'Error al crear customer de Stripe', 500);
    }
  }

  // Crear sesión de checkout (método recomendado por Stripe)
  async createCheckoutSession(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId; // Puede ser undefined si no está autenticado
      const { planId, successUrl, cancelUrl, customerEmail, customerName, companyName } = req.body;

      if (!planId || !PLAN_CONFIGS[planId]) {
        return errorResponse(res, 'Plan inválido', 400);
      }

      if (planId === 'enterprise') {
        return errorResponse(res, 'Plan Enterprise requiere contacto directo', 400);
      }

      const planConfig = PLAN_CONFIGS[planId];
      let customerId;
      let metadata = { planId: planId };

      // Caso 1: Usuario NO autenticado (nuevo usuario desde landing)
      if (!tenantId && customerEmail) {
        // Crear customer temporal en Stripe
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || companyName,
          metadata: {
            planId: planId,
            companyName: companyName || '',
            customerName: customerName || '',
            pendingRegistration: 'true' // Flag para saber que es un pre-registro
          }
        });
        customerId = customer.id;
        metadata.customerEmail = customerEmail;
        metadata.customerName = customerName;
        metadata.companyName = companyName;
        metadata.pendingRegistration = 'true';
      }
      // Caso 2: Usuario autenticado (cambio de plan)
      else if (tenantId) {
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          return errorResponse(res, 'Tenant no encontrado', 404);
        }

        // Verificar si ya tiene suscripción activa
        if (tenant.billing.stripeSubscriptionId) {
          return errorResponse(res, 'Ya existe una suscripción activa. Use el endpoint de actualización.', 400);
        }

        // Crear o usar customer existente
        customerId = tenant.billing.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: tenant.contact.email,
            name: tenant.companyName,
            metadata: {
              tenantId: tenant._id.toString(),
              subdomain: tenant.subdomain
            }
          });
          customerId = customer.id;
          tenant.billing.stripeCustomerId = customerId;
          await tenant.save();
        }
        metadata.tenantId = tenant._id.toString();
      }
      // Caso 3: Error - ni autenticado ni datos de pre-registro
      else {
        return errorResponse(res, 'Se requiere autenticación o datos de cliente', 400);
      }

      // Determinar si es one-time o subscription
      const isOneTime = planId === 'launch'; // Plan launch es one-time

      // Crear sesión de checkout
      const sessionConfig = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: planConfig.priceId,
            quantity: 1
          }
        ],
        mode: isOneTime ? 'payment' : 'subscription',
        success_url: successUrl || `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}`,
        metadata: metadata
      };

      // Solo agregar subscription_data si es subscription
      if (!isOneTime) {
        sessionConfig.subscription_data = {
          metadata: metadata
        };
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      return successResponse(res, {
        sessionId: session.id,
        url: session.url
      }, 'Sesión de checkout creada exitosamente');

    } catch (error) {
      console.error('Error creando sesión de checkout:', error);
      return errorResponse(res, 'Error al crear sesión de pago', 500);
    }
  }

  // Crear suscripción directamente (alternativa al checkout)
  async createSubscription(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId;
      const { planId, paymentMethodId } = req.body;

      if (!planId || !PLAN_CONFIGS[planId]) {
        return errorResponse(res, 'Plan inválido', 400);
      }

      if (planId === 'enterprise') {
        return errorResponse(res, 'Plan Enterprise requiere contacto directo', 400);
      }

      if (!paymentMethodId) {
        return errorResponse(res, 'Payment method ID es requerido', 400);
      }

      // Buscar tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Verificar si ya tiene suscripción activa
      if (tenant.billing.stripeSubscriptionId) {
        return errorResponse(res, 'Ya existe una suscripción activa', 400);
      }

      const planConfig = PLAN_CONFIGS[planId];

      // Crear o usar customer existente
      let customerId = tenant.billing.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: tenant.contact.email,
          name: tenant.companyName,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId
          },
          metadata: {
            tenantId: tenant._id.toString(),
            subdomain: tenant.subdomain
          }
        });
        customerId = customer.id;
      } else {
        // Adjuntar payment method al customer existente
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      // Crear suscripción
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planConfig.priceId }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          tenantId: tenant._id.toString(),
          planId: planId
        }
      });

      // Actualizar tenant
      tenant.billing.stripeCustomerId = customerId;
      tenant.billing.stripeSubscriptionId = subscription.id;
      tenant.billing.paymentMethod = paymentMethodId;
      tenant.subscription.plan = planId;
      tenant.subscription.status = subscription.status === 'active' ? 'active' : 'trialing';
      tenant.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      tenant.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      await tenant.save();

      return successResponse(res, {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        }
      }, 'Suscripción creada exitosamente');

    } catch (error) {
      console.error('Error creando suscripción:', error);
      return errorResponse(res, 'Error al crear suscripción', 500);
    }
  }

  // Cancelar suscripción
  async cancelSubscription(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId;
      const { immediately = false } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      if (!tenant.billing.stripeSubscriptionId) {
        return errorResponse(res, 'No hay suscripción activa', 400);
      }

      // Cancelar en Stripe
      const subscription = await stripe.subscriptions.update(
        tenant.billing.stripeSubscriptionId,
        {
          cancel_at_period_end: !immediately
        }
      );

      if (immediately) {
        await stripe.subscriptions.cancel(tenant.billing.stripeSubscriptionId);
        tenant.subscription.status = 'canceled';
      } else {
        tenant.subscription.cancelAtPeriodEnd = true;
      }

      await tenant.save();

      return successResponse(res, {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      }, immediately ? 'Suscripción cancelada inmediatamente' : 'Suscripción se cancelará al final del periodo');

    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      return errorResponse(res, 'Error al cancelar suscripción', 500);
    }
  }

  // Webhook de Stripe
  async handleWebhook(req, res) {
    // Verificar disponibilidad de Stripe
    if (!stripe) {
      console.error('⚠️ Webhook recibido pero Stripe no está configurado');
      return res.status(503).json({ error: 'Stripe no configurado' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verificar firma del webhook
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Error verificando webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📥 Webhook recibido: ${event.type}`);

    try {
      // Manejar eventos
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Evento no manejado: ${event.type}`);
      }

      console.log('✅ Webhook procesado exitosamente');
      // Responder a Stripe
      res.json({ received: true });

    } catch (error) {
      console.error('Error procesando webhook:', error);
      res.status(500).json({ error: 'Error procesando webhook' });
    }
  }

  // Obtener información de la suscripción actual
  async getCurrentSubscription(req, res) {
    try {
      const tenantId = req.tenantId;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      // Si no tiene suscripción de Stripe
      if (!tenant.billing.stripeSubscriptionId) {
        return successResponse(res, {
          plan: tenant.subscription.plan,
          status: tenant.subscription.status,
          trialEndsAt: tenant.subscription.trialEndsAt,
          isTrialing: tenant.subscription.status === 'trialing',
          limits: tenant.limits,
          usage: {
            users: `${tenant.metadata.totalUsers}/${tenant.limits.maxUsers}`,
            tiendas: `${tenant.metadata.totalTiendas}/${tenant.limits.maxTiendas}`,
            products: `${tenant.metadata.totalProducts}/${tenant.limits.maxProducts}`
          }
        }, 'Información de suscripción obtenida');
      }

      // Verificar disponibilidad de Stripe antes de obtener detalles
      if (!stripe) {
        // Si Stripe no está disponible pero hay subscriptionId guardado, usar datos locales
        return successResponse(res, {
          plan: tenant.subscription.plan,
          status: tenant.subscription.status,
          currentPeriodStart: tenant.subscription.currentPeriodStart,
          currentPeriodEnd: tenant.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: tenant.subscription.cancelAtPeriodEnd,
          limits: tenant.limits,
          usage: {
            users: `${tenant.metadata.totalUsers}/${tenant.limits.maxUsers}`,
            tiendas: `${tenant.metadata.totalTiendas}/${tenant.limits.maxTiendas}`,
            products: `${tenant.metadata.totalProducts}/${tenant.limits.maxProducts}`
          },
          warning: 'Stripe no configurado - mostrando datos locales'
        }, 'Información de suscripción obtenida');
      }

      // Obtener detalles de Stripe
      const subscription = await stripe.subscriptions.retrieve(tenant.billing.stripeSubscriptionId);

      return successResponse(res, {
        plan: tenant.subscription.plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        limits: tenant.limits,
        usage: {
          users: `${tenant.metadata.totalUsers}/${tenant.limits.maxUsers}`,
          tiendas: `${tenant.metadata.totalTiendas}/${tenant.limits.maxTiendas}`,
          products: `${tenant.metadata.totalProducts}/${tenant.limits.maxProducts}`
        }
      }, 'Información de suscripción obtenida');

    } catch (error) {
      console.error('Error obteniendo suscripción:', error);
      return errorResponse(res, 'Error al obtener información de suscripción', 500);
    }
  }

  /**
   * Verifica el estado de una sesión de checkout
   * Endpoint público para verificar que el pago fue exitoso
   */
  async verifySession(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return errorResponse(res, 'Session ID requerido', 400);
      }

      if (!stripe) {
        return errorResponse(res, 'Stripe no configurado', 500);
      }

      // Obtener la sesión de Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        return successResponse(res, {
          verified: true,
          email: session.customer_details.email,
          planId: session.metadata.planId
        }, 'Pago verificado exitosamente');
      } else {
        return successResponse(res, {
          verified: false,
          status: session.payment_status
        }, 'Pago no completado');
      }

    } catch (error) {
      console.error('Error verificando sesión:', error);
      return errorResponse(res, 'Error al verificar sesión de pago', 500);
    }
  }

  /**
   * Crear sesión del portal de cliente de Stripe
   * Permite a los clientes gestionar su suscripción y facturación
   */
  async createPortalSession(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId;
      const { returnUrl } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      if (!tenant.billing.stripeCustomerId) {
        return errorResponse(res, 'No se encontró información de cliente de Stripe', 404);
      }

      // Crear sesión del portal
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.billing.stripeCustomerId,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/admin/billing`
      });

      return successResponse(res, {
        url: session.url
      }, 'Sesión del portal creada exitosamente');

    } catch (error) {
      console.error('Error creando sesión del portal:', error);
      return errorResponse(res, 'Error al crear sesión del portal', 500);
    }
  }

  /**
   * Cambiar plan de suscripción
   */
  async changePlan(req, res) {
    try {
      // Verificar disponibilidad de Stripe
      const stripeCheck = checkStripeAvailable(res);
      if (stripeCheck) return stripeCheck;

      const tenantId = req.tenantId;
      const { newPlanId } = req.body;

      if (!newPlanId || !PLAN_CONFIGS[newPlanId]) {
        return errorResponse(res, 'Plan inválido', 400);
      }

      if (newPlanId === 'enterprise') {
        return errorResponse(res, 'Plan Enterprise requiere contacto directo', 400);
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return errorResponse(res, 'Tenant no encontrado', 404);
      }

      if (!tenant.billing.stripeSubscriptionId) {
        return errorResponse(res, 'No se encontró suscripción activa', 404);
      }

      const newPlanConfig = PLAN_CONFIGS[newPlanId];

      // Obtener la suscripción actual
      const subscription = await stripe.subscriptions.retrieve(tenant.billing.stripeSubscriptionId);

      // Actualizar la suscripción
      const updatedSubscription = await stripe.subscriptions.update(
        tenant.billing.stripeSubscriptionId,
        {
          items: [{
            id: subscription.items.data[0].id,
            price: newPlanConfig.priceId
          }],
          proration_behavior: 'create_prorations', // Prorratear el cambio
          metadata: {
            tenantId: tenant._id.toString(),
            planId: newPlanId
          }
        }
      );

      // Actualizar en la base de datos
      tenant.subscription.plan = newPlanId;
      await tenant.save();

      return successResponse(res, {
        subscription: updatedSubscription,
        newPlan: newPlanId
      }, 'Plan actualizado exitosamente');

    } catch (error) {
      console.error('Error cambiando plan:', error);
      return errorResponse(res, 'Error al cambiar plan', 500);
    }
  }
}

module.exports = new PaymentController();

# Flujo de Pago y Activación de Cuenta

## Resumen

Este documento describe el flujo completo de pago antes de registro (pre-payment registration) implementado en AstroDish.

## Flujo Completo (Opción B: Link de Activación)

### 1. Usuario visita la Landing Page

**Ubicación**: `apps/landing/src/App.js`

- Usuario ve los planes disponibles
- Hace clic en "Comenzar Ahora" en cualquier plan

### 2. Modal de Información

**Ubicación**: `apps/landing/src/App.js` (líneas 514-640)

Se abre un modal que solicita:
- Nombre completo
- Email
- Nombre de la empresa

### 3. Creación de Sesión de Stripe

**Frontend**: `apps/landing/src/App.js` - función `handleProceedToCheckout`
**Backend**: `apps/api/controllers/core/paymentController.js` - método `createCheckoutSession`

El frontend llama a la API:
```javascript
POST /api/payments/create-checkout-session
Body: {
  planId: 'launch',
  customerEmail: 'usuario@email.com',
  customerName: 'Juan Pérez',
  companyName: 'Mi Empresa',
  successUrl: 'http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'http://localhost:5173'
}
```

El backend:
- NO requiere autenticación (público)
- Crea un Customer en Stripe con los datos proporcionados
- Agrega metadata: `pendingRegistration: 'true'`
- Crea sesión de Stripe Checkout
- Retorna URL de pago

### 4. Usuario Paga en Stripe

- Frontend redirige a Stripe Checkout
- Usuario completa el pago
- Stripe redirige a `/payment-success?session_id=XXX`

### 5. Página de Éxito

**Ubicación**: `apps/app/src/pages/PaymentSuccessPage.js`

Muestra al usuario:
- Confirmación de pago exitoso
- Instrucciones: "Revisa tu email para activar tu cuenta"
- Pasos siguientes
- Botón para volver al inicio

### 6. Webhook de Stripe Procesa el Pago

**Ubicación**: `apps/api/controllers/core/paymentController.js` - método `handleCheckoutSessionCompleted`

Cuando Stripe confirma el pago, envía un webhook a:
```
POST /api/payments/webhook
```

El webhook:

#### 6.1. Detecta Pre-registro
```javascript
const pendingRegistration = session.metadata.pendingRegistration === 'true';
```

#### 6.2. Crea el Tenant
```javascript
const newTenant = new Tenant({
  companyName: companyName,
  subdomain: subdomain, // generado automáticamente
  subscription: {
    plan: planId,
    status: 'active'
  },
  billing: {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription
  }
});
```

#### 6.3. Crea el Usuario Admin SIN Contraseña
```javascript
const adminUser = new User({
  name: customerName,
  email: customerEmail,
  password: null, // SIN contraseña
  role: 'admin',
  tenantId: newTenant._id,
  isActive: false, // Inactivo hasta activación
  activationToken: activationToken, // Token aleatorio de 32 bytes
  activationTokenExpires: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 horas
});
```

#### 6.4. Envía Email de Activación

**Servicio**: `apps/api/shared/services/emailService.js`
**Template**: `apps/api/shared/templates/emailTemplates.js`

```javascript
await emailService.sendAccountActivationEmail({
  to: customerEmail,
  companyName: companyName,
  activationUrl: `http://localhost:3000/activate-account?token=XXX`,
  expiresInHours: 48
});
```

### 7. Usuario Recibe Email

El email contiene:
- Mensaje de bienvenida
- Botón "Activar Mi Cuenta"
- Link de activación (válido 48 horas)
- Instrucciones de lo que incluye la cuenta

### 8. Usuario Hace Clic en el Link

**Ubicación**: `apps/app/src/pages/ActivateAccountPage.js`

URL: `/activate-account?token=XXXXX`

#### 8.1. Verificación del Token

```javascript
GET /api/auth/verify-activation-token/:token
```

El backend verifica:
- Token existe en la base de datos
- Token no ha expirado (< 48 horas)
- Retorna email y nombre de empresa

#### 8.2. Formulario de Contraseña

La página muestra:
- Nombre de la empresa
- Email del usuario
- Formulario para crear contraseña (2 campos: contraseña y confirmar)
- Validaciones client-side

### 9. Usuario Crea su Contraseña

**Frontend**: `apps/app/src/pages/ActivateAccountPage.js` - función `handleActivateAccount`
**Backend**: `apps/api/controllers/core/authController.js` - método `activateAccount`

```javascript
POST /api/auth/activate-account
Body: {
  token: 'XXXXX',
  password: 'miContraseñaSegura'
}
```

El backend:
- Valida que el token sea válido y no expirado
- Valida que la contraseña cumpla requisitos (min 6 caracteres)
- Actualiza el usuario:
  ```javascript
  user.password = password; // Se hashea automáticamente
  user.isActive = true;
  user.activationToken = undefined;
  user.activationTokenExpires = undefined;
  ```
- Retorna confirmación

### 10. Redirección a Login

Después de activar exitosamente:
- Muestra alert: "Cuenta activada exitosamente. Ahora puedes iniciar sesión."
- Redirige a `/login`

### 11. Usuario Inicia Sesión

**Ubicación**: `apps/app/src/pages/LoginPage.js`

Usuario ingresa:
- Email: el que proporcionó en el paso 2
- Contraseña: la que creó en el paso 9

El sistema lo autentica y redirige al dashboard.

## Archivos Modificados/Creados

### Frontend (React)

1. **Landing Page**: `apps/landing/src/App.js`
   - Modal para recolectar datos
   - Llamada a API de Stripe sin autenticación

2. **Payment Success Page**: `apps/app/src/pages/PaymentSuccessPage.js`
   - Página de confirmación de pago
   - Instrucciones para revisar email

3. **Activate Account Page**: `apps/app/src/pages/ActivateAccountPage.js`
   - Verificación de token
   - Formulario de creación de contraseña

4. **App Routes**: `apps/app/src/App.js`
   - Rutas públicas agregadas

### Backend (Node.js/Express)

1. **Payment Controller**: `apps/api/controllers/core/paymentController.js`
   - `createCheckoutSession`: maneja usuarios no autenticados
   - `handleCheckoutSessionCompleted`: crea cuenta automáticamente
   - `verifySession`: verifica estado del pago

2. **Auth Controller**: `apps/api/controllers/core/authController.js`
   - `verifyActivationToken`: valida token de activación
   - `activateAccount`: activa cuenta y establece contraseña

3. **User Model**: `apps/api/core/users/model.js`
   - Campos agregados: `activationToken`, `activationTokenExpires`
   - `password` ahora es opcional (puede ser null)
   - Middleware actualizado para no hashear password null

4. **Routes**:
   - `apps/api/core/payments/routes.js`: ruta pública para checkout
   - `apps/api/core/auth/routes.js`: rutas de activación

5. **Email Service**: `apps/api/shared/services/emailService.js`
   - Método `sendAccountActivationEmail`

6. **Email Template**: `apps/api/shared/templates/emailTemplates.js`
   - Template `getAccountActivationTemplate`

## Variables de Entorno Necesarias

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_LAUNCH=price_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
```

### Email (elegir una opción)
```env
# Opción 1: Mailtrap (desarrollo)
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=...
MAILTRAP_PASS=...

# Opción 2: SendGrid (producción)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=...

EMAIL_FROM=noreply@astrodish.com
EMAIL_FROM_NAME=AstroDish
```

### Frontend URL
```env
FRONTEND_URL=http://localhost:3000
```

## Seguridad

1. **Token de Activación**:
   - 32 bytes aleatorios (crypto.randomBytes)
   - Válido solo 48 horas
   - Se elimina después de usar

2. **Contraseña**:
   - Mínimo 6 caracteres (validado en backend)
   - Hasheada con bcrypt (10 rounds)
   - Usuario la crea, no se genera automáticamente

3. **Usuario Inactivo**:
   - `isActive: false` hasta activación
   - No puede iniciar sesión hasta activar

4. **Webhook de Stripe**:
   - Verificado con firma de Stripe
   - Endpoint público pero seguro

## Testing

### Probar el Flujo Completo

1. Configurar Mailtrap (ver EMAIL_SETUP.md)
2. Iniciar landing: `cd apps/landing && npm run dev`
3. Iniciar app: `cd apps/app && npm start`
4. Iniciar API: `cd apps/api && npm run dev`
5. Visitar http://localhost:5173
6. Hacer clic en "Comenzar Ahora"
7. Llenar formulario del modal
8. Usar tarjeta de prueba de Stripe: 4242 4242 4242 4242
9. Ver email en Mailtrap inbox
10. Hacer clic en link de activación
11. Crear contraseña
12. Iniciar sesión

### Probar Casos de Error

1. **Token expirado**: cambiar `activationTokenExpires` a fecha pasada
2. **Token inválido**: usar token que no existe
3. **Contraseña corta**: intentar con menos de 6 caracteres
4. **Contraseñas no coinciden**: formulario frontend lo valida
5. **Email ya registrado**: sistema no permite duplicados

## Próximos Pasos (Pendientes)

1. Configurar productos en Stripe Dashboard
2. Configurar webhook en Stripe Dashboard
3. Configurar servicio de email (Mailtrap para dev, SendGrid para prod)
4. Testing end-to-end del flujo completo
5. Implementar reenvío de email de activación si el usuario lo solicita

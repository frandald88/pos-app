# 📘 Guía de Configuración de Stripe - Sistema POS

Esta guía te ayudará a configurar Stripe para aceptar pagos recurrentes (suscripciones) en tu sistema POS.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Crear Cuenta de Stripe](#paso-1-crear-cuenta-de-stripe)
3. [Paso 2: Obtener Claves API](#paso-2-obtener-claves-api)
4. [Paso 3: Crear Productos y Precios](#paso-3-crear-productos-y-precios)
5. [Paso 4: Configurar Webhooks](#paso-4-configurar-webhooks)
6. [Paso 5: Configurar Variables de Entorno](#paso-5-configurar-variables-de-entorno)
7. [Paso 6: Probar con Stripe CLI (Desarrollo)](#paso-6-probar-con-stripe-cli-desarrollo)
8. [Tarjetas de Prueba](#tarjetas-de-prueba)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Requisitos Previos

- ✅ Cuenta bancaria válida (para recibir pagos)
- ✅ Identificación oficial
- ✅ Información del negocio (RFC, dirección)
- ✅ Acceso al servidor donde está desplegada la aplicación (para webhooks)

---

## Paso 1: Crear Cuenta de Stripe

### 1.1 Registro

1. Ir a [https://stripe.com](https://stripe.com)
2. Click en **"Start now"** o **"Registrarse"**
3. Completar el formulario con:
   - Email de negocio
   - Nombre completo
   - Contraseña segura
   - País: **México**

### 1.2 Activar Cuenta

Para aceptar pagos reales:

1. Ir a **Configuración** → **Detalles de la cuenta**
2. Completar:
   - **Información del negocio**: Nombre legal, RFC, dirección
   - **Información bancaria**: CLABE interbancaria
   - **Verificación de identidad**: INE/Pasaporte

⚠️ **Nota**: Mientras completas la activación, puedes usar el **modo test** para desarrollo.

---

## Paso 2: Obtener Claves API

### 2.1 Acceder a las Claves

1. En Stripe Dashboard, ir a **Developers** → **API keys**
2. Encontrarás 4 claves:
   - ✅ **Publishable key (Test)**: `pk_test_...`
   - ✅ **Secret key (Test)**: `sk_test_...`
   - 🔒 **Publishable key (Live)**: `pk_live_...` (después de activar cuenta)
   - 🔒 **Secret key (Live)**: `sk_live_...` (después de activar cuenta)

### 2.2 Guardar Claves de Forma Segura

```bash
# ⚠️ NUNCA commits estas claves al repositorio
# Guardarlas solo en .env (ignorado por Git)

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Paso 3: Crear Productos y Precios

### 3.1 Crear Plan Básico

1. Ir a **Products** → **Add product**
2. Configurar:
   - **Name**: `Plan Básico`
   - **Description**: `5 usuarios, 1 tienda, 500 productos, Reportes completos`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$299 MXN`
   - **Billing period**: `Monthly`
   - **Currency**: `MXN`

3. Click en **Save product**
4. **⚠️ IMPORTANTE**: Copiar el **Price ID** que aparece (formato: `price_...`)

### 3.2 Crear Plan Pro

1. Ir a **Products** → **Add product**
2. Configurar:
   - **Name**: `Plan Pro`
   - **Description**: `20 usuarios, 3 tiendas, 2000 productos, Delivery y reportes, Multi-tienda`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$599 MXN`
   - **Billing period**: `Monthly`
   - **Currency**: `MXN`

3. Click en **Save product**
4. **⚠️ IMPORTANTE**: Copiar el **Price ID** (formato: `price_...`)

### 3.3 Guardar Price IDs

```bash
# Agregar al archivo .env
STRIPE_PRICE_BASIC=price_1234567890...
STRIPE_PRICE_PRO=price_0987654321...
```

---

## Paso 4: Configurar Webhooks

Los webhooks permiten que Stripe notifique a tu servidor sobre eventos (pagos exitosos, cancelaciones, etc.).

### 4.1 Crear Endpoint de Webhook

1. Ir a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. Configurar:
   - **Endpoint URL**: `https://tu-dominio.com/api/payments/webhook`
     - Ejemplo producción: `https://pos-app.com/api/payments/webhook`
     - ⚠️ Para desarrollo local, ver [Paso 6](#paso-6-probar-con-stripe-cli-desarrollo)

4. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Click en **Add endpoint**

### 4.2 Obtener Signing Secret

1. Después de crear el webhook, verás el **Signing secret** (formato: `whsec_...`)
2. Click en **Reveal** para ver el secreto completo
3. Copiar y guardar:

```bash
# Agregar al archivo .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Importante**: Este secreto verifica que las solicitudes realmente vienen de Stripe.

---

## Paso 5: Configurar Variables de Entorno

### 5.1 Crear archivo `.env` en `apps/api/`

```bash
# ========================================
# STRIPE (PAGOS)
# ========================================

# Claves API (Test para desarrollo, Live para producción)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...

# Frontend URL
FRONTEND_URL=http://localhost:3000  # o tu dominio en producción
```

### 5.2 Verificar que `.env` está en `.gitignore`

```bash
# Verificar que el archivo .gitignore contiene:
.env
.env.local
.env.production
```

---

## Paso 6: Probar con Stripe CLI (Desarrollo)

Para probar webhooks en tu entorno local:

### 6.1 Instalar Stripe CLI

#### Windows
```powershell
# Descargar desde: https://github.com/stripe/stripe-cli/releases
# Descomprimir y agregar al PATH
```

#### macOS (Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

#### Linux
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 6.2 Autenticar CLI

```bash
stripe login
# Seguir las instrucciones en el navegador
```

### 6.3 Reenviar Webhooks al Servidor Local

```bash
# Terminal 1: Iniciar backend
cd apps/api
npm start

# Terminal 2: Reenviar webhooks
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Verás un mensaje como:
```
> Ready! Your webhook signing secret is whsec_...
```

**⚠️ Copiar este `whsec_...` y agregarlo temporalmente al `.env` local.**

---

## 🎴 Tarjetas de Prueba

Para probar pagos en modo test:

### Tarjetas Exitosas

| Número | Descripción |
|--------|-------------|
| `4242 4242 4242 4242` | Visa - Pago exitoso |
| `5555 5555 5555 4444` | Mastercard - Pago exitoso |
| `378282246310005` | American Express - Pago exitoso |

### Tarjetas con Errores

| Número | Descripción |
|--------|-------------|
| `4000 0000 0000 0002` | Tarjeta rechazada |
| `4000 0000 0000 9995` | Fondos insuficientes |
| `4000 0000 0000 0069` | Tarjeta expirada |

### Datos Adicionales (cualquiera funciona)

- **Fecha de expiración**: Cualquier fecha futura (ej: 12/25)
- **CVC**: Cualquier 3 dígitos (ej: 123)
- **Código postal**: Cualquier código (ej: 12345)

---

## 🔄 Flujo de Pago Completo

### Usuario Final

1. Usuario navega a `/admin/pricing`
2. Selecciona un plan (Basic o Pro)
3. Click en **"Seleccionar Plan"**
4. Redirigido a Stripe Checkout (página segura de Stripe)
5. Ingresa datos de tarjeta
6. Stripe procesa el pago
7. Redirigido a `/admin/billing/success`
8. Sistema actualiza suscripción vía webhook

### Backend (Automático)

1. **Webhook recibido**: `checkout.session.completed`
2. Sistema verifica firma del webhook
3. Busca tenant por metadata
4. Actualiza:
   - `subscription.plan` → nuevo plan
   - `subscription.status` → 'active'
   - `billing.stripeSubscriptionId` → ID de suscripción
5. Aplica límites del nuevo plan

---

## 🛠️ Solución de Problemas

### Error: "No such price"

**Causa**: Price ID incorrecto en `.env`

**Solución**:
1. Ir a Stripe Dashboard → **Products**
2. Seleccionar el producto
3. Copiar el Price ID correcto (formato: `price_...`)
4. Actualizar `.env` y reiniciar servidor

---

### Error: "Invalid webhook signature"

**Causa**: Webhook secret incorrecto

**Solución**:
1. Ir a Stripe Dashboard → **Developers** → **Webhooks**
2. Seleccionar el webhook
3. Click en **Reveal** en "Signing secret"
4. Copiar el secreto completo
5. Actualizar `STRIPE_WEBHOOK_SECRET` en `.env`
6. Reiniciar servidor

---

### Webhook no se recibe en desarrollo local

**Causa**: Servidor local no es accesible públicamente

**Solución**: Usar Stripe CLI
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

### Error: "Customer already has a subscription"

**Causa**: Tenant ya tiene una suscripción activa

**Solución**: Cancelar suscripción existente primero:
```bash
# Opción 1: Desde la UI
/admin/billing → Cancelar Suscripción

# Opción 2: Desde Stripe Dashboard
Customers → Buscar customer → Subscriptions → Cancel
```

---

## 📊 Monitoreo de Pagos

### Dashboard de Stripe

- **Pagos**: [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- **Suscripciones**: [https://dashboard.stripe.com/subscriptions](https://dashboard.stripe.com/subscriptions)
- **Customers**: [https://dashboard.stripe.com/customers](https://dashboard.stripe.com/customers)
- **Logs de Webhooks**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

### Logs del Sistema

El backend registra eventos importantes:
```bash
# Ver logs en tiempo real
tail -f server.log | grep "Webhook"

# Ejemplos de logs:
✅ Checkout completado: cs_...
🔄 Suscripción actualizada: sub_...
💰 Pago exitoso: in_...
⚠️ Pago fallido: in_...
```

---

## 🚀 Pasar a Producción

### Checklist

- [ ] Cuenta de Stripe activada (información bancaria, identidad)
- [ ] Crear productos en modo **LIVE**
- [ ] Obtener claves **LIVE** (pk_live_... y sk_live_...)
- [ ] Crear webhook con URL de producción
- [ ] Actualizar `.env` de producción con claves LIVE
- [ ] Probar un pago real pequeño ($1 MXN)
- [ ] Configurar email de notificaciones en Stripe
- [ ] Activar alertas de pagos fallidos

### Variables de Entorno (Producción)

```bash
# apps/api/.env.production
STRIPE_SECRET_KEY=sk_live_...  # ⚠️ Live key
STRIPE_PUBLISHABLE_KEY=pk_live_...  # ⚠️ Live key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook de producción
STRIPE_PRICE_BASIC=price_...  # Price ID en modo live
STRIPE_PRICE_PRO=price_...  # Price ID en modo live
FRONTEND_URL=https://tu-dominio.com
```

---

## 📞 Soporte

- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Comunidad Stripe**: [https://github.com/stripe](https://github.com/stripe)

---

## ✅ Checklist Final

Antes de considerar completa la integración:

- [ ] ✅ Claves API configuradas en `.env`
- [ ] ✅ Productos creados en Stripe Dashboard
- [ ] ✅ Price IDs copiados y configurados
- [ ] ✅ Webhook endpoint creado
- [ ] ✅ Webhook secret configurado
- [ ] ✅ Stripe CLI funcionando (desarrollo)
- [ ] ✅ Tarjetas de prueba funcionan correctamente
- [ ] ✅ Webhooks se reciben y procesan
- [ ] ✅ Suscripción se crea correctamente
- [ ] ✅ Plan se aplica en el tenant
- [ ] ✅ Cancelación de suscripción funciona
- [ ] ✅ Página de billing muestra información correcta

---

**¡Felicidades! 🎉 Tu sistema de pagos con Stripe está configurado correctamente.**

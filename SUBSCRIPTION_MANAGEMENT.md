# Sistema de Gestión de Suscripciones

## Resumen

Este documento describe cómo funciona el sistema de gestión de suscripciones, incluyendo pagos one-time, recordatorios automáticos y suspensión de cuentas.

## Tipos de Pago

### 1. One-Time Payment (Pago Único)

**Plan Lanzamiento**: $1,249 MXN por 3 meses

- Usuario paga una sola vez
- NO es una suscripción recurrente
- Acceso válido por 90 días
- Sistema envía recordatorios automáticos
- Cuenta se suspende automáticamente al expirar

**Configuración en Stripe:**
```
Tipo: One-off
Precio: $1,249.00 MXN
Billing: One-off (no recurring)
```

### 2. Recurring Payment (Pago Recurrente)

**Planes Anuales**: Básico ($5,999/año) y Pro ($8,499/año)

- Suscripción anual que se renueva automáticamente
- Stripe maneja los cobros recurrentes
- Sistema monitorea estado de pago

## Sistema de Recordatorios Automáticos

### Cronograma de Recordatorios

Para usuarios con pagos one-time (Plan Lanzamiento):

1. **Día 60** (30 días restantes):
   - Email: "Tu plan expira en 30 días"
   - Tono: Informativo
   - CTA: "Ver Planes y Renovar"

2. **Día 80** (10 días restantes):
   - Email: "Urgente: Tu plan expira en 10 días"
   - Tono: Urgente
   - CTA: "Renovar Ahora"

3. **Día 90** (día de expiración):
   - Email: "Tu plan ha expirado"
   - Tono: Crítico
   - CTA: "Renovar y Recuperar Acceso"
   - Acción: Cuenta se suspende automáticamente

### Cómo Funciona el Cron Job

**Archivo**: `apps/api/shared/jobs/subscriptionCheckJob.js`

- Se ejecuta automáticamente todos los días a las 9:00 AM
- Revisa todos los tenants con `isOneTimePayment: true`
- Calcula días restantes hasta expiración
- Envía recordatorios según el cronograma
- Suspende cuentas expiradas

**Horario**: 9:00 AM (America/Mexico_City)

**Logs típicos**:
```
[2025-01-15T09:00:00.000Z] Ejecutando chequeo de suscripciones...
Iniciando chequeo de suscripciones...
Encontrados 5 tenants con pagos one-time activos
Procesando tenant: Mi Empresa - 25 días restantes
Procesando tenant: Otra Empresa - 5 días restantes
Enviando recordatorio de 10 días a: usuario@email.com
Chequeo de suscripciones completado
```

## Proceso de Suspensión

### Cuando se Suspende una Cuenta

**Condiciones**:
- Suscripción one-time expirada (currentPeriodEnd < hoy)
- Status actual no es 'suspended'

**Acciones**:
```javascript
tenant.subscription.status = 'suspended'
tenant.isActive = false
tenant.suspendedAt = new Date()
tenant.suspensionReason = 'Subscription expired (one-time payment period ended)'
```

### Qué Pasa con los Datos

- Los datos NO se eliminan
- Se conservan por 90 días
- Si el usuario renueva dentro de 90 días, todo se restaura
- Después de 90 días, se pueden eliminar (proceso manual por ahora)

### Restaurar una Cuenta Suspendida

Cuando el usuario paga un plan nuevo:

1. Usuario va a `/admin/pricing`
2. Selecciona un plan y paga
3. Webhook de Stripe detecta el pago
4. Sistema actualiza el tenant:
   ```javascript
   tenant.subscription.status = 'active'
   tenant.isActive = true
   tenant.suspendedAt = undefined
   tenant.suspensionReason = undefined
   ```

## Estructura de Datos

### Modelo Tenant - Campos Nuevos

```javascript
subscription: {
  plan: String,
  status: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,

  // NUEVO: Marca si es pago único
  isOneTimePayment: Boolean,

  // NUEVO: Tracking de recordatorios enviados
  remindersSent: {
    day60: Boolean,  // 30 días restantes
    day80: Boolean,  // 10 días restantes
    day90: Boolean   // Día de expiración
  }
}

billing: {
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePaymentIntentId: String  // NUEVO: Para pagos one-time
}
```

### Webhook - Lógica Actualizada

```javascript
// Determinar duración según el plan
if (planId === 'launch') {
  periodDuration = 90 días
  isOneTimePayment = true
} else {
  periodDuration = 365 días
  isOneTimePayment = !session.subscription
}

// Crear tenant con datos correctos
new Tenant({
  subscription: {
    currentPeriodEnd: new Date(Date.now() + periodDuration),
    isOneTimePayment: isOneTimePayment
  },
  billing: {
    stripePaymentIntentId: session.payment_intent  // Para one-time
  }
})
```

## Archivos Modificados/Creados

### Nuevos Archivos

1. **subscriptionReminderService.js** (`apps/api/shared/services/`)
   - Lógica de recordatorios
   - Templates de emails
   - Suspensión de cuentas

2. **subscriptionCheckJob.js** (`apps/api/shared/jobs/`)
   - Cron job diario
   - Ejecuta el servicio de recordatorios

### Archivos Modificados

1. **Tenant model** (`apps/api/core/tenants/model.js`)
   - Campos: `isOneTimePayment`, `remindersSent`, `stripePaymentIntentId`

2. **Payment Controller** (`apps/api/controllers/core/paymentController.js`)
   - Lógica para one-time payments
   - Cálculo de duración según plan

3. **server.js** (`apps/api/server.js`)
   - Inicialización del cron job

4. **tenants/routes.js** (`apps/api/core/tenants/routes.js`)
   - Endpoint manual para testing

## Testing

### Ejecutar Chequeo Manual

Como administrador, puedes ejecutar el chequeo manualmente:

```bash
POST /api/tenants/admin/check-subscriptions
Headers:
  Authorization: Bearer {admin_token}
```

Respuesta:
```json
{
  "success": true,
  "message": "Chequeo completado"
}
```

### Verificar Logs

```bash
# En modo desarrollo, el chequeo se ejecuta 5 segundos después de iniciar el servidor
npm run dev

# Busca en los logs:
[timestamp] Ejecutando chequeo de suscripciones...
Encontrados X tenants con pagos one-time activos
```

### Probar Recordatorios

Para probar sin esperar 60 días:

1. Crear un tenant de prueba con pago one-time
2. Modificar manualmente `currentPeriodEnd` en la base de datos:
   ```javascript
   // Para probar recordatorio de 30 días
   currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

   // Para probar recordatorio de 10 días
   currentPeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)

   // Para probar suspensión
   currentPeriodEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
   ```

3. Ejecutar chequeo manual
4. Verificar email en Mailtrap
5. Verificar estado del tenant

### Resetear Recordatorios

Si necesitas probar múltiples veces:

```javascript
// En MongoDB
db.tenants.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      "subscription.remindersSent.day60": false,
      "subscription.remindersSent.day80": false,
      "subscription.remindersSent.day90": false
    }
  }
)
```

## Configuración Requerida

### Variables de Entorno

```env
# Email service (requerido para enviar recordatorios)
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=...
MAILTRAP_PASS=...
EMAIL_FROM=noreply@astrodish.com
EMAIL_FROM_NAME=AstroDish

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:3000
```

### Paquetes NPM

Ya están instalados:
- `node-cron`: Para cron jobs
- `nodemailer`: Para envío de emails

## Monitoreo en Producción

### Logs a Monitorear

1. **Ejecución diaria del cron**:
   ```
   [timestamp] Ejecutando chequeo de suscripciones...
   ```

2. **Recordatorios enviados**:
   ```
   Enviando recordatorio de 30 días a: usuario@email.com
   Recordatorio de 30 días enviado exitosamente
   ```

3. **Suspensiones**:
   ```
   Suspendiendo tenant: Nombre Empresa
   Tenant suspendido exitosamente
   ```

4. **Errores**:
   ```
   Error en cron job de suscripciones: [mensaje]
   Error enviando recordatorio: [mensaje]
   ```

### Alertas Recomendadas

- Email de error si el cron job falla
- Slack notification cuando se suspende una cuenta
- Dashboard de métricas:
  - Cuentas próximas a expirar
  - Tasa de renovación
  - Recordatorios enviados vs. renovaciones

## Próximas Mejoras

1. **Reenvío de email de recordatorio** si el usuario lo solicita
2. **Dashboard admin** para ver cuentas próximas a expirar
3. **Descuentos de renovación** automáticos
4. **Eliminación automática** de datos después de 90 días de suspensión
5. **Webhooks** para notificar a sistemas externos
6. **A/B testing** de emails de recordatorio

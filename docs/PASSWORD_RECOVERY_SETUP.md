# Configuración del Sistema de Recuperación de Contraseña

Este documento explica cómo configurar el sistema de recuperación de contraseña por email en tu aplicación POS.

## Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Configuración para Desarrollo (Mailtrap)](#configuración-para-desarrollo-mailtrap)
3. [Configuración para Producción (SendGrid)](#configuración-para-producción-sendgrid)
4. [Configuración Alternativa (Gmail)](#configuración-alternativa-gmail)
5. [Configuración SMTP Personalizada](#configuración-smtp-personalizada)
6. [Pruebas del Sistema](#pruebas-del-sistema)
7. [Solución de Problemas](#solución-de-problemas)

---

## Resumen del Sistema

El sistema de recuperación de contraseña funciona de la siguiente manera:

1. **Usuario solicita recuperación**: Ingresa su email en `/forgot-password`
2. **Backend genera token**: Se crea un token único de 32 bytes cifrado con bcrypt
3. **Email enviado**: Se envía un email con enlace de recuperación válido por 1 hora
4. **Usuario restablece contraseña**: Hace clic en el enlace y define nueva contraseña en `/reset-password`
5. **Token invalidado**: Una vez usado, el token se marca como utilizado y no se puede reutilizar

### Características de Seguridad

- ✅ Token único de un solo uso
- ✅ Cifrado con bcrypt (10 rounds)
- ✅ Expiración automática (1 hora)
- ✅ Validación de fortaleza de contraseña
- ✅ Mensajes genéricos para prevenir enumeración de usuarios
- ✅ Registro de IP y User-Agent en solicitudes
- ✅ TTL index en MongoDB para limpieza automática (7 días)

---

## Configuración para Desarrollo (Mailtrap)

**Mailtrap** es un servicio de email testing que captura todos los emails enviados en un inbox virtual. Perfecto para desarrollo.

### Paso 1: Crear cuenta en Mailtrap

1. Ve a [https://mailtrap.io](https://mailtrap.io)
2. Crea una cuenta gratuita
3. Verifica tu email

### Paso 2: Obtener credenciales SMTP

1. Inicia sesión en Mailtrap
2. Ve a **Email Testing** > **Inboxes**
3. Haz clic en tu inbox (por defecto "My Inbox")
4. En la pestaña **SMTP Settings**, selecciona integración "Nodemailer"
5. Copia las credenciales mostradas

### Paso 3: Configurar variables de entorno

En tu archivo `.env` (backend):

```env
# Email Service Configuration
EMAIL_SERVICE=mailtrap
EMAIL_FROM=noreply@pos-app.com
EMAIL_FROM_NAME=POS App

# Mailtrap Configuration
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=tu_usuario_aqui
MAILTRAP_PASS=tu_password_aqui

# Frontend URL (para generar enlaces de reset)
FRONTEND_URL=http://localhost:3000
```

### Paso 4: Verificar configuración

```bash
# En el directorio apps/api
npm start
```

En los logs deberías ver:
```
📧 Inicializando servicio de email: mailtrap
✅ Servicio de email verificado y listo
```

### Paso 5: Probar el sistema

1. Ve a `http://localhost:3000/forgot-password`
2. Ingresa un email registrado en tu sistema
3. Revisa tu inbox en Mailtrap - deberías ver el email con el enlace de recuperación
4. Haz clic en el enlace y define una nueva contraseña

---

## Configuración para Producción (SendGrid)

**SendGrid** ofrece 100 emails gratuitos por día, ideal para aplicaciones en producción.

### Paso 1: Crear cuenta en SendGrid

1. Ve a [https://sendgrid.com](https://sendgrid.com)
2. Crea una cuenta gratuita
3. Completa el proceso de verificación

### Paso 2: Crear API Key

1. Inicia sesión en SendGrid
2. Ve a **Settings** > **API Keys**
3. Haz clic en **Create API Key**
4. Nombre sugerido: "POS App - Password Recovery"
5. Permisos: Selecciona **Full Access** o **Mail Send** (restringido)
6. Haz clic en **Create & View**
7. **IMPORTANTE**: Copia la API Key inmediatamente (no podrás verla después)

### Paso 3: Verificar dominio de remitente (Sender Authentication)

1. Ve a **Settings** > **Sender Authentication**
2. Opción 1 - **Single Sender Verification** (más rápido):
   - Haz clic en **Verify a Single Sender**
   - Ingresa tu email de negocio
   - Verifica el email

3. Opción 2 - **Domain Authentication** (recomendado para producción):
   - Haz clic en **Authenticate Your Domain**
   - Sigue las instrucciones para agregar registros DNS
   - Espera la verificación (puede tomar 24-48 horas)

### Paso 4: Configurar variables de entorno

En tu archivo `.env` (backend):

```env
# Email Service Configuration
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@tudominio.com  # Debe coincidir con el sender verificado
EMAIL_FROM_NAME=POS App

# SendGrid Configuration
SENDGRID_API_KEY=SG.tu_api_key_aqui

# Frontend URL
FRONTEND_URL=https://tudominio.com
```

### Paso 5: Verificar configuración

```bash
# En el directorio apps/api
npm start
```

En los logs deberías ver:
```
📧 Inicializando servicio de email: sendgrid
✅ Servicio de email verificado y listo
```

### Migración de Mailtrap a SendGrid

Para migrar de desarrollo a producción, simplemente cambia estas variables en `.env`:

```env
# Antes (Desarrollo)
EMAIL_SERVICE=mailtrap

# Después (Producción)
EMAIL_SERVICE=sendgrid
```

No necesitas cambiar código - el sistema detecta automáticamente el servicio configurado.

---

## Configuración Alternativa (Gmail)

**Gmail** es útil para pruebas rápidas, pero tiene límite de 500 emails/día.

### Paso 1: Habilitar verificación en dos pasos

1. Ve a [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Habilita **Verificación en dos pasos**

### Paso 2: Generar contraseña de aplicación

1. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona **Correo** y **Otro (nombre personalizado)**
3. Nombre: "POS App"
4. Haz clic en **Generar**
5. Copia la contraseña de 16 caracteres (sin espacios)

### Paso 3: Configurar variables de entorno

```env
# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=POS App

# Gmail Configuration
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=abcd efgh ijkl mnop  # La contraseña de aplicación de 16 caracteres

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: Usa la contraseña de aplicación, NO tu contraseña normal de Gmail.

---

## Configuración SMTP Personalizada

Si tienes tu propio servidor de email o hosting con SMTP.

### Configurar variables de entorno

```env
# Email Service Configuration
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=POS App

# SMTP Custom Configuration
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587              # 465 para SSL, 587 para TLS
SMTP_SECURE=false          # true para puerto 465, false para otros
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu_contraseña_smtp

# Frontend URL
FRONTEND_URL=https://tudominio.com
```

### Puertos comunes

- **587**: TLS/STARTTLS (recomendado) → `SMTP_SECURE=false`
- **465**: SSL (legacy) → `SMTP_SECURE=true`
- **25**: Sin cifrado (no recomendado)

---

## Pruebas del Sistema

### 1. Verificar conexión del servicio

Puedes crear un endpoint temporal para verificar:

```javascript
// En apps/api/core/auth/routes.js (temporal)
router.get('/test-email', async (req, res) => {
  const emailService = require('../../shared/services/emailService');
  try {
    await emailService.verifyConnection();
    res.json({ success: true, message: 'Email service OK' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Probar flujo completo

#### Paso 1: Solicitar recuperación
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación"
}
```

#### Paso 2: Revisar email
- **Mailtrap**: Ve a tu inbox en mailtrap.io
- **SendGrid**: Revisa tu email
- **Gmail**: Revisa tu bandeja de entrada

#### Paso 3: Verificar token (opcional)
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_del_email",
    "email": "usuario@example.com"
  }'
```

#### Paso 4: Restablecer contraseña
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_del_email",
    "email": "usuario@example.com",
    "newPassword": "NuevaPassword123!"
  }'
```

### 3. Probar desde el frontend

1. Ve a `http://localhost:3000/login`
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu inbox (Mailtrap/SendGrid/Gmail)
5. Haz clic en el enlace del email
6. Define nueva contraseña
7. Inicia sesión con la nueva contraseña

---

## Solución de Problemas

### Error: "Servicio de email no configurado correctamente"

**Causa**: Faltan variables de entorno o están mal configuradas

**Solución**:
1. Verifica que existe el archivo `.env` en `apps/api/`
2. Verifica que todas las variables necesarias estén definidas
3. Reinicia el servidor: `npm start`

### Error: "No se pudo conectar al servidor SMTP"

**Causa**: Credenciales incorrectas o firewall bloqueando

**Solución Mailtrap**:
- Verifica usuario y contraseña en mailtrap.io
- Asegúrate de usar `sandbox.smtp.mailtrap.io` como host

**Solución SendGrid**:
- Verifica que la API Key sea correcta y tenga permisos de Mail Send
- La API Key debe empezar con `SG.`

**Solución Gmail**:
- Usa contraseña de aplicación, NO tu contraseña normal
- Verifica que la verificación en dos pasos esté habilitada

### No llegan emails (pero no hay errores)

**Causa**: El servicio está enviando pero no llegan

**Solución Mailtrap**:
- Los emails NO llegan a tu inbox real - revisa mailtrap.io

**Solución SendGrid**:
- Verifica que el remitente esté verificado (Single Sender o Domain Authentication)
- Revisa la pestaña **Activity** en SendGrid para ver el status
- Revisa tu carpeta de spam

**Solución Gmail**:
- Revisa carpeta de spam
- Gmail puede bloquear si envías muchos emails rápidamente

### Token inválido o expirado

**Causa**: El token ya fue usado o pasó más de 1 hora

**Solución**:
1. Solicita un nuevo enlace de recuperación
2. Usa el enlace dentro de 1 hora
3. No uses el mismo enlace dos veces

### Contraseña débil rechazada

**Causa**: La contraseña no cumple los requisitos de seguridad

**Solución**: Asegúrate de que la contraseña tenga:
- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula
- ✅ Al menos una minúscula
- ✅ Al menos un número
- ✅ Al menos un carácter especial (!@#$%...)

### Logs útiles para debugging

El sistema genera logs detallados:

```
✅ Email de recuperación enviado a: usuario@example.com
✅ Email enviado: <message-id>
✅ Contraseña restablecida para usuario: usuario
```

Para habilitar más logs, puedes modificar temporalmente `emailService.js`:

```javascript
console.log('📧 Transporter config:', this.transporter.options);
```

---

## Mantenimiento

### Limpieza de tokens expirados

Los tokens se limpian automáticamente gracias al índice TTL de MongoDB (7 días después de expirar).

Si deseas limpieza manual:

```javascript
// En MongoDB shell o Compass
db.passwordresets.deleteMany({
  expiresAt: { $lt: new Date() }
});
```

### Monitoreo de emails enviados

**SendGrid**: Ve a **Activity** en el dashboard para ver estadísticas

**Mailtrap**: Ve a tu inbox para ver todos los emails de testing

### Rotación de API Keys

Por seguridad, rota tus API Keys periódicamente:

1. Crea nueva API Key en SendGrid
2. Actualiza `SENDGRID_API_KEY` en `.env`
3. Reinicia el servidor
4. Elimina la API Key antigua en SendGrid

---

## Arquitectura del Sistema

```
┌─────────────────┐
│   Frontend      │
│  LoginPage      │──── "¿Olvidaste tu contraseña?" ────┐
└─────────────────┘                                      │
                                                         ▼
┌─────────────────┐                          ┌─────────────────────┐
│   Frontend      │                          │  ForgotPasswordPage │
│  ResetPassword  │◄─── Link en email ───────│   POST /forgot-pwd  │
│  Page           │                          └─────────────────────┘
└─────────────────┘                                      │
        │                                                ▼
        │                                    ┌───────────────────────┐
        │                                    │  authController.js    │
        │                                    │  - forgotPassword()   │
        │                                    │  - Genera token       │
        │                                    └───────────────────────┘
        │                                                │
        ▼                                                ▼
┌─────────────────────┐                      ┌───────────────────────┐
│  POST /reset-pwd    │                      │   emailService.js     │
│  - Verifica token   │                      │   - Envía email       │
│  - Actualiza pass   │                      │   - Usa Mailtrap o    │
└─────────────────────┘                      │     SendGrid          │
        │                                    └───────────────────────┘
        ▼                                                │
┌─────────────────────┐                                 ▼
│  MongoDB            │                      ┌───────────────────────┐
│  - Users            │                      │  Email Template HTML  │
│  - PasswordResets   │                      │  - Profesional        │
└─────────────────────┘                      │  - Responsive         │
                                             └───────────────────────┘
```

---

## Checklist de Implementación

### Desarrollo
- [ ] Cuenta creada en Mailtrap
- [ ] Variables de entorno configuradas
- [ ] Servidor backend iniciado sin errores
- [ ] Prueba de "Forgot Password" exitosa
- [ ] Email recibido en Mailtrap
- [ ] Enlace de reset funciona
- [ ] Nueva contraseña aceptada
- [ ] Login con nueva contraseña funciona

### Producción
- [ ] Cuenta creada en SendGrid
- [ ] API Key generada con permisos correctos
- [ ] Sender verificado (email o dominio)
- [ ] Variables de entorno actualizadas a SendGrid
- [ ] Prueba en ambiente de staging
- [ ] Prueba con email real
- [ ] Email llega correctamente (no en spam)
- [ ] Enlace de reset funciona en producción
- [ ] Monitoreo configurado en SendGrid

---

## Soporte

Si encuentras problemas no cubiertos en esta documentación:

1. Revisa los logs del backend
2. Verifica las credenciales en el servicio de email
3. Prueba con curl para aislar si es problema de frontend o backend
4. Revisa la documentación oficial:
   - [Mailtrap Docs](https://mailtrap.io/docs)
   - [SendGrid Docs](https://docs.sendgrid.com)
   - [Nodemailer Docs](https://nodemailer.com/about/)

---

**Versión**: 1.0
**Última actualización**: Noviembre 2025
**Autor**: Sistema POS - Password Recovery Module

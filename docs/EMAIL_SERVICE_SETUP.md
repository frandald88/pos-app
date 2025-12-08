# 📧 Configuración del Servicio de Email

El sistema ya está configurado para enviar correos electrónicos con las credenciales de nuevos usuarios. Ahora solo necesitas configurar tu proveedor de email preferido.

## 🚀 Opciones de Configuración

### Opción 1: Mailtrap (Recomendado para Desarrollo/Testing)

Mailtrap es perfecto para desarrollo porque captura todos los emails sin enviarlos realmente.

1. **Crear cuenta gratuita:** https://mailtrap.io/
2. **Obtener credenciales** de tu inbox de prueba
3. **Agregar al archivo `.env`:**

```env
# Servicio de Email - Mailtrap (Development)
EMAIL_SERVICE=mailtrap
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=tu_usuario_aqui
MAILTRAP_PASS=tu_password_aqui
EMAIL_FROM=noreply@pos-app.com
EMAIL_FROM_NAME=POS App
FRONTEND_URL=http://localhost:3000
```

### Opción 2: Gmail (Fácil para Testing)

⚠️ **Importante:** Necesitas una "App Password", NO tu contraseña normal de Gmail.

1. **Habilitar 2FA** en tu cuenta de Gmail
2. **Generar App Password:** https://myaccount.google.com/apppasswords
3. **Agregar al `.env`:**

```env
# Servicio de Email - Gmail
EMAIL_SERVICE=gmail
GMAIL_USER=tu_email@gmail.com
GMAIL_PASS=tu_app_password_aqui
EMAIL_FROM=tu_email@gmail.com
EMAIL_FROM_NAME=POS App
FRONTEND_URL=http://localhost:3000
```

### Opción 3: SendGrid (Recomendado para Producción)

SendGrid es gratuito hasta 100 emails/día.

1. **Crear cuenta:** https://sendgrid.com/
2. **Crear API Key** en Settings > API Keys
3. **Agregar al `.env`:**

```env
# Servicio de Email - SendGrid (Production)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu_api_key_aqui
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=POS App
FRONTEND_URL=https://tudominio.com
```

### Opción 4: SMTP Custom

Si tienes tu propio servidor SMTP o hosting:

```env
# Servicio de Email - SMTP Custom
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.tuservidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_usuario
SMTP_PASS=tu_password
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=POS App
FRONTEND_URL=https://tudominio.com
```

## ✅ Probar la Configuración

Después de configurar tu `.env`:

1. **Reinicia el servidor:**
   ```bash
   cd apps/api
   npm restart
   ```

2. **Verifica los logs del servidor:**
   - Deberías ver: `✅ Transporter de [servicio] creado exitosamente`
   - O: `❌ Configuración de [servicio] incompleta` si falta algo

3. **Prueba creando un usuario** en el onboarding:
   - El sistema intentará enviar el email
   - Revisa el console del backend para ver:
     - `✅ Email de credenciales enviado a [email]` (éxito)
     - `⚠️ Error enviando email de credenciales` (si falla)

## 📧 Plantilla del Email

El email incluye:
- ✅ Nombre de usuario y email
- ✅ Contraseña temporal
- ✅ Botón directo para iniciar sesión
- ✅ Link alternativo para cambiar contraseña
- ✅ Instrucciones de seguridad
- ✅ Próximos pasos a seguir

## 🔒 Seguridad

- ⚠️ **Nunca** commites tu archivo `.env` al repositorio
- ✅ El `.env` ya está en `.gitignore`
- ✅ Los usuarios deben cambiar su contraseña temporal al primer inicio de sesión
- ✅ El email solo se envía si el servicio está configurado

## 🐛 Troubleshooting

### "Error: Servicio de email no configurado correctamente"
- Verifica que todas las variables de entorno estén en el archivo `.env`
- Reinicia el servidor después de modificar `.env`

### Email no llega (Gmail)
- Verifica que estés usando una App Password, no tu contraseña normal
- Asegúrate de que 2FA esté habilitado en tu cuenta de Gmail

### Email no llega (Mailtrap)
- Los emails NO se envían realmente, revísalos en https://mailtrap.io/inboxes
- Verifica que MAILTRAP_USER y MAILTRAP_PASS sean correctos

## 📝 Ejemplo Completo de `.env`

```env
# ==========================================
# EMAIL SERVICE CONFIGURATION
# ==========================================

# Para desarrollo/testing con Mailtrap
EMAIL_SERVICE=mailtrap
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=abc123def456
MAILTRAP_PASS=xyz789uvw012
EMAIL_FROM=noreply@pos-app.com
EMAIL_FROM_NAME=POS App
FRONTEND_URL=http://localhost:3000

# ==========================================
# Descomentar para usar en producción:
# EMAIL_SERVICE=sendgrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
# EMAIL_FROM=noreply@tudominio.com
# FRONTEND_URL=https://tudominio.com
# ==========================================
```

## ✨ ¿Qué pasa si no configuro el email?

- ✅ El sistema sigue funcionando normalmente
- ⚠️ Los emails simplemente no se enviarán
- ℹ️ La contraseña temporal aún aparecerá en la respuesta del API
- 📋 El administrador puede copiar la contraseña y enviarla manualmente

---

**¿Necesitas ayuda?** Revisa la documentación de tu proveedor de email o consulta los logs del servidor para más detalles.

# Configuración del Servicio de Email

El sistema necesita un servicio de email configurado para enviar emails de activación de cuenta a nuevos usuarios.

## Opciones de Configuración

### Opción 1: Mailtrap (Desarrollo/Testing) - RECOMENDADO PARA EMPEZAR

Mailtrap es ideal para desarrollo porque captura todos los emails en un inbox virtual sin enviarlos realmente.

1. Crear cuenta en https://mailtrap.io (gratis)
2. Ir a "Email Testing" > "Inboxes" > Crear o seleccionar un inbox
3. Copiar las credenciales SMTP
4. Agregar al archivo `.env`:

```env
EMAIL_SERVICE=mailtrap
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=tu_username_aqui
MAILTRAP_PASS=tu_password_aqui
EMAIL_FROM=noreply@astrodish.com
EMAIL_FROM_NAME=AstroDish
```

### Opción 2: SendGrid (Producción)

SendGrid es un servicio profesional para envío de emails en producción.

1. Crear cuenta en https://sendgrid.com
2. Crear API Key en Settings > API Keys
3. Agregar al archivo `.env`:

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu_api_key_aqui
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=AstroDish
```

### Opción 3: Gmail (Testing/Desarrollo)

Puedes usar Gmail con App Password (NO tu contraseña normal).

1. Habilitar 2FA en tu cuenta de Gmail
2. Ir a https://myaccount.google.com/apppasswords
3. Generar un App Password
4. Agregar al archivo `.env`:

```env
EMAIL_SERVICE=gmail
GMAIL_USER=tu_email@gmail.com
GMAIL_PASS=tu_app_password_aqui
EMAIL_FROM=tu_email@gmail.com
EMAIL_FROM_NAME=AstroDish
```

### Opción 4: SMTP Custom (Hosting Propio)

Si tienes tu propio servidor SMTP:

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.tudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_usuario
SMTP_PASS=tu_password
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=AstroDish
```

## Verificar Configuración

Una vez configurado, el sistema mostrará en los logs si el servicio de email se inicializó correctamente:

```
Inicializando servicio de email: mailtrap
Verificando credenciales de Mailtrap...
MAILTRAP_USER: Presente
MAILTRAP_PASS: Presente
Transporter de Mailtrap creado exitosamente
```

## Flujo de Activación de Cuenta

1. Usuario paga en Stripe
2. Webhook crea cuenta automáticamente
3. Sistema envía email con link de activación (válido 48 horas)
4. Usuario hace clic en el link
5. Usuario crea su contraseña
6. Usuario puede iniciar sesión

## Troubleshooting

### El email no se envía

- Verificar que las credenciales en `.env` sean correctas
- Revisar los logs del servidor para ver errores específicos
- Con Mailtrap: verificar que el username/password sean correctos
- Con Gmail: asegurarse de usar App Password, no la contraseña normal

### El link de activación aparece en los logs pero no en email

- Si ves el link en los logs con "Email de activacion enviado exitosamente", el email se envió
- Con Mailtrap: revisar el inbox en https://mailtrap.io/inboxes
- Con Gmail/SendGrid: revisar spam o carpeta de correo no deseado

### El link expiró

El link de activación es válido por 48 horas. Si expiró:
1. El usuario debe contactar a soporte
2. Como admin, puedes generar un nuevo link manualmente o eliminar y recrear la cuenta

## Configuración Actual Recomendada

Para desarrollo local, usa Mailtrap:
- Es gratis
- No envía emails reales (seguro)
- Permite ver exactamente cómo se ven los emails
- Fácil de configurar

Para producción, usa SendGrid:
- Confiable y profesional
- Incluye analytics y tracking
- Buen deliverability rate
- Plan gratis: 100 emails/día

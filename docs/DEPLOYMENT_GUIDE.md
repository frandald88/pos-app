# Guía de Despliegue e Instalación para Clientes

## 📞 Proceso de Venta e Instalación

### Paso 1: Venta y Especificaciones del Cliente

#### 1.1 Levantar Requisitos
- ¿Cuántas sucursales tiene? (determina si necesita módulo multi-tienda)
- ¿Cuántos usuarios simultáneos? (determina plan y servidor)
- ¿Qué módulos necesita? (clientes, reportes, empleados, etc.)
- ¿Qué hardware tiene? (PC, tablet, touchscreen?)
- ¿Tiene conexión a internet estable?

#### 1.2 Definir Plan y Precio
Según los requisitos, ofrecer uno de estos planes:

**Plan Básico** - $X/mes
- POS básico (ventas, productos)
- Control de gastos y devoluciones
- Corte de caja
- 1 tienda, hasta 3 usuarios

**Plan Standard** - $Y/mes
- Todo lo básico +
- Base de datos de clientes
- Reportes y análisis
- Gestión de empleados
- 1 tienda, hasta 10 usuarios

**Plan Premium** - $Z/mes
- Todo lo anterior +
- Multi-tienda
- Gestión de vacaciones
- Usuarios ilimitados
- Soporte prioritario

#### 1.3 Especificaciones de Hardware Requeridas

##### Opción 1: PC/Laptop (Recomendado para mayor rendimiento)
```
MÍNIMO:
- Procesador: Intel Core i3 / AMD Ryzen 3 (o equivalente)
- RAM: 4 GB
- Almacenamiento: 128 GB SSD
- Sistema Operativo: Windows 10/11, macOS 10.14+, Ubuntu 20.04+
- Pantalla: 1366x768 o superior
- Conexión: Internet banda ancha (5 Mbps mínimo)
- Puerto USB para lector de código de barras (opcional)

RECOMENDADO:
- Procesador: Intel Core i5 / AMD Ryzen 5 (o superior)
- RAM: 8 GB
- Almacenamiento: 256 GB SSD
- Sistema Operativo: Windows 11 / macOS 12+ / Ubuntu 22.04+
- Pantalla: 1920x1080 (Full HD)
- Conexión: Internet banda ancha (10 Mbps o más)
```

##### Opción 2: Tablet (Para movilidad)
```
MÍNIMO:
- Procesador: Snapdragon 660 / Apple A12 / Equivalente
- RAM: 3 GB
- Almacenamiento: 64 GB
- Pantalla: 10" o superior, táctil
- Sistema Operativo:
  - iPad: iPadOS 14 o superior
  - Android: Android 9 o superior
  - Windows: Windows 10 con modo tablet
- Conexión: WiFi estable (5 Mbps mínimo)

RECOMENDADO:
- iPad Pro / Samsung Galaxy Tab S7+ o superior
- RAM: 6 GB o más
- Pantalla: 12" táctil, resolución 2K
- Stylus compatible (opcional para firmas)
```

##### Periféricos Compatibles
✅ **Pantallas Touchscreen**: Sí, completamente compatible
✅ **Lectores de código de barras**: USB o Bluetooth
✅ **Impresoras térmicas**: Para tickets de venta
✅ **Cajones de efectivo**: Compatible con impresoras con puerto RJ11
✅ **Básculas digitales**: USB/Serial para pesaje automático

---

## 🚀 Proceso de Instalación Paso a Paso

### Opción A: Instalación Local (Cliente gestiona su servidor)

#### Paso 1: Preparar el Equipo del Cliente
```bash
# 1. Verificar que el equipo cumple requisitos mínimos
# 2. Instalar Node.js (versión 16 o superior)
# Descargar de: https://nodejs.org/

# Verificar instalación
node --version  # Debe mostrar v16.x.x o superior
npm --version   # Debe mostrar 8.x.x o superior

# 3. Instalar Git (para futuras actualizaciones)
# Descargar de: https://git-scm.com/
```

#### Paso 2: Preparar el Código
```bash
# EN TU MÁQUINA DE DESARROLLO:

# 1. Crear una copia limpia del proyecto SIN el código fuente visible
# (explicado en detalle más abajo en "Protección del Código")

# 2. Configurar licencia del cliente
cd pos-app
cp license.example.json license.json

# 3. Editar license.json con datos del cliente
nano license.json

# Ejemplo:
{
  "clientId": "rest-elsabor-001",
  "clientName": "Restaurante El Sabor",
  "licenseKey": "SABOR-2025-ABC-12345",
  "tier": "standard",
  "modules": {
    "tiendas": false,
    "clientes": true,
    "reportes": true,
    "empleados": true,
    "vacaciones": false
  },
  "features": {
    "maxUsers": 10,
    "maxStores": 1,
    "multiStore": false
  },
  "issuedAt": "2025-01-15T00:00:00.000Z",
  "expiresAt": "2026-01-15T23:59:59.999Z",
  "active": true
}
```

#### Paso 3: Configurar Base de Datos
```bash
# Opción 1: MongoDB Atlas (Cloud - RECOMENDADO)
# 1. Ir a https://www.mongodb.com/cloud/atlas
# 2. Crear cuenta gratuita
# 3. Crear cluster (seleccionar región más cercana al cliente)
# 4. Crear usuario de base de datos
# 5. Permitir acceso desde cualquier IP (0.0.0.0/0) o IP específica del cliente
# 6. Copiar connection string

# Opción 2: MongoDB Local
# Descargar de: https://www.mongodb.com/try/download/community
# Instalar y dejar corriendo en puerto 27017
```

#### Paso 4: Configurar Variables de Entorno
```bash
# Backend
cd backend
cp .env.example .env
nano .env

# Configurar:
PORT=5000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pos-elsabor
JWT_SECRET=clave-secreta-unica-para-este-cliente-xyz123
NODE_ENV=production

# Frontend
cd ../frontend
cp .env.example .env
nano .env

# Configurar:
REACT_APP_API_URL=http://localhost:5000
```

#### Paso 5: Instalar Dependencias y Compilar
```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../frontend
npm install
npm run build  # Genera carpeta 'build' con archivos optimizados
```

#### Paso 6: Configurar como Servicio (Windows)
```bash
# 1. Instalar PM2 globalmente
npm install -g pm2
npm install -g pm2-windows-startup

# 2. Configurar PM2 para inicio automático
pm2-startup install

# 3. Iniciar backend
cd backend
pm2 start server.js --name pos-backend

# 4. Servir frontend
cd ../frontend
pm2 serve build 3000 --name pos-frontend --spa

# 5. Guardar configuración
pm2 save

# 6. Verificar que todo está corriendo
pm2 status
```

#### Paso 7: Configurar Firewall (si es necesario)
```bash
# Windows Firewall
# Permitir puertos 3000 (frontend) y 5000 (backend)
# Panel de Control > Sistema y Seguridad > Firewall de Windows > Configuración avanzada
```

#### Paso 8: Crear Usuario Administrador Inicial
```bash
# Conectarse a la base de datos y crear usuario admin
# O usar un script de inicialización que hayas preparado

# Ejemplo con MongoDB Compass o desde terminal:
mongo "tu-connection-string"
use pos-elsabor
db.users.insertOne({
  nombre: "Administrador",
  email: "admin@restaurante.com",
  password: "$2b$10$...", // Hash bcrypt
  role: "admin",
  activo: true
})
```

#### Paso 9: Pruebas Finales
```bash
# 1. Abrir navegador en: http://localhost:3000
# 2. Login con usuario admin
# 3. Verificar que todos los módulos contratados aparecen
# 4. Realizar venta de prueba
# 5. Verificar impresión de ticket (si aplica)
# 6. Verificar conexión de lector de código de barras (si aplica)
```

---

### Opción B: Instalación en Servidor Cloud (Más Profesional)

#### Paso 1: Contratar Servidor
```
PROVEEDORES RECOMENDADOS:
- DigitalOcean (Droplet $12/mes) - https://www.digitalocean.com/
- AWS Lightsail ($10/mes) - https://aws.amazon.com/lightsail/
- Google Cloud (VM f1-micro gratis) - https://cloud.google.com/
- Linode ($10/mes) - https://www.linode.com/

ESPECIFICACIONES RECOMENDADAS:
- CPU: 2 vCPUs
- RAM: 2 GB
- Almacenamiento: 50 GB SSD
- Sistema Operativo: Ubuntu 22.04 LTS
- Ancho de banda: 2 TB/mes
```

#### Paso 2: Configurar Servidor
```bash
# SSH al servidor
ssh root@tu-servidor.com

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar Nginx (servidor web)
apt install -y nginx

# Instalar PM2
npm install -g pm2

# Instalar certbot (para SSL/HTTPS)
apt install -y certbot python3-certbot-nginx
```

#### Paso 3: Subir Código al Servidor
```bash
# EN TU MÁQUINA:
# Comprimir el proyecto
tar -czf pos-cliente.tar.gz pos-app/

# Subir al servidor
scp pos-cliente.tar.gz root@tu-servidor.com:/var/www/

# EN EL SERVIDOR:
cd /var/www/
tar -xzf pos-cliente.tar.gz
cd pos-app
```

#### Paso 4: Configurar e Iniciar
```bash
# Backend
cd backend
npm install --production
pm2 start server.js --name pos-backend
pm2 startup
pm2 save

# Frontend (ya compilado en build/)
cd ../frontend/build
# Nginx servirá estos archivos estáticos
```

#### Paso 5: Configurar Nginx
```bash
nano /etc/nginx/sites-available/pos-cliente

# Contenido:
server {
    listen 80;
    server_name pos-cliente.tudominio.com;

    # Frontend
    location / {
        root /var/www/pos-app/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activar configuración
ln -s /etc/nginx/sites-available/pos-cliente /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Paso 6: Configurar SSL (HTTPS)
```bash
certbot --nginx -d pos-cliente.tudominio.com
# Seguir instrucciones del asistente
```

#### Paso 7: Acceso del Cliente
```
URL: https://pos-cliente.tudominio.com
Usuario: admin@restaurante.com
Password: (proporcionado por ti)
```

---

## 🔒 Protección del Código Fuente

### ¿El Cliente Puede Ver el Código?

**Respuesta Corta**: Depende de cómo lo despliegues.

#### Opción 1: Código Abierto (Cliente ve todo)
- Cliente tiene acceso completo al código
- Puede modificarlo (no recomendado)
- Requiere conocimientos técnicos para mantener
- **Pros**: Transparencia total
- **Contras**: Cliente puede "copiar" tu sistema

#### Opción 2: Código Compilado/Ofuscado (Recomendado)
```bash
# Ofuscar código JavaScript
npm install -g javascript-obfuscator

# Backend
cd backend
javascript-obfuscator server.js --output server-obf.js
# Repetir para todos los archivos .js

# Frontend (ya compilado con npm run build está optimizado)
cd frontend
npm run build  # Ya minimiza y ofusca código React
```

#### Opción 3: Aplicación Electron Empaquetada (Muy Profesional)
```bash
# Convertir a aplicación de escritorio
npm install -g electron-builder

# Empaquetar todo en un .exe o .dmg
electron-builder --win --mac --linux

# El cliente recibe:
# - pos-setup.exe (Windows)
# - pos-setup.dmg (macOS)
# - pos-setup.AppImage (Linux)

# No puede ver el código fuente
```

#### Opción 4: SaaS (Software as a Service) - Más Seguro
- Tú hosting todo en tu servidor
- Cliente solo accede por URL
- Modelo de suscripción mensual
- **Pros**: Control total, actualizaciones centralizadas
- **Contras**: Requieres mantener infraestructura

---

## 📱 Compatibilidad con Dispositivos

### ✅ Pantallas Touchscreen

**Sí, 100% compatible**

El sistema está construido con React y CSS responsivo que funciona perfectamente con:
- Pantallas táctiles de Windows
- iPad/tablets iOS
- Tablets Android
- Monitores touchscreen USB
- All-in-One PCs con touch

**Optimizaciones touch ya implementadas:**
- Botones grandes y fáciles de presionar
- Gestos táctiles (scroll, tap, swipe)
- Teclado numérico en pantalla para cantidades
- Sin hover effects que requieran mouse

### ✅ Tablets

**Sí, funciona en tablets**

#### iPad
```bash
# Abrir Safari o Chrome
# Navegar a: http://tu-servidor:3000
# O instalado localmente: http://localhost:3000

# Opcional: Agregar a pantalla de inicio
# Safari > Compartir > Agregar a pantalla de inicio
# Se verá como una app nativa
```

#### Android Tablets
```bash
# Abrir Chrome
# Navegar a la URL del sistema
# Menú > Agregar a pantalla de inicio
```

#### Consideraciones para Tablets:
```
PROS:
✅ Portabilidad
✅ Touch nativo
✅ Económico
✅ Fácil de limpiar

CONTRAS:
❌ Pantalla más pequeña (10-12")
❌ Menos potencia de procesamiento
❌ Difícil conectar múltiples periféricos (impresora, lector, etc.)
❌ Batería limitada (requiere cargador constante en uso intensivo)
```

**RECOMENDACIÓN**:
- **Caja principal/estación fija**: PC con pantalla touchscreen
- **Meseros/toma de órdenes móvil**: Tablets
- **Gerente/supervisión**: Laptop o tablet grande

---

## 📋 Checklist de Entrega al Cliente

### Antes de la Instalación
- [ ] Verificar especificaciones de hardware del cliente
- [ ] Confirmar plan contratado y módulos incluidos
- [ ] Crear license.json personalizada
- [ ] Preparar usuario admin con credenciales seguras
- [ ] Configurar base de datos (MongoDB Atlas)
- [ ] Probar sistema completo en ambiente local

### Durante la Instalación
- [ ] Instalar Node.js en equipo del cliente
- [ ] Copiar archivos del sistema
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias
- [ ] Configurar PM2 para inicio automático
- [ ] Probar acceso desde navegador
- [ ] Conectar periféricos (impresora, lector)

### Capacitación (2-4 horas)
- [ ] Login y gestión de usuarios
- [ ] Registro de productos
- [ ] Realizar ventas (punto de venta)
- [ ] Devoluciones y cancelaciones
- [ ] Corte de caja diario
- [ ] Reportes básicos
- [ ] Gestión de clientes (si aplica)
- [ ] Gestión de empleados (si aplica)

### Después de la Instalación
- [ ] Entregar manual de usuario
- [ ] Proporcionar contacto de soporte
- [ ] Agendar revisión en 1 semana
- [ ] Configurar respaldos automáticos (backup)
- [ ] Documentar credenciales en lugar seguro

---

## 🛠️ Soporte Post-Venta

### Niveles de Soporte

**Nivel 1: Auto-servicio**
- Documentación en línea
- Videos tutoriales
- FAQ común

**Nivel 2: Email/Chat**
- Respuesta en 24-48 horas
- Para dudas generales
- Incluido en todos los planes

**Nivel 3: Soporte Telefónico**
- Respuesta en 4-8 horas
- Para problemas urgentes
- Solo plan Premium

**Nivel 4: Soporte en Sitio**
- Visita presencial
- Cobro adicional
- Para problemas críticos

### Problemas Comunes y Soluciones

#### "No puedo acceder al sistema"
```bash
# Verificar que el servicio está corriendo
pm2 status

# Si está caído, reiniciar
pm2 restart all

# Ver logs de errores
pm2 logs
```

#### "La impresora no funciona"
```bash
# Verificar conexión USB
# Windows: Panel de Control > Dispositivos e Impresoras
# Configurar impresora térmica como predeterminada
# Verificar que el navegador tiene permisos de impresión
```

#### "Pantalla táctil no responde bien"
```bash
# Windows: Calibrar pantalla táctil
# Configuración > Dispositivos > Lápiz y Windows Ink > Calibrar
```

---

## 💰 Modelo de Negocio Sugerido

### Opciones de Venta

#### Opción 1: Licencia Perpetua + Soporte Anual
```
Pago único: $2,000 - $5,000 USD
+ Soporte anual: $500 - $1,000 USD/año
```

#### Opción 2: Suscripción Mensual (SaaS)
```
Plan Básico: $50 - $100 USD/mes
Plan Standard: $100 - $200 USD/mes
Plan Premium: $200 - $400 USD/mes
```

#### Opción 3: Híbrido
```
Instalación inicial: $500 - $1,000 USD (una vez)
+ Suscripción: $30 - $100 USD/mes
```

### Servicios Adicionales
- Capacitación adicional: $100 - $200 USD/sesión
- Personalización/desarrollo: $50 - $100 USD/hora
- Soporte en sitio: $150 - $300 USD/visita
- Migración de datos: $200 - $500 USD

---

## 📞 Información de Contacto y Soporte

```
Email: soporte@tuempresa.com
Teléfono: +52 (xxx) xxx-xxxx
WhatsApp Business: +52 (xxx) xxx-xxxx
Portal de soporte: https://soporte.tuempresa.com
Horario: Lunes a Viernes 9:00 AM - 6:00 PM
```

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0

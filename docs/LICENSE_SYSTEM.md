# Sistema de Licencias

## 📋 Descripción General

El sistema de licencias permite controlar qué módulos y funcionalidades están disponibles para cada cliente. Esto permite ofrecer diferentes planes (básico, premium, etc.) y activar/desactivar características específicas por instalación.

## 🏗️ Arquitectura

### Backend
- **Middleware de licencias**: `backend/shared/middleware/licenseMiddleware.js`
- **Carga al inicio**: El servidor lee `license.json` al arrancar
- **Validación de rutas**: Solo registra rutas para módulos habilitados
- **Endpoint API**: `GET /api/license` para consultar licencia activa

### Frontend
- **Servicio**: `frontend/src/shared/services/licenseService.js`
- **Context**: `frontend/src/shared/contexts/LicenseContext.js`
- **UI**: Filtrado automático del menú según módulos habilitados

## 📦 Módulos del Sistema

### Módulos Core (Siempre Disponibles)
Estos módulos están incluidos en todas las instalaciones:
- ✅ **users** - Gestión de usuarios
- ✅ **products** - Catálogo de productos
- ✅ **sales** - Punto de venta
- ✅ **delivery** - Seguimiento de pedidos
- ✅ **gastos** - Control de gastos
- ✅ **devoluciones** - Gestión de devoluciones
- ✅ **caja** - Corte de caja

### Módulos Opcionales (Requieren Licencia)
Estos módulos se activan según el plan contratado:
- 🔐 **tiendas** - Gestión multi-tienda
- 🔐 **clientes** - Base de datos de clientes
- 🔐 **reportes** - Reportes y análisis avanzados
- 🔐 **empleados** - Gestión de empleados
  - Incluye submódulos: `asistencia` y `schedules`
- 🔐 **vacaciones** - Gestión de vacaciones

## 🔧 Configuración para Nuevos Clientes

### 1. Archivo de Licencia

Cada instalación tiene su propio archivo `license.json` en la raíz del proyecto:

```json
{
  "clientId": "cliente-001",
  "clientName": "Restaurante El Sabor",
  "licenseKey": "ABC-DEF-GHI-12345",
  "tier": "premium",
  "modules": {
    "tiendas": true,
    "clientes": true,
    "reportes": true,
    "empleados": true,
    "vacaciones": false
  },
  "features": {
    "maxUsers": 10,
    "maxStores": 3,
    "multiStore": true
  },
  "issuedAt": "2025-01-10T00:00:00.000Z",
  "expiresAt": "2026-01-10T23:59:59.999Z",
  "active": true
}
```

### 2. Campos de la Licencia

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `clientId` | String | ID único del cliente |
| `clientName` | String | Nombre del negocio |
| `licenseKey` | String | Clave de licencia única |
| `tier` | String | Plan contratado: `basic`, `standard`, `premium` |
| `modules` | Object | Módulos habilitados (true/false) |
| `features.maxUsers` | Number | Máximo de usuarios permitidos |
| `features.maxStores` | Number | Máximo de tiendas permitidas |
| `features.multiStore` | Boolean | Habilita funcionalidad multi-tienda |
| `issuedAt` | ISO Date | Fecha de emisión de la licencia |
| `expiresAt` | ISO Date | Fecha de expiración |
| `active` | Boolean | Estado activo/inactivo |

### 3. Planes Sugeridos

#### Plan Básico
```json
{
  "tier": "basic",
  "modules": {
    "tiendas": false,
    "clientes": false,
    "reportes": false,
    "empleados": false,
    "vacaciones": false
  },
  "features": {
    "maxUsers": 3,
    "maxStores": 1,
    "multiStore": false
  }
}
```
**Incluye**: POS básico, productos, ventas, gastos, devoluciones, caja

#### Plan Standard
```json
{
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
  }
}
```
**Incluye**: Todo lo básico + clientes, reportes, empleados

#### Plan Premium
```json
{
  "tier": "premium",
  "modules": {
    "tiendas": true,
    "clientes": true,
    "reportes": true,
    "empleados": true,
    "vacaciones": true
  },
  "features": {
    "maxUsers": 999,
    "maxStores": 999,
    "multiStore": true
  }
}
```
**Incluye**: Todas las funcionalidades

## 📝 Instalación para Cliente

### Paso 1: Preparar el Sistema
```bash
# Clonar el repositorio
git clone <repo-url>
cd pos-app

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
```

### Paso 2: Configurar Licencia
```bash
# Copiar plantilla de licencia
cp license.example.json license.json

# Editar con datos del cliente
nano license.json  # o usar cualquier editor
```

### Paso 3: Configurar Variables de Entorno
```bash
# Backend
cd backend
cp .env.example .env
# Editar MONGO_URI y otras variables

# Frontend
cd ../frontend
cp .env.example .env
# Configurar REACT_APP_API_URL si es necesario
```

### Paso 4: Iniciar el Sistema
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🔄 Actualización de Licencias

### Cambiar Módulos Habilitados

1. **Editar el archivo `license.json`** en la raíz del proyecto
2. **Cambiar los valores** de los módulos deseados
3. **Reiniciar el backend** para aplicar cambios

```json
{
  "modules": {
    "tiendas": false,    // Cambiar a true para habilitar
    "clientes": true,    // Cambiar a false para deshabilitar
    ...
  }
}
```

### Renovar Licencia Expirada

Actualizar la fecha `expiresAt`:
```json
{
  "expiresAt": "2027-01-10T23:59:59.999Z"  // Nueva fecha
}
```

### Desactivar Licencia

```json
{
  "active": false  // El sistema no funcionará
}
```

## 🛡️ Seguridad

### Buenas Prácticas

1. **No compartir license.json**: Este archivo está en `.gitignore` y no debe subirse a git
2. **Generar claves únicas**: Cada cliente debe tener un `licenseKey` único
3. **Validar fechas**: Verificar que las fechas sean correctas al crear licencias
4. **Backups**: Mantener respaldo del `license.json` de cada cliente

### Validación en Backend

El middleware valida automáticamente:
- ✅ Licencia activa (`active: true`)
- ✅ No expirada (`expiresAt > fecha actual`)
- ✅ Módulo habilitado en la licencia

Si falla, devuelve HTTP 403 con mensaje de error.

## 📊 Consultar Información de Licencia

### Desde el Frontend
```javascript
import { useLicense } from './shared/contexts/LicenseContext';

function MyComponent() {
  const { license, isModuleEnabled, isLicenseValid } = useLicense();

  if (isModuleEnabled('reportes')) {
    // Mostrar funcionalidad de reportes
  }

  return <div>{license.clientName}</div>;
}
```

### Desde el Backend
```javascript
const { isModuleEnabled, isLicenseValid } = require('./shared/middleware/licenseMiddleware');

if (isModuleEnabled('tiendas')) {
  // Lógica para multi-tienda
}
```

### API REST
```bash
# Consultar licencia activa
curl http://localhost:5000/api/license

# Respuesta
{
  "success": true,
  "license": {
    "clientName": "Desarrollo Local",
    "tier": "premium",
    "modules": {
      "tiendas": true,
      "clientes": true,
      ...
    },
    "features": {
      "maxUsers": 999,
      "maxStores": 999,
      "multiStore": true
    },
    "expiresAt": "2099-12-31T23:59:59.999Z",
    "active": true,
    "isExpired": false,
    "isValid": true
  }
}
```

## 🐛 Troubleshooting

### Problema: Módulos no aparecen en el menú

**Solución 1**: Verificar que la licencia esté correctamente configurada
```bash
curl http://localhost:5000/api/license
```

**Solución 2**: Verificar que el backend haya cargado la licencia
- Buscar en logs: `📜 Licencia cargada exitosamente`
- Verificar módulos habilitados en logs

**Solución 3**: Limpiar caché del navegador
- Ctrl + Shift + R (hard refresh)
- Abrir consola de desarrollador (F12) y verificar errores

### Problema: Error 404 al consultar /api/license

**Causa**: El frontend está llamando a `/license` en lugar de `/api/license`

**Solución**: Verificar `frontend/src/shared/services/licenseService.js`:
```javascript
// Debe ser:
const response = await axios.get(`${API_BASE_URL}/api/license`);

// No:
const response = await axios.get(`${API_BASE_URL}/license`);
```

### Problema: Backend no carga la licencia

**Causa**: Archivo `license.json` no existe o tiene errores de sintaxis

**Solución**:
```bash
# Verificar que existe
ls -la license.json

# Validar JSON
cat license.json | python -m json.tool

# O copiar de plantilla
cp license.example.json license.json
```

## 📚 Recursos Adicionales

- **Archivo de ejemplo**: `license.example.json`
- **Middleware**: `backend/shared/middleware/licenseMiddleware.js`
- **Context React**: `frontend/src/shared/contexts/LicenseContext.js`
- **Servicio Frontend**: `frontend/src/shared/services/licenseService.js`

## 💡 Casos de Uso

### Caso 1: Cliente requiere upgrade de plan

1. Cliente contacta solicitando módulo de reportes
2. Editar su `license.json`:
   ```json
   {
     "modules": {
       "reportes": true  // Cambiar de false a true
     }
   }
   ```
3. Reiniciar backend
4. Cliente verá el nuevo módulo en su menú

### Caso 2: Licencia de prueba temporal

```json
{
  "clientId": "trial-001",
  "clientName": "Cliente Prueba",
  "tier": "premium",
  "modules": {
    // Todos los módulos en true para prueba
  },
  "expiresAt": "2025-02-01T23:59:59.999Z",  // 30 días
  "active": true
}
```

### Caso 3: Desarrollo local

```json
{
  "clientId": "dev-local",
  "clientName": "Desarrollo Local",
  "tier": "premium",
  "modules": {
    // Todos en true para desarrollo
  },
  "expiresAt": "2099-12-31T23:59:59.999Z",  // No expira
  "active": true
}
```

---

**Última actualización**: Enero 2025
**Versión del sistema**: 1.0.0

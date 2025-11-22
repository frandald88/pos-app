# Multi-Tenancy - Estado de Modificaciones

## ✅ TODOS LOS MODELOS HAN SIDO MODIFICADOS

### Modelos Core
- [x] User
- [x] Product
- [x] Sale
- [x] Turno
- [x] Gastos (Expense)
- [x] Devoluciones (Return)
- [x] Delivery (Order)

### Modelos de Módulos
- [x] Tienda
- [x] Cliente
- [x] Empleado (EmployeeHistory)
- [x] Asistencia (Attendance)
- [x] Vacaciones (VacationRequest)
- [x] Schedules

## ✅ Cambios Aplicados a Todos los Modelos

Cada modelo ahora incluye:
1. ✅ Campo `tenantId` al inicio del schema con referencia a Tenant
2. ✅ Índices compuestos con `tenantId` para búsquedas eficientes
3. ✅ Campos únicos modificados para ser únicos por tenant

## 📝 Próximos Pasos

### 1. Ejecutar Script de Migración

**IMPORTANTE:** Antes de iniciar la aplicación, ejecuta el script de migración:

```bash
node apps/api/scripts/migrateToMultiTenancy.js
```

Este script:
- Creará un tenant por defecto con plan Enterprise (sin límites)
- Asignará el tenantId a todos los documentos existentes en TODAS las colecciones
- Actualizará los contadores de metadata del tenant

### 2. Actualizar Controladores

Todos los controladores necesitan ser actualizados para:
- Agregar `identifyTenant` middleware a las rutas
- Filtrar queries por `req.tenantId`
- Agregar `tenantId` al crear nuevos documentos
- Aplicar middleware de límites en endpoints de creación

### 3. Actualizar Rutas

Aplicar middlewares en este orden:
```javascript
router.post('/resource',
  identifyTenant,           // Identifica el tenant
  requireTenant,            // Verifica que el tenant esté identificado
  checkResourceLimit('resource'), // Verifica límites del plan
  createResource            // Tu controlador
);
```

---

## 📋 Detalle de Modificaciones Aplicadas (Referencia)

### 1. Tienda (`apps/api/modules/tiendas/model.js`)

**Agregar después de `const tiendaSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Agregar después de la definición del schema:**
```javascript
// Índices compuestos para multi-tenancy
tiendaSchema.index({ tenantId: 1, nombre: 1 });
```

---

### 2. Cliente (`apps/api/modules/clientes/model.js`)

**Agregar después de `const clienteSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Modificar el índice existente:**
```javascript
// Cambiar de:
clienteSchema.index({
  nombre: 1,
  primerApellido: 1,
  segundoApellido: 1
}, { unique: true });

// A:
clienteSchema.index({
  tenantId: 1,
  nombre: 1,
  primerApellido: 1,
  segundoApellido: 1
}, { unique: true });
```

---

### 3. Turno (`apps/api/core/turnos/model.js`)

**Agregar después de `const turnoSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Agregar índice:**
```javascript
turnoSchema.index({ tenantId: 1, fechaApertura: -1 });
turnoSchema.index({ tenantId: 1, usuario: 1, activo: 1 });
```

---

### 4. Gastos (`apps/api/core/gastos/model.js`)

**Agregar después de `const expenseSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Agregar índice:**
```javascript
expenseSchema.index({ tenantId: 1, createdAt: -1 });
```

---

### 5. Devoluciones (`apps/api/core/devoluciones/model.js`)

**Agregar después de `const returnSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Agregar índice:**
```javascript
returnSchema.index({ tenantId: 1, date: -1 });
returnSchema.index({ tenantId: 1, saleId: 1 });
```

---

### 6. Delivery/Orders (`apps/api/core/delivery/model.js`)

**Agregar después de `const orderSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

**Agregar índice:**
```javascript
orderSchema.index({ tenantId: 1, fechaEmision: -1 });
orderSchema.index({ tenantId: 1, status: 1 });
```

---

### 7. Empleado (`apps/api/modules/empleados/model.js`)

**Agregar después de `const empleadoSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

---

### 8. Asistencia (`apps/api/modules/asistencia/model.js`)

**Agregar después de `const attendanceSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

---

### 9. Vacaciones (`apps/api/modules/vacaciones/model.js`)

**Agregar después de `const vacationSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

---

### 10. Schedules (`apps/api/modules/schedules/model.js`)

**Agregar después de `const scheduleSchema = new mongoose.Schema({`:**
```javascript
// Multi-tenancy
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true
},
```

---

## NOTA IMPORTANTE

**NO** aplicar estos cambios todavía. Primero necesitamos:
1. Crear el middleware de tenant
2. Crear el script de migración de datos
3. Crear un tenant por defecto para los datos existentes
4. Aplicar todas las modificaciones al mismo tiempo

Esto evitará romper la aplicación actual.

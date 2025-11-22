# Guía de Actualización de Controladores para Multi-Tenancy

## ✅ Controlador Completado

- [x] **usersController** - Completamente actualizado como ejemplo

## 📝 Patrón de Actualización

### 1. Actualizar Rutas (`routes.js`)

#### Importar Middlewares

```javascript
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkResourceLimit, incrementResourceCount, decrementResourceCount } = require('../../shared/middleware/limitMiddleware');
```

#### Aplicar Middlewares a las Rutas

**Para rutas GET (lectura):**
```javascript
router.get('/', verifyToken, identifyTenant, requireTenant, controller.getAll);
```

**Para rutas POST (creación con límites):**
```javascript
router.post('/',
  verifyToken,
  identifyTenant,
  requireTenant,
  checkResourceLimit('resource_name'), // 'users', 'tiendas', 'products'
  controller.create,
  incrementResourceCount('resource_name')
);
```

**Para rutas DELETE (con decremento):**
```javascript
router.delete('/:id',
  verifyToken,
  identifyTenant,
  requireTenant,
  controller.delete,
  decrementResourceCount('resource_name')
);
```

### 2. Actualizar Controlador

#### Patrón para Queries de Lectura

**Antes:**
```javascript
const items = await Model.find({});
```

**Después:**
```javascript
const items = await Model.find({ tenantId: req.tenantId });
```

#### Patrón para Buscar por ID

**Antes:**
```javascript
const item = await Model.findById(req.params.id);
```

**Después:**
```javascript
const item = await Model.findOne({ _id: req.params.id, tenantId: req.tenantId });
```

#### Patrón para Crear Documentos

**Antes:**
```javascript
const newItem = new Model({ name, description });
await newItem.save();
```

**Después:**
```javascript
const newItem = new Model({
  name,
  description,
  tenantId: req.tenantId // Agregar tenantId
});
await newItem.save();
```

#### Patrón para Actualizar

**Antes:**
```javascript
const updated = await Model.findByIdAndUpdate(
  req.params.id,
  updateData,
  { new: true }
);
```

**Después:**
```javascript
const updated = await Model.findOneAndUpdate(
  { _id: req.params.id, tenantId: req.tenantId }, // Verificar tenant
  updateData,
  { new: true }
);
```

## 📋 Controladores Pendientes

### Core (Prioritarios)

- [ ] **productsController** - Productos con límites de plan
- [ ] **salesController** - Ventas (sin límites)
- [ ] **tiendasController** - Tiendas con límites de plan
- [ ] **authController** - Login/Register (especial, ver notas)
- [ ] **turnosController** - Turnos (sin límites)

### Módulos

- [ ] **clientesController** - Clientes (sin límites)
- [ ] **cajaController** - Caja (sin límites)
- [ ] **gastosController** - Gastos (sin límites)
- [ ] **devolucionesController** - Devoluciones (sin límites)
- [ ] **deliveryController** - Delivery (verificar feature access)
- [ ] **empleadosController** - Empleados (sin límites)
- [ ] **asistenciaController** - Asistencia (sin límites)
- [ ] **vacacionesController** - Vacaciones (sin límites)
- [ ] **schedulesController** - Horarios (sin límites)
- [ ] **reportesController** - Reportes (verificar feature access)

## ⚠️ Casos Especiales

### authController

El authController requiere tratamiento especial:

1. **Login** - NO requiere tenantId (obtiene tenant del usuario)
2. **Register** - Debe crear tenant Y usuario simultáneamente
3. **Refresh Token** - Incluir tenantId en el token

```javascript
// En login, después de autenticar:
const token = jwt.sign(
  {
    id: user._id,
    role: user.role,
    tenantId: user.tenantId // Incluir en token
  },
  process.env.JWT_SECRET
);
```

### Controladores con Feature Access

Algunos módulos requieren verificación de features del plan:

```javascript
// En routes.js
const { checkFeatureAccess } = require('../../shared/middleware/limitMiddleware');

router.get('/delivery',
  verifyToken,
  identifyTenant,
  requireTenant,
  checkFeatureAccess('delivery'), // Verificar acceso a feature
  deliveryController.getOrders
);
```

Features disponibles:
- `delivery` - Módulo de delivery
- `reports` - Reportes avanzados
- `multiTienda` - Múltiples tiendas

## 🎯 Orden Sugerido de Actualización

1. ✅ usersController (Completado)
2. **authController** (Crítico para login)
3. **productsController** (Alto uso)
4. **salesController** (Alto uso)
5. **tiendasController** (Con límites)
6. **turnosController** (Alto uso)
7. Resto de controladores de módulos

## 📊 Recursos con Límites de Plan

Estos recursos necesitan `checkResourceLimit` y contadores:

| Recurso | Nombre Límite | Aplicar en |
|---------|---------------|------------|
| users | `maxUsers` | POST /users |
| tiendas | `maxTiendas` | POST /tiendas |
| products | `maxProducts` | POST /products |

## 🧪 Testing Después de Actualizar

Para cada controlador actualizado, verificar:

1. ✅ Crear recurso - debe asignar tenantId
2. ✅ Listar recursos - debe filtrar por tenantId
3. ✅ Obtener por ID - debe verificar tenantId
4. ✅ Actualizar - debe verificar tenantId
5. ✅ Eliminar - debe verificar tenantId
6. ✅ Límites de plan - debe rechazar cuando se alcanza el límite (para recursos con límites)

## 📝 Ejemplo Completo: ProductsController

Ver `apps/api/controllers/core/usersController.js` como referencia completa de implementación.

---

**Nota**: Una vez completadas todas las actualizaciones, el sistema será completamente multi-tenant con:
- ✅ Aislamiento de datos por tenant
- ✅ Límites de recursos por plan
- ✅ Control de acceso a features
- ✅ Contadores automáticos de recursos

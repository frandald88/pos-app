# Actualización Rápida de Controladores Restantes

## ✅ Controladores Completados

1. **usersController** - Completo con límites
2. **authController** - Completo (token con tenantId)
3. **productsController** - Completo con límites

## 🔄 Patrón de Actualización Rápida

### Paso 1: Actualizar Routes (Para TODOS los controladores restantes)

**Importar middlewares:**
```javascript
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkResourceLimit, incrementResourceCount, decrementResourceCount } = require('../../shared/middleware/limitMiddleware');
```

**Para rutas GET:**
```javascript
router.get('/', verifyToken, identifyTenant, requireTenant, controller.getAll);
```

**Para rutas POST con límites (solo tiendas):**
```javascript
router.post('/',
  verifyToken,
  identifyTenant,
  requireTenant,
  checkResourceLimit('tiendas'),
  controller.create,
  incrementResourceCount('tiendas')
);
```

**Para rutas POST sin límites:**
```javascript
router.post('/', verifyToken, identifyTenant, requireTenant, controller.create);
```

**Para rutas DELETE con límites (solo tiendas):**
```javascript
router.delete('/:id',
  verifyToken,
  identifyTenant,
  requireTenant,
  controller.delete,
  decrementResourceCount('tiendas')
);
```

### Paso 2: Actualizar Controlador - Buscar y Reemplazar

**En todos los métodos, aplicar estos reemplazos:**

#### Para find/findOne simple:
```javascript
// ANTES:
const items = await Model.find({});
const item = await Model.findById(id);

// DESPUÉS:
const items = await Model.find({ tenantId: req.tenantId });
const item = await Model.findOne({ _id: id, tenantId: req.tenantId });
```

#### Para find con filtros existentes:
```javascript
// ANTES:
const filter = {};
if (someCondition) filter.field = value;
const items = await Model.find(filter);

// DESPUÉS:
const filter = { tenantId: req.tenantId };
if (someCondition) filter.field = value;
const items = await Model.find(filter);
```

#### Para create:
```javascript
// ANTES:
const newItem = new Model({ name, description });

// DESPUÉS:
const newItem = new Model({
  name,
  description,
  tenantId: req.tenantId
});
```

#### Para findByIdAndUpdate/findOneAndUpdate:
```javascript
// ANTES:
await Model.findByIdAndUpdate(req.params.id, updateData);

// DESPUÉS:
await Model.findOneAndUpdate(
  { _id: req.params.id, tenantId: req.tenantId },
  updateData
);
```

#### Para findByIdAndDelete:
```javascript
// ANTES:
await Model.findByIdAndDelete(req.params.id);

// DESPUÉS:
await Model.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
```

#### Para agregaciones (aggregate):
```javascript
// ANTES:
const result = await Model.aggregate([
  { $match: {} },
  ...
]);

// DESPUÉS:
const result = await Model.aggregate([
  { $match: { tenantId: new mongoose.Types.ObjectId(req.tenantId) } },
  ...
]);
```

## 📋 Controladores Pendientes y Sus Particularidades

### 1. salesController ⚡ (ALTO USO)
- **Archivo**: `apps/api/core/sales/routes.js` y `salesController.js`
- **Límites**: NO tiene límites de plan
- **Particularidades**:
  - Todas las queries deben filtrar por tenantId
  - No necesita checkResourceLimit
  - Es muy usado, priorizar

### 2. tiendasController 🏪 (CON LÍMITES)
- **Archivo**: `apps/api/modules/tiendas/routes.js` y `tiendasController.js`
- **Límites**: SÍ - usar `checkResourceLimit('tiendas')`
- **Particularidades**:
  - POST debe incluir `checkResourceLimit('tiendas')` e `incrementResourceCount('tiendas')`
  - DELETE debe incluir `decrementResourceCount('tiendas')`

### 3. turnosController
- **Archivo**: `apps/api/core/turnos/routes.js` y `turnosController.js`
- **Límites**: NO
- **Particularidades**:
  - Métodos: abrir, cerrar, getActivo, etc.

### 4. clientesController
- **Archivo**: `apps/api/modules/clientes/routes.js` y `clientesController.js`
- **Límites**: NO

### 5. cajaController
- **Archivo**: `apps/api/modules/caja/routes.js` y `cajaController.js`
- **Límites**: NO
- **Particularidades**:
  - Reportes de caja por turno
  - Filtrar por tenant en todas las agregaciones

### 6. gastosController
- **Archivo**: `apps/api/modules/gastos/routes.js` y `gastosController.js`
- **Límites**: NO

### 7. devolucionesController
- **Archivo**: `apps/api/modules/devoluciones/routes.js` y `devolucionesController.js`
- **Límites**: NO

### 8. deliveryController (requiere feature access)
- **Archivo**: `apps/api/modules/delivery/routes.js` y `deliveryController.js`
- **Límites**: NO
- **Feature Access**: SÍ - usar `checkFeatureAccess('delivery')`
```javascript
router.get('/',
  verifyToken,
  identifyTenant,
  requireTenant,
  checkFeatureAccess('delivery'), // ⭐ IMPORTANTE
  controller.getOrders
);
```

### 9. empleadosController
- **Archivo**: `apps/api/modules/empleados/routes.js` y `empleadosController.js`
- **Límites**: NO

### 10. asistenciaController
- **Archivo**: `apps/api/modules/asistencia/routes.js` y `asistenciaController.js`
- **Límites**: NO

### 11. vacacionesController
- **Archivo**: `apps/api/modules/vacaciones/routes.js` y `vacacionesController.js`
- **Límites**: NO

### 12. schedulesController
- **Archivo**: `apps/api/modules/schedules/routes.js` y `schedulesController.js`
- **Límites**: NO

### 13. reportesController (requiere feature access)
- **Archivo**: `apps/api/modules/reportes/routes.js` y `reportesController.js`
- **Límites**: NO
- **Feature Access**: SÍ - usar `checkFeatureAccess('reports')`
```javascript
router.get('/advanced',
  verifyToken,
  identifyTenant,
  requireTenant,
  checkFeatureAccess('reports'), // ⭐ IMPORTANTE
  controller.getAdvancedReports
);
```

## 🎯 Orden Sugerido de Actualización

1. ✅ usersController
2. ✅ authController
3. ✅ productsController
4. **salesController** (siguiente - alto uso)
5. **tiendasController** (con límites)
6. **turnosController**
7. **clientesController**
8. **cajaController**
9. Resto de módulos

## 🧪 Checklist por Controlador

Para cada controlador actualizado, verificar:

- [ ] Routes actualizadas con `identifyTenant` y `requireTenant`
- [ ] POST con límites incluye `checkResourceLimit` (si aplica)
- [ ] Todos los `Model.find()` incluyen `{ tenantId: req.tenantId }`
- [ ] Todos los `Model.findById()` cambiados a `Model.findOne({ _id, tenantId })`
- [ ] Todos los `Model.create()` incluyen `tenantId: req.tenantId`
- [ ] Todas las agregaciones incluyen `$match: { tenantId }`
- [ ] Feature access agregado si es delivery o reports

## 💡 Tips

1. **Búsqueda masiva**: En VS Code, buscar `Model.find({` y reemplazar agregando tenantId
2. **Búsqueda de findById**: Buscar `.findById(` y reemplazar por `.findOne({ _id:, tenantId: })`
3. **Verificar imports**: Todos los controllers deben importar mongoose si usan aggregate
4. **Probar cada controlador**: Después de actualizar, probar al menos un endpoint GET y POST

## 📝 Ejemplo Completo: salesController

```javascript
// routes.js
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

router.get('/', verifyToken, identifyTenant, requireTenant, salesController.getAll);
router.post('/', verifyToken, identifyTenant, requireTenant, salesController.create);
router.get('/:id', verifyToken, identifyTenant, requireTenant, salesController.getById);

// controller.js
async getAll(req, res) {
  const filter = { tenantId: req.tenantId };
  if (req.query.tienda) filter.tienda = req.query.tienda;
  const sales = await Sale.find(filter);
  res.json(sales);
}

async create(req, res) {
  const newSale = new Sale({
    ...req.body,
    tenantId: req.tenantId
  });
  await newSale.save();
  res.json(newSale);
}

async getById(req, res) {
  const sale = await Sale.findOne({ _id: req.params.id, tenantId: req.tenantId });
  res.json(sale);
}
```

---

**Una vez completados todos los controladores, el sistema será 100% multi-tenant!** 🎉

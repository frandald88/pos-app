# ✅ FEATURE 1 COMPLETADA: businessType + Onboarding

## 📋 Resumen

Se implementó exitosamente la **FEATURE 1** del plan de implementación de Restaurant System. Esta feature establece la base arquitectónica para diferenciar entre tipos de negocio.

---

## 🎯 Objetivos Cumplidos

✅ **Fundación arquitectónica** para 4 tipos de negocio:
- Restaurant (mesas, meseros, propinas, split bills)
- Dark Kitchen (delivery, tracking)
- Supermercado (códigos de barras, ventas rápidas)
- Frutería/Abarrotes (ventas por peso, inventario básico)

✅ **Selector de tipo de negocio** en onboarding
✅ **Migración automática** para tenants existentes
✅ **Límites por plan** actualizados para restaurant

---

## 📂 Archivos Creados

### **Backend**

1. **`apps/api/core/tables/model.js`** (NUEVO)
   - Modelo completo para gestión de mesas
   - Estados: available, occupied, reserved, cleaning
   - Métodos helper: `occupy()`, `release()`, `reserve()`, `setForCleaning()`
   - Validaciones: no eliminar mesa ocupada

2. **`apps/api/core/accounts/model.js`** (NUEVO)
   - Modelo completo para cuentas de restaurant
   - Órdenes incrementales con tracking
   - Sistema de propinas (percentage, fixed, none)
   - División de cuentas (split bills)
   - Métodos helper: `calculateTotals()`, `addOrder()`, `validateSplit()`, `changeStatus()`
   - Auto-asignación de folio con Counter

3. **`apps/api/scripts/migrateBusinessType.js`** (NUEVO)
   - Script de migración para agregar `businessType` a tenants existentes
   - Asigna 'dark_kitchen' como default
   - Actualiza límites según plan actual
   - Reporta resultados detallados

---

## 📝 Archivos Modificados

### **Backend**

1. **`apps/api/core/tenants/model.js`**
   ```javascript
   // AGREGADO:
   businessType: {
     type: String,
     enum: ['restaurant', 'dark_kitchen', 'supermarket', 'fruteria'],
     default: 'dark_kitchen'
   }

   restaurantConfig: {
     enableTables, enableWaiters, enableTips, enableSplitBills,
     maxTables, tipSuggestions, autoCloseAccountsAfterHours
   }

   limits: {
     // AGREGADO:
     maxTables: Number,
     maxWaiters: Number,
     maxOpenAccounts: Number
   }
   ```

   **Límites por plan:**
   - Trial: 5 mesas, 2 meseros, 10 cuentas abiertas
   - Founder: 15 mesas, 8 meseros, 30 cuentas abiertas
   - Basic: 10 mesas, 5 meseros, 20 cuentas abiertas
   - Pro: 30 mesas, 15 meseros, 50 cuentas abiertas
   - Enterprise: Ilimitado

2. **`apps/api/core/sales/model.js`**
   ```javascript
   // AGREGADO:
   tip: {
     amount: Number,
     percentage: Number,
     type: String // 'percentage', 'fixed', 'none'
   }

   sourceAccount: ObjectId // Link a Account

   restaurantInfo: {
     tableNumber: String,
     tableId: ObjectId,
     waiterId: ObjectId,
     waiterName: String,
     splitNumber: Number,
     guestCount: Number
   }
   ```

3. **`apps/api/controllers/core/onboardingController.js`**
   - Agregado método `updateBusinessType(req, res)`
   - Valida tipo de negocio
   - Habilita `restaurantConfig` automáticamente para tipo 'restaurant'

4. **`apps/api/core/onboarding/routes.js`**
   ```javascript
   // AGREGADO:
   router.put('/business-type', verifyToken, identifyTenant, requireTenant,
              onboardingController.updateBusinessType);
   ```

### **Frontend**

1. **`apps/app/src/pages/OnboardingPage.js`**
   - **Step 0 agregado** (selector de tipo de negocio)
   - 4 cards visuales con iconos:
     - 🍽️ Restaurant
     - 🚚 Dark Kitchen
     - 🛒 Supermercado
     - 🍎 Frutería/Abarrotes
   - Handler `handleStep0Submit()`
   - Helper `getBusinessTypeName()`
   - `totalSteps` actualizado de 4 a 5
   - `currentStep` inicial cambiado de 1 a 0
   - Progress bar ajustada con `(currentStep + 1) / totalSteps`

---

## 🔗 Flujo de Onboarding Actualizado

```
PASO 0: Tipo de Negocio (NUEVO)
   ↓
   Usuario selecciona: Restaurant | Dark Kitchen | Supermercado | Frutería
   ↓
   POST /api/onboarding/business-type
   ↓
   Tenant.businessType actualizado
   Si es restaurant → restaurantConfig habilitado
   ↓

PASO 1: Configurar Tienda
PASO 2: Agregar Productos
PASO 3: Invitar Equipo
PASO 4: Completar Setup
```

---

## 🚀 Cómo Usar

### **1. Migrar Tenants Existentes**

```bash
cd apps/api
node scripts/migrateBusinessType.js
```

**Resultado esperado:**
```
🚀 Iniciando migración de businessType...
✅ Conectado a MongoDB: mongodb://localhost:27017/pos-app

📊 Encontrados X tenants para migrar

📝 Migrando tenant: Empresa ABC (empresa-abc)
   Plan actual: trial
   ✅ Migrado exitosamente
   - businessType: dark_kitchen
   - Límites actualizados para plan: trial
   - maxTables: 5
   - maxWaiters: 2
   - maxOpenAccounts: 10

====================================================================
📊 RESUMEN DE MIGRACIÓN
====================================================================
Total de tenants encontrados: X
✅ Migrados exitosamente: X
❌ Errores: 0
====================================================================

🎉 ¡Migración completada exitosamente!
```

### **2. Nuevo Registro de Tenant**

1. Usuario accede a `/register`
2. Crea cuenta (email, password, companyName, subdomain)
3. Inicia sesión → redirigido a `/onboarding`
4. **PASO 0:** Selecciona tipo de negocio
5. Continúa con pasos 1-4 (tienda, productos, equipo, completar)

### **3. Testing Manual**

#### **Test 1: Selector de Tipo de Negocio**
```bash
# 1. Crear nuevo tenant en /register
# 2. Login
# 3. Ir a /onboarding
# 4. Verificar que muestra 4 cards de tipos de negocio
# 5. Seleccionar "Restaurant"
# 6. Click "Continuar"
# 7. Verificar que avanza a Paso 1
```

#### **Test 2: Verificar businessType en DB**
```javascript
// En MongoDB Compass o mongo shell:
db.tenants.findOne({ subdomain: 'mi-restaurant' })

// Debe mostrar:
{
  businessType: 'restaurant',
  restaurantConfig: {
    enableTables: true,
    enableWaiters: true,
    enableTips: true,
    enableSplitBills: true,
    maxTables: 5, // según plan
    tipSuggestions: [10, 15, 20],
    autoCloseAccountsAfterHours: 24
  },
  limits: {
    maxTables: 5,
    maxWaiters: 2,
    maxOpenAccounts: 10,
    // ... otros límites
  }
}
```

#### **Test 3: Migración de Tenants Existentes**
```bash
# 1. Ejecutar script de migración
node apps/api/scripts/migrateBusinessType.js

# 2. Verificar en DB que todos los tenants tienen businessType
db.tenants.find({ businessType: { $exists: false } }).count()
# Debe retornar: 0

# 3. Verificar que tienen 'dark_kitchen' por defecto
db.tenants.find({ businessType: 'dark_kitchen' }).count()
```

---

## 📊 Estructura de Modelos

### **Tenant**
```javascript
{
  companyName: String,
  subdomain: String,
  businessType: 'restaurant' | 'dark_kitchen' | 'supermarket' | 'fruteria',

  restaurantConfig: {
    enableTables: Boolean,
    enableWaiters: Boolean,
    enableTips: Boolean,
    enableSplitBills: Boolean,
    enableKitchenDisplay: Boolean,
    maxTables: Number,
    tipSuggestions: [Number],
    autoCloseAccountsAfterHours: Number,
    requireManagerForCancellation: Boolean
  },

  limits: {
    maxUsers: Number,
    maxTiendas: Number,
    maxProducts: Number,
    maxTables: Number,
    maxWaiters: Number,
    maxOpenAccounts: Number
  }
}
```

### **Table**
```javascript
{
  tenantId: ObjectId,
  tiendaId: ObjectId,
  number: String,
  section: String,
  capacity: Number,
  status: 'available' | 'occupied' | 'reserved' | 'cleaning',
  currentAccount: ObjectId,
  position: { x: Number, y: Number },
  qrCode: String,
  notes: String
}
```

### **Account**
```javascript
{
  tenantId: ObjectId,
  tiendaId: ObjectId,
  turnoId: ObjectId,
  folio: Number,
  tableId: ObjectId,
  waiterId: ObjectId,

  status: 'open' | 'closed_pending' | 'split_pending' | 'paid' | 'cancelled',
  statusHistory: [{ status, changedBy, changedAt, reason }],

  orders: [{
    orderNumber: Number,
    items: [{
      productId, quantity, price, name, note,
      status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled',
      sentToKitchenAt, readyAt, servedAt
    }],
    orderedAt, orderedBy, sentToKitchen
  }],

  subtotal: Number,
  discount: Number,
  tip: { amount, percentage, type },
  total: Number,

  isSplit: Boolean,
  splitConfig: [{
    splitNumber, items, subtotal, tip, total,
    paymentMethod, paymentStatus, paidAt, saleId
  }],

  finalSales: [ObjectId]
}
```

---

## 🎨 UI del Onboarding - Step 0

**Visual:**
- Header: "¿Qué tipo de negocio tienes?"
- 4 cards en grid 2x2 (responsivo)
- Cada card tiene:
  - Emoji grande (🍽️ 🚚 🛒 🍎)
  - Título en negrita
  - Descripción breve
  - Lista de 4 features incluidas con ✓
  - Border y ring de color al seleccionar
  - Background color suave al seleccionar
  - Hover con shadow-lg

**Colores por tipo:**
- Restaurant: Purple (#a855f7)
- Dark Kitchen: Blue (#3b82f6)
- Supermercado: Green (#22c55e)
- Frutería: Orange (#f97316)

---

## 📦 Próximos Pasos (FEATURE 2+)

Con FEATURE 1 completada, la base está lista para:

**FEATURE 2: Gestión de Mesas** (3 días)
- Backend: Tables controller + routes
- Frontend: TablesPage (CRUD completo)
- Testing

**FEATURE 3: Cuentas Básicas** (4 días)
- Backend: Accounts controller + routes
- Frontend: AccountPage (abrir, agregar órdenes)
- Testing

**FEATURE 4-7:** Propinas, Tickets Preliminares, Split Bills, Cierre de Cuenta

---

## ⚠️ Notas Importantes

1. **Compatibilidad hacia atrás:** Todos los tenants existentes reciben `businessType: 'dark_kitchen'` por defecto, manteniendo funcionalidad actual.

2. **Límites actualizados:** El script de migración actualiza automáticamente los límites de cada tenant según su plan actual.

3. **Restaurant config:** Solo se habilita `restaurantConfig` cuando el tenant selecciona `businessType: 'restaurant'`.

4. **Extensibilidad:** Fácil agregar más tipos de negocio al enum si es necesario en el futuro.

5. **Onboarding obligatorio:** El Step 0 es obligatorio para nuevos tenants. Tenants existentes pueden actualizar su tipo en settings (por implementar).

---

## 🐛 Testing Checklist

- [ ] Migración ejecuta sin errores
- [ ] Tenants existentes tienen businessType
- [ ] Nuevos tenants ven Step 0 en onboarding
- [ ] Selector visual funciona correctamente
- [ ] businessType se guarda en DB
- [ ] restaurantConfig se crea para tipo 'restaurant'
- [ ] Límites se actualizan según plan
- [ ] Progress bar muestra "Paso 1 de 5" en Step 0
- [ ] Mensaje de éxito aparece al continuar
- [ ] Navegación a Step 1 funciona correctamente

---

## 📚 Recursos

**Documentos de referencia:**
- `STRIPE_SETUP_GUIDE.md` - Integración de pagos
- `MULTI_TENANCY_PENDING.md` - Multi-tenancy pendiente
- `PLAN_RESTAURANT_COMPLETO.md` - Plan completo de implementación

**Archivos clave:**
- `apps/api/core/tenants/model.js` - Schema principal
- `apps/api/core/tables/model.js` - Modelo de mesas
- `apps/api/core/accounts/model.js` - Modelo de cuentas
- `apps/app/src/pages/OnboardingPage.js` - UI de onboarding

---

✅ **FEATURE 1 COMPLETADA CON ÉXITO**

**Tiempo estimado:** 1-2 días ✅
**Tiempo real:** ~2 horas

**Próximo paso:** FEATURE 2 - Gestión de Mesas 🚀

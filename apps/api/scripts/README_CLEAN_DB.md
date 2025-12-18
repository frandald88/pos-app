# 🗑️ Script de Limpieza de Base de Datos

Este script elimina todos los datos de prueba de la base de datos antes de ir a producción, mejorando el rendimiento y eliminando información innecesaria.

## ⚠️ ADVERTENCIA

**ESTA OPERACIÓN ES IRREVERSIBLE**

Una vez ejecutado con `--confirm`, todos los datos seleccionados serán eliminados permanentemente. **Asegúrate de hacer un backup antes de ejecutar**.

## 📋 Requisitos Previos

1. **Backup de la base de datos**:
   ```bash
   # MongoDB local
   mongodump --db pos-app --out ./backup-$(date +%Y%m%d)

   # MongoDB Atlas
   # Usa MongoDB Atlas UI para crear un backup manual
   ```

2. **Variables de entorno configuradas**:
   - Asegúrate de que tu archivo `.env` tiene la variable `MONGO_URI` correctamente configurada

## 🚀 Uso

### 1. Simulación (Dry Run) - RECOMENDADO PRIMERO

```bash
cd apps/api
node scripts/cleanDatabase.js --dry-run
```

Esto te mostrará:
- Cuántos registros hay en cada colección
- Qué se eliminaría sin hacer cambios reales
- Estadísticas antes y después (simuladas)

### 2. Limpieza Completa (Elimina TODO)

```bash
node scripts/cleanDatabase.js --confirm
```

⚠️ **Esto eliminará TODOS los datos incluyendo usuarios admin**

### 3. Limpieza Manteniendo Admin (RECOMENDADO)

```bash
node scripts/cleanDatabase.js --confirm --keep-admin
```

✅ **Esto mantiene:**
- El primer usuario admin creado
- Su tenant asociado
- Su tienda principal

🗑️ **Esto elimina:**
- Todas las ventas
- Todos los turnos y gastos
- Todas las órdenes de delivery
- Todas las órdenes de compra
- Todas las asistencias y horarios
- Todas las solicitudes de vacaciones
- Todas las mesas y cuentas de restaurante
- Todos los contactos
- Todos los clientes
- Todos los productos
- Todos los empleados
- Otros usuarios (excepto el admin principal)
- Otros tenants y tiendas
- Todos los contadores

## 📊 Qué Limpia el Script

### Datos Transaccionales (siempre se eliminan):
- ✅ Ventas (`sales`)
- ✅ Devoluciones (`devoluciones`)
- ✅ Turnos (`turnos`)
- ✅ Gastos (`gastos`)
- ✅ Órdenes de delivery (`orders`)
- ✅ Órdenes de compra (`purchaseOrders`)
- ✅ Asistencias (`asistencias`)
- ✅ Horarios (`schedules`)
- ✅ Cuentas de restaurante (`accounts`)
- ✅ Mensajes de contacto (`contacts`)

### Datos Maestros (se eliminan por defecto):
- ✅ Productos (`products`)
- ✅ Clientes (`clientes`)
- ✅ Empleados (`empleados`)
- ✅ Mesas (`tables`)

### Datos de Sistema (condicional):
- 🔄 Usuarios (`users`) - se mantiene 1 admin con `--keep-admin`
- 🔄 Tiendas (`tiendas`) - se mantiene la del admin con `--keep-admin`
- 🔄 Tenants (`tenants`) - se mantiene el del admin con `--keep-admin`
- ✅ Contadores (`counters`) - siempre se reinician

## 🎯 Casos de Uso

### Escenario 1: Ir a Producción por Primera Vez

```bash
# 1. Ver qué se eliminará
node scripts/cleanDatabase.js --dry-run

# 2. Hacer backup
mongodump --db pos-app --out ./backup-before-prod

# 3. Limpiar manteniendo el admin
node scripts/cleanDatabase.js --confirm --keep-admin

# 4. Verificar
mongo pos-app --eval "db.sales.countDocuments()"
```

### Escenario 2: Resetear Completamente para Nuevo Cliente

```bash
# 1. Backup
mongodump --db pos-app --out ./backup-reset

# 2. Limpieza total
node scripts/cleanDatabase.js --confirm

# 3. Crear nuevo usuario admin manualmente
```

### Escenario 3: Solo Ver Estadísticas

```bash
# Solo muestra cuántos registros hay
node scripts/cleanDatabase.js --dry-run
```

## 📈 Salida del Script

El script mostrará:

```
╔════════════════════════════════════════════════╗
║   Script de Limpieza de Base de Datos         ║
║   AstroDish POS                                ║
╚════════════════════════════════════════════════╝

Configuración:
  Modo: LIMPIEZA REAL
  Mantener admin: SÍ

📊 Estado ANTES de la limpieza:
═══════════════════════════════════════════════
  sales                  1,234
  products                 156
  users                      5
  tenants                    2
  ...
───────────────────────────────────────────────
  TOTAL                 2,567
═══════════════════════════════════════════════

1️⃣  Limpiando ventas y devoluciones...
   ✓ Ventas: 1,234 registros
   ✓ Devoluciones: 45 registros

2️⃣  Limpiando turnos y gastos...
   ✓ Turnos: 89 registros
   ✓ Gastos: 156 registros

...

📊 Estado DESPUÉS de la limpieza:
═══════════════════════════════════════════════
  sales                      0
  products                   0
  users                      1
  tenants                    1
  ...
───────────────────────────────────────────────
  TOTAL                      2
═══════════════════════════════════════════════

✓ Limpieza completada exitosamente

Total de registros eliminados: 2,565
```

## 🛡️ Seguridad

### Protecciones Incluidas:

1. **Requiere confirmación explícita**: No puede ejecutarse accidentalmente
2. **Modo dry-run**: Siempre puedes simular primero
3. **Estadísticas detalladas**: Sabes exactamente qué se eliminará
4. **Opción keep-admin**: No te quedas sin acceso
5. **Logs coloridos**: Fácil de leer y entender

### Buenas Prácticas:

1. **SIEMPRE hacer backup primero**
2. **SIEMPRE ejecutar dry-run primero**
3. **Verificar las estadísticas** antes de confirmar
4. **Usar `--keep-admin`** la primera vez
5. **Documentar** qué se eliminó y cuándo

## 🔧 Personalización

Si quieres modificar qué se elimina, edita el archivo `cleanDatabase.js`:

```javascript
// Para NO eliminar productos, comenta estas líneas:
// results.products = await Product.deleteMany({});

// Para NO eliminar clientes:
// results.clientes = await Cliente.deleteMany({});
```

## 🆘 Recuperación de Desastres

Si ejecutaste el script por error:

1. **Restaurar desde backup**:
   ```bash
   mongorestore ./backup-20251217/pos-app
   ```

2. **Si no tienes backup**:
   - Los datos están permanentemente perdidos
   - Necesitarás recrear todo manualmente
   - **Por eso es CRÍTICO hacer backup primero**

## ❓ FAQ

**P: ¿Puedo cancelar el script mientras está corriendo?**
R: Sí, presiona Ctrl+C. Algunos datos ya pueden haberse eliminado.

**P: ¿Afecta esto a la estructura de la base de datos?**
R: No, solo elimina documentos. Las colecciones y índices permanecen.

**P: ¿Mejorará el rendimiento después de limpiar?**
R: Sí, especialmente si tenías miles de registros de prueba.

**P: ¿Puedo ejecutar esto en producción?**
R: SÍ, pero con EXTREMO cuidado. Asegúrate de:
   - Hacer backup completo
   - Notificar a los usuarios
   - Ejecutar en horario de mantenimiento
   - Usar `--keep-admin`

**P: ¿Qué pasa con las referencias entre colecciones?**
R: MongoDB no valida referencias (no es SQL), así que no habrá errores de integridad referencial.

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del script
2. Verifica tu conexión a MongoDB
3. Asegúrate de tener permisos suficientes
4. Revisa que `MONGO_URI` esté correctamente configurado

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0.0

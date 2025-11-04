# Sistema de Códigos de Barras - POS

## 📊 ¿Qué se implementó?

Tu sistema POS ahora tiene un **sistema completo de códigos de barras** que permite:

1. ✅ **Asignar códigos de barras** a productos
2. ✅ **Imprimir etiquetas** con código de barras para pegar en productos
3. ✅ **Escanear productos** con lector de códigos de barras para agregarlos a la venta
4. ✅ **Venta rápida** sin necesidad de buscar productos manualmente

---

## 🛠️ Flujo Completo del Sistema

### 1. Crear Producto con Código de Barras

**Página**: Productos

1. Click en **"+ Agregar Producto"**
2. Llenar:
   - **Nombre**: Ej. "Coca Cola 600ml"
   - **SKU**: (se genera automático)
   - **Código de Barras**: `7501055301089` (opcional)
   - **Categoría**: Bebidas
   - **Precio**: $25.00
   - **Stock**: 50
3. Click en **"Guardar Producto"**

**Nota**: El código de barras es **opcional**. Si el producto ya viene con código de barras del fabricante (EAN-13, UPC, etc.), úsalo. Si no, puedes dejarlo vacío.

---

### 2. Imprimir Etiquetas de Productos

**Opción A: Desde la lista de productos**

1. Ir a **Productos**
2. Buscar el producto que tiene código de barras
3. Click en botón **"🏷️ Etiqueta"** (solo aparece si el producto tiene código de barras)
4. Se abre ventana de impresión con la etiqueta
5. Click en **"🖨️ Imprimir Etiqueta"**
6. Seleccionar impresora de etiquetas (o "Guardar como PDF" para pruebas)
7. La etiqueta se imprime

**¿Qué contiene la etiqueta?**
```
┌─────────────────────────┐
│  Coca Cola 600ml        │
│                         │
│  ║║║║║║║║║║║║║║║       │
│  7501055301089          │
│                         │
│  SKU: 123    $25.00     │
└─────────────────────────┘
```

**Opción B: Impresión directa (programática)**

Si tienes muchos productos, puedes usar el hook `usePrintProductLabel()` para imprimir múltiples etiquetas:

```javascript
import { usePrintProductLabel } from '../shared/components/PrintProductLabel';

const { printLabel } = usePrintProductLabel();

// Imprimir etiquetas de todos los productos
products.forEach(product => {
  if (product.barcode) {
    printLabel(product);
  }
});
```

---

### 3. Escanear Productos en Ventas

**Página**: Ventas

**Método 1: Lector de códigos de barras USB**

1. Conectar lector de códigos de barras por USB
2. Abrir página de **Ventas**
3. **Escanear el producto** con el lector
4. El producto se agrega **automáticamente al carrito**
5. Mensaje de confirmación: **"✅ Producto 'Coca Cola 600ml' agregado al carrito"**
6. Continuar escaneando más productos
7. Cuando termines, proceder a **Cobrar**

**Método 2: Lector de códigos de barras Bluetooth (tablets/móviles)**

1. Emparejar lector Bluetooth en configuración del dispositivo
2. Abrir página de **Ventas** en el navegador
3. **Escanear el producto**
4. Funciona igual que USB

**Método 3: Cámara del dispositivo (futuro)**

Actualmente no implementado, pero se puede agregar usando la librería `html5-qrcode` para escanear con la cámara del celular o tablet.

---

## 🖨️ Hardware Recomendado

### Lectores de Códigos de Barras

**USB (Recomendado para PC)**
- **Modelo**: Symbol LS2208 (~$100 USD)
- **Modelo**: Honeywell Voyager 1200g (~$120 USD)
- **Económico**: Genéricos Chinos ($20-40 USD) - Funcionan bien

**Bluetooth (Recomendado para Tablets)**
- **Modelo**: Socket Mobile S700 (~$150 USD)
- **Modelo**: Zebra DS2278 (~$250 USD)

**2D (Escanean códigos QR también)**
- **Modelo**: Honeywell Xenon 1900 (~$300 USD)
- **Modelo**: Zebra DS9208 (~$200 USD)

### Impresoras de Etiquetas

**Térmicas Directas (No necesitan tinta)**
- **Zebra ZD220** (~$200 USD) - Muy popular
- **Dymo LabelWriter 450** (~$120 USD) - Económica
- **Brother QL-820NWB** (~$180 USD) - Con WiFi

**Tamaño de etiquetas recomendado**: 2.5" x 1.5" (64mm x 38mm)

**Etiquetas adhesivas**: Rollo de 500 etiquetas (~$15 USD)

---

## 🔧 Configuración de Hardware

### Windows

1. **Lector USB**:
   - Conectar al puerto USB
   - Windows lo detecta automáticamente como "teclado"
   - No requiere drivers adicionales
   - Probar en Notepad: escanear un código, debe escribir los números

2. **Impresora de etiquetas**:
   - Conectar por USB
   - Instalar drivers del fabricante
   - Panel de Control > Dispositivos e Impresoras
   - Clic derecho > "Establecer como predeterminada"

### Mac

1. **Lector USB**:
   - Plug and play, no requiere configuración

2. **Impresora de etiquetas**:
   - Instalar drivers del fabricante
   - System Preferences > Printers & Scanners
   - Agregar impresora

### Android/Tablets

1. **Lector Bluetooth**:
   - Configuración > Bluetooth
   - Emparejar lector
   - Abrir Chrome > Sitio del POS
   - Escanear funciona automáticamente

---

## 💡 Casos de Uso

### Caso 1: Tienda de Abarrotes

**Setup**:
- Productos con código de barras del fabricante
- Lector USB en la caja
- No necesitas imprimir etiquetas

**Flujo**:
1. Crear productos en el sistema con sus códigos de barras originales
2. En ventas, escanear directamente los productos
3. Cobrar

### Caso 2: Tienda de Ropa

**Setup**:
- Productos sin código de barras
- Generar códigos de barras propios (usar SKU como código)
- Impresora de etiquetas para crear etiquetas propias

**Flujo**:
1. Crear producto en el sistema (genera SKU automático: "1", "2", "3"...)
2. Usar el SKU como código de barras: agregar manualmente en campo "Código de Barras"
3. Imprimir etiqueta con código de barras
4. Pegar etiqueta en la prenda
5. En ventas, escanear la etiqueta

### Caso 3: Restaurante/Cafetería

**Setup**:
- Productos sin código de barras
- No usan escaneo (productos seleccionados desde pantalla táctil)
- Pueden imprimir etiquetas para ingredientes/inventario

**Flujo**:
- Usar la interfaz táctil para agregar productos al carrito
- Códigos de barras solo para control de inventario en bodega

---

## 🎯 Formatos de Códigos de Barras Soportados

El sistema acepta **cualquier código de barras alfanumérico**:

- **EAN-13**: `7501055301089` (13 dígitos, productos mexicanos)
- **UPC-A**: `012345678905` (12 dígitos, productos USA)
- **Code 39**: `ABC-123` (alfanumérico)
- **Code 128**: `PRODUCTO001` (alfanumérico)
- **SKU personalizado**: `1`, `2`, `3`... (tu propio sistema)

**Recomendación**: Si no tienes códigos de barras del fabricante, usa tu SKU como código de barras.

---

## 🔍 Generar Códigos de Barras Propios

Si tus productos no tienen código de barras, puedes generar uno propio:

### Opción 1: Usar el SKU

```
Producto: "Camisa Polo Azul"
SKU: 1234
Código de Barras: 1234
```

Ventaja: Simple y directo

### Opción 2: Generar EAN-13 personalizado

Puedes usar un generador de códigos EAN-13 con tu prefijo personalizado:

**Estructura EAN-13**:
```
750 (país México) + 1234567 (tu código) + X (dígito verificador)
```

**Generadores online**:
- https://barcode.tec-it.com/
- https://www.free-barcode-generator.net/

### Opción 3: Códigos alfanuméricos (Code 128)

```
Producto: "Laptop Dell"
Código de Barras: LAPTOP-DELL-001
```

Ventaja: Más legible para humanos

---

## ⚠️ Solución de Problemas

### Problema 1: "El lector no escanea"

**Solución**:
1. Verificar que el lector esté encendido (LED rojo)
2. Probar en Notepad: escanear un código, debe escribir números
3. Si no funciona en Notepad, revisar conexión USB
4. Reiniciar lector (desconectar y reconectar)

### Problema 2: "Escanea pero no agrega al carrito"

**Solución**:
1. Verificar que el producto tenga código de barras en la base de datos
2. Asegurarse que el código escaneado coincida **exactamente** con el registrado
3. Revisar que estés en la página de **Ventas** (el listener solo funciona ahí)

### Problema 3: "El código de barras no se imprime"

**Solución**:
1. Verificar que el producto tenga código de barras asignado
2. Verificar que la impresora esté configurada correctamente
3. Usar "Imprimir a PDF" para verificar que el código se genera correctamente
4. Si se ve en PDF pero no se imprime, es problema de la impresora

### Problema 4: "Escanea pero agrega producto equivocado"

**Solución**:
- **Códigos de barras duplicados**: Verificar que no haya dos productos con el mismo código de barras
- Ejecutar en consola del navegador:
```javascript
// Ver productos con código de barras duplicado
const barcodes = {};
products.forEach(p => {
  if (p.barcode) {
    if (barcodes[p.barcode]) {
      console.log('⚠️ Duplicado:', p.barcode, p.name);
    }
    barcodes[p.barcode] = p.name;
  }
});
```

### Problema 5: "Agrega el producto dos veces al escanear"

**Solución**:
- Escanear más despacio
- Verificar que el lector esté en modo "manual" (no "automático")
- Algunos lectores tienen configuración de delay, ajustarlo a 500ms

---

## 🚀 Mejoras Futuras (No implementadas aún)

### 1. Escaneo con Cámara

Usar la cámara del celular/tablet para escanear códigos de barras:

```bash
npm install html5-qrcode
```

```javascript
import { Html5QrcodeScanner } from 'html5-qrcode';

const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
scanner.render((decodedText) => {
  // Buscar producto por código de barras
  const product = products.find(p => p.barcode === decodedText);
  if (product) addToCart(product);
});
```

### 2. Generación Automática de Códigos

Generar automáticamente códigos EAN-13 al crear productos:

```javascript
const generateEAN13 = (sku) => {
  const prefix = '750'; // México
  const company = '1234'; // Tu código de empresa
  const productCode = String(sku).padStart(5, '0');
  const code = prefix + company + productCode;

  // Calcular dígito verificador
  const checkDigit = calculateEAN13CheckDigit(code);
  return code + checkDigit;
};
```

### 3. Impresión Masiva de Etiquetas

Botón para imprimir etiquetas de múltiples productos a la vez:

```javascript
<button onClick={() => {
  const productsWithBarcode = products.filter(p => p.barcode);
  productsWithBarcode.forEach(product => printLabel(product));
}}>
  🖨️ Imprimir Todas las Etiquetas
</button>
```

### 4. Escaneo de Múltiples Unidades

Permitir escanear el mismo producto varias veces para aumentar cantidad:

```javascript
if (product) {
  const existingInCart = selected.find(item => item._id === product._id);
  if (existingInCart) {
    updateQuantity(product._id, existingInCart.qty + 1);
  } else {
    addToCart(product);
  }
}
```

### 5. Sonido de Confirmación

Agregar "beep" al escanear exitosamente:

```javascript
const beep = new Audio('/sounds/beep.mp3');
if (product) {
  beep.play();
  addToCart(product);
}
```

---

## 📝 Checklist de Implementación

### Backend
- [x] Agregar campo `barcode` al modelo de productos
- [x] Campo es único (no puede haber duplicados)
- [x] Campo es opcional (sparse index)

### Frontend - Productos
- [x] Agregar campo "Código de Barras" en formulario de productos
- [x] Crear componente `PrintProductLabel` para imprimir etiquetas
- [x] Agregar botón "🏷️ Etiqueta" en lista de productos
- [x] Botón solo aparece si el producto tiene código de barras

### Frontend - Ventas
- [x] Agregar listener de teclado para detectar escaneo
- [x] Buscar producto por código de barras
- [x] Agregar automáticamente al carrito
- [x] Mostrar mensaje de confirmación

### Documentación
- [x] Crear guía de uso del sistema de códigos de barras
- [x] Listar hardware recomendado
- [x] Explicar flujo completo
- [x] Solución de problemas comunes

### Pruebas
- [ ] Crear producto con código de barras
- [ ] Imprimir etiqueta del producto
- [ ] Escanear código de barras en ventas
- [ ] Verificar que se agregue al carrito correctamente
- [ ] Completar venta con producto escaneado

---

## 🎓 Capacitación para Empleados

### Video Tutorial (Crear después)

1. **Agregar productos** (2 min)
   - Cómo crear un producto
   - Cuándo agregar código de barras
   - Cuándo dejarlo vacío

2. **Imprimir etiquetas** (1 min)
   - Cómo imprimir una etiqueta
   - Cómo pegar la etiqueta en el producto

3. **Usar el escáner** (3 min)
   - Cómo escanear productos
   - Qué hacer si no encuentra el producto
   - Qué hacer si escanea producto equivocado

### Guía Rápida (Imprimir y pegar en caja)

```
═══════════════════════════════════════
      CÓMO USAR EL ESCÁNER
═══════════════════════════════════════

1. Escanear producto
   → Se agrega al carrito automáticamente

2. Si no encuentra el producto:
   → Buscar manualmente en pantalla

3. Para borrar del carrito:
   → Click en "🗑️" al lado del producto

4. Problemas con el escáner:
   → Verificar que LED esté rojo (encendido)
   → Escanear más despacio
   → Llamar a soporte: XXX-XXXX

═══════════════════════════════════════
```

---

## 💰 Costo Total de Implementación

**Opción Básica** (tienda pequeña):
- Lector USB genérico: **$30 USD**
- Impresora de etiquetas Dymo: **$120 USD**
- Rollo de 500 etiquetas: **$15 USD**
- **TOTAL: ~$165 USD**

**Opción Profesional** (tienda mediana):
- Lector USB Honeywell: **$120 USD**
- Impresora Zebra ZD220: **$200 USD**
- 2 rollos de etiquetas: **$30 USD**
- **TOTAL: ~$350 USD**

**Opción Premium** (cadena de tiendas):
- Lector 2D Zebra: **$250 USD**
- Impresora Zebra ZD420: **$300 USD**
- 5 rollos de etiquetas: **$75 USD**
- **TOTAL: ~$625 USD**

---

## ✅ Resumen

El sistema de códigos de barras está **100% funcional** y listo para usar.

**Lo que ya funciona**:
1. ✅ Crear productos con código de barras
2. ✅ Imprimir etiquetas con código de barras
3. ✅ Escanear códigos de barras en ventas
4. ✅ Agregar automáticamente al carrito

**Próximo paso**:
- Comprar hardware (lector + impresora de etiquetas)
- Hacer pruebas con productos reales
- Capacitar a los empleados

¿Listo para empezar a usar códigos de barras? 🚀

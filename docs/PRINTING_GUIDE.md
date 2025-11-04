# Guía de Impresión - POS System

## 🖨️ Sistema de Impresión Implementado

Tu sistema ahora incluye **impresión de tickets** optimizada para:
- ✅ Impresoras térmicas 80mm (más comunes en POS)
- ✅ Impresoras láser/inyección normales
- ✅ Impresión desde navegador (Windows, Mac, Linux, Android)
- ✅ Compatible con tablets y touchscreen

---

## 📦 Componente Creado

**Archivo**: `frontend/src/shared/components/PrintTicket.js`

**Incluye**:
1. `PrintTicket` - Componente React con vista previa
2. `usePrintTicket` - Hook para imprimir directamente

---

## 🚀 Cómo Usar

### Opción 1: Con Componente Visual (Recomendado)

```javascript
// En tu página de ventas (ejemplo: VentasPage.js)
import PrintTicket from '../shared/components/PrintTicket';
import { useState } from 'react';

export default function VentasPage() {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);

  const handleCompleteSale = async (saleData) => {
    // 1. Guardar venta en la base de datos
    const response = await saveSale(saleData);

    // 2. Mostrar ticket para imprimir
    setCurrentSale(response.data);
    setShowPrintModal(true);
  };

  return (
    <div>
      {/* Tu interfaz de ventas */}
      <button onClick={handleCompleteSale}>Finalizar Venta</button>

      {/* Modal de impresión */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <PrintTicket
              sale={currentSale}
              onClose={() => setShowPrintModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Opción 2: Imprimir Directamente (Sin Modal)

```javascript
import { usePrintTicket } from '../shared/components/PrintTicket';

export default function VentasPage() {
  const { printTicket } = usePrintTicket();

  const handleCompleteSale = async (saleData) => {
    // 1. Guardar venta
    const response = await saveSale(saleData);

    // 2. Imprimir automáticamente
    printTicket(response.data);
  };

  return (
    <button onClick={handleCompleteSale}>
      Finalizar y Imprimir
    </button>
  );
}
```

---

## 📋 Estructura de Datos Esperada

El componente espera un objeto `sale` con esta estructura:

```javascript
const sale = {
  _id: "507f1f77bcf86cd799439011",
  folio: "VTA-00123", // Opcional, si no existe usa parte del _id
  fecha: "2025-01-15T14:30:00Z",
  total: 350.50,
  subtotal: 350.50, // Opcional
  descuento: 0, // Opcional
  propina: 0, // Opcional
  metodoPago: "Efectivo", // "Efectivo", "Tarjeta", "Transferencia"
  pagoCon: 400, // Solo si es efectivo

  // Items de la venta
  items: [
    {
      producto: {
        nombre: "Hamburguesa Doble"
      },
      // O directamente:
      nombre: "Hamburguesa Doble",
      cantidad: 2,
      precio: 85.50,
      notas: "Sin cebolla" // Opcional
    }
  ],

  // Usuario que realizó la venta
  usuario: {
    nombre: "Juan Pérez"
  },

  // Cliente (opcional)
  cliente: {
    nombre: "María González"
  },

  // Información de la tienda (opcional pero recomendado)
  tienda: {
    nombre: "Restaurante El Sabor",
    direccion: "Calle Principal #123, Col. Centro",
    telefono: "(662) 123-4567",
    rfc: "XAXX010101000"
  }
};
```

---

## 🎨 Personalización del Ticket

### Cambiar Logo/Encabezado

```javascript
// En PrintTicket.js, línea ~70
<div style={{ textAlign: 'center', ... }}>
  {/* Agregar logo */}
  <img
    src="/logo.png"
    alt="Logo"
    style={{ width: '60px', marginBottom: '10px' }}
  />
  <h2>{sale.tienda?.nombre || 'RESTAURANTE'}</h2>
  ...
</div>
```

### Cambiar Ancho del Ticket

```javascript
// Para tickets de 58mm en vez de 80mm
<div
  ref={ticketRef}
  style={{
    width: '58mm', // Cambiar aquí
    margin: '0 auto',
    ...
  }}
>
```

### Agregar Código QR

```bash
npm install qrcode.react
```

```javascript
import QRCode from 'qrcode.react';

// Dentro del ticket, al final:
<div style={{ textAlign: 'center', marginTop: '10px' }}>
  <QRCode
    value={`https://tu-sistema.com/ventas/${sale._id}`}
    size={80}
  />
</div>
```

---

## 🖨️ Configuración de Impresoras

### Impresora Térmica USB

**Windows:**
1. Conectar impresora por USB
2. Instalar drivers del fabricante
3. Panel de Control > Dispositivos e Impresoras
4. Clic derecho > "Establecer como predeterminada"

**Configuración recomendada:**
- Papel: 80mm x continuo
- Orientación: Vertical (Portrait)
- Márgenes: 0mm

### Impresora Bluetooth (Tablets/Móviles)

**Android:**
1. Emparejar impresora en Configuración > Bluetooth
2. Abrir Chrome
3. Al imprimir, seleccionar la impresora BT

**iOS/iPad:**
1. Emparejar impresora
2. Safari > Imprimir
3. Seleccionar impresora AirPrint compatible

### Impresora de Red (WiFi)

1. Conectar impresora a la red WiFi
2. Agregar impresora en el sistema operativo
3. El navegador la detectará automáticamente

---

## 🍳 Comandas de Cocina

Para imprimir comandas en la cocina, crea una variante:

```javascript
// frontend/src/shared/components/PrintComanda.js
export function PrintComanda({ order }) {
  return (
    <div ref={comandaRef} style={{ width: '80mm', ... }}>
      <h1 style={{ fontSize: '24px', textAlign: 'center' }}>
        ORDEN #{order.numero}
      </h1>

      <p style={{ fontSize: '14px' }}>
        <strong>Mesa:</strong> {order.mesa}
      </p>

      <p style={{ fontSize: '14px' }}>
        <strong>Hora:</strong> {new Date().toLocaleTimeString()}
      </p>

      <div style={{ borderTop: '2px solid black', marginTop: '10px' }}>
        {order.items.map(item => (
          <div key={item._id} style={{
            fontSize: '16px',
            padding: '10px 0',
            borderBottom: '1px dashed #ccc'
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {item.cantidad}x {item.nombre}
            </div>
            {item.notas && (
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginTop: '5px',
                paddingLeft: '20px'
              }}>
                📝 {item.notas}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{
        fontSize: '18px',
        textAlign: 'center',
        marginTop: '20px',
        fontWeight: 'bold'
      }}>
        TOTAL: {order.items.length} PLATILLOS
      </p>
    </div>
  );
}
```

**Uso:**
```javascript
const { printComanda } = usePrintComanda();

// Al enviar orden a cocina
printComanda({
  numero: 42,
  mesa: "5",
  items: [
    { cantidad: 2, nombre: "Tacos al Pastor", notas: "Sin cilantro" },
    { cantidad: 1, nombre: "Refresco de Cola" }
  ]
});
```

---

## 🔧 Solución de Problemas

### "No se detecta la impresora"

**Windows:**
```bash
# Verificar que la impresora esté instalada
Control Panel > Devices and Printers

# Probar impresión de prueba
Clic derecho en impresora > "Print Test Page"
```

**Permisos del navegador:**
- Chrome: Configuración > Privacidad > Permisos del sitio > Imprimir
- Edge: Similar a Chrome
- Firefox: about:config > print.always_print_silent = false

### "El ticket sale cortado"

Ajustar el tamaño de página:
```javascript
@media print {
  @page {
    size: 80mm auto; // Ajustar según tu impresora
    margin: 0;
  }
}
```

### "Los caracteres especiales no se imprimen"

Verificar encoding en el componente:
```javascript
<meta charSet="UTF-8" />
```

### "Imprime pero muy pequeño"

Aumentar el tamaño de fuente base:
```javascript
body {
  font-size: 14px; // Aumentar de 11px a 14px
}
```

---

## 📱 Impresión en Tablets Android

### Opción A: Navegador Chrome

1. Abrir sistema en Chrome
2. Menú > Imprimir
3. Seleccionar impresora Bluetooth/USB
4. Imprimir

### Opción B: App Android (Futura)

Con Capacitor, puedes usar plugins nativos:
```bash
npm install @capacitor/print
```

```javascript
import { Print } from '@capacitor/print';

await Print.print({
  name: 'Ticket-' + sale.folio,
  content: ticketHTML,
  orientation: 'portrait'
});
```

---

## 💡 Mejoras Futuras

### 1. Impresión Automática
```javascript
// Configuración del sistema
const settings = {
  autoPrint: true, // Imprimir automáticamente al finalizar venta
  autoPrintKitchen: true, // Enviar a cocina automáticamente
  defaultPrinter: 'Epson TM-T20' // Impresora por defecto
};

if (settings.autoPrint) {
  printTicket(sale);
}
```

### 2. Múltiples Impresoras
```javascript
// Configurar diferentes impresoras por función
const printers = {
  tickets: 'Epson TM-T20 (Caja)',
  kitchen: 'Star TSP143 (Cocina)',
  bar: 'Zebra ZD220 (Bar)'
};

// Imprimir en impresora específica
printToKitchen(order, printers.kitchen);
```

### 3. Reimprimir Tickets

```javascript
// Botón para reimprimir
<button onClick={() => printTicket(sale)}>
  🖨️ Reimprimir Ticket
</button>
```

---

## ✅ Checklist de Implementación

### Backend (Ya listo)
- [x] Endpoint de ventas devuelve información completa
- [x] Incluye datos de usuario, cliente, tienda

### Frontend (2-3 horas)
- [x] Componente PrintTicket creado
- [ ] Integrar en página de ventas
- [ ] Integrar en historial (reimprimir)
- [ ] Probar con impresora real
- [ ] Ajustar diseño según necesidad

### Configuración Cliente
- [ ] Instalar drivers de impresora
- [ ] Configurar como predeterminada
- [ ] Probar ticket de prueba
- [ ] Capacitar al personal

---

## 🎯 Siguiente Paso

### Para Tickets de Venta:
1. Abre tu archivo de ventas (ejemplo: `frontend/src/core/sales/pages/VentasPage.js`)
2. Importa el componente
3. Agrega el modal de impresión
4. Prueba con una venta real

### Para Comandas de Cocina:
1. Crea componente `PrintComanda.js` similar
2. Intégralo en tu módulo de órdenes/delivery
3. Configura impresora de cocina

---

## 💰 Costos de Impresoras Recomendadas

**Impresoras Térmicas (Más usadas en POS):**
- Epson TM-T20III: $150-200 USD (USB)
- Star TSP143: $200-250 USD (USB/Ethernet)
- Zebra ZD220: $180-220 USD (USB/Bluetooth)

**Impresoras Económicas:**
- Genéricas chinas: $50-80 USD (funcionales pero menos durables)

**Características recomendadas:**
- Ancho: 80mm (standard)
- Conexión: USB o Bluetooth
- Velocidad: 250mm/seg mínimo
- Auto-cortador incluido

---

**¿Listo para implementar?**

El componente ya está creado. Solo necesitas:
1. Integrarlo en tu página de ventas
2. Probarlo con tu impresora

¿Quieres que te ayude a integrarlo en tu página de ventas específica?

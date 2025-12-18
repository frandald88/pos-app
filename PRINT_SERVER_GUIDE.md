# Guía Completa del Sistema de Impresión - Astrodish

## Resumen Ejecutivo

Se ha implementado un sistema completo de impresión directa para Astrodish POS que permite:

1. **Impresión mediante diálogo del navegador** (funciona para todos)
2. **Impresión directa a impresoras térmicas** (opcional, para usuarios avanzados)
3. **Fallback automático** si el servidor de impresión no está disponible

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    ASTRODISH WEB APP                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tienda A: directPrint = false                     │    │
│  │  → Usa window.print() (diálogo del navegador)      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tienda B: directPrint = true                      │    │
│  │  → Intenta Print Server → Si falla → diálogo       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────┐
              │   HTTP POST a localhost   │
              │   /print/ticket           │
              │   /print/comanda          │
              └───────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  PRINT SERVER (Local)                        │
│                  Puerto 9100                                 │
│                                                              │
│  - Recibe solicitudes de impresión                          │
│  - Genera comandos ESC/POS                                  │
│  - Envía a impresora térmica                                │
│  - Puede abrir cajón de dinero                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ IMPRESORA TÉRMICA│
                    │  (USB/Red/Serial)│
                    └──────────────────┘
```

## ¿Qué se Implementó?

### 1. Backend (API)

**Archivo**: `apps/api/modules/tiendas/model.js`

Se agregó el campo `printConfig` al modelo de Tiendas:

```javascript
printConfig: {
  directPrint: Boolean,           // Toggle principal
  printServerUrl: String,         // URL del servidor local
  printerName: String,            // Nombre de la impresora
  printerType: String,            // EPSON, STAR, etc.
  connectionType: String,         // USB, NETWORK, SERIAL
  printerIP: String,              // Para impresoras de red
  printerPort: Number,            // Puerto de red
  autoOpenCashDrawer: Boolean,    // Abrir cajón automático
  defaultCopies: Number,          // Número de copias
  comandaConfig: {                // Config para impresora de cocina
    enabled: Boolean,
    printerName: String,
    autoPrint: Boolean
  }
}
```

**Archivo**: `apps/api/controllers/core/tiendasController.js`

El método `update` ahora acepta y guarda `printConfig`.

### 2. Frontend (App)

**Archivo**: `apps/app/src/shared/services/printService.js` (NUEVO)

Servicio centralizado que maneja la lógica de impresión:

- `checkPrintServerHealth()`: Verifica si el servidor está disponible
- `printTicket()`: Imprime tickets con fallback automático
- `printComanda()`: Imprime comandas de cocina
- `printWithDialog()`: Fallback a diálogo del navegador

**Archivos**: `PrintTicket.js` y `PrintComanda.js` (MODIFICADOS)

Ambos componentes ahora usan `printService` en lugar de llamar directamente a `window.print()`.

**Archivo**: `apps/app/src/modules/tiendas/components/PrintConfigModal.js` (NUEVO)

Modal completo para configurar la impresión directa con:
- Toggle on/off
- Configuración del servidor
- Configuración de la impresora (nombre, tipo, conexión)
- Configuración de red (IP, puerto)
- Opciones adicionales (cajón, copias)
- Configuración de impresora de comanda

**Archivo**: `apps/app/src/modules/tiendas/pages/TiendasPage.js` (MODIFICADO)

Agregado botón "Impresión" (azul) al lado del botón "Ticket" en cada tienda.

**Archivo**: `apps/app/src/pages/OnboardingPage.js` (MODIFICADO)

Agregada sección informativa en Step 1 que explica las dos opciones de impresión.

### 3. Print Server (Servidor Local)

**Carpeta**: `print-server/`

Proyecto Node.js independiente con:

- **server.js**: Servidor Express que maneja impresión térmica
- **package.json**: Dependencias y scripts de construcción
- **README.md**: Documentación completa de uso
- **BUILD.md**: Guía para generar ejecutables
- **start-windows.bat**: Script de inicio para Windows
- **start.sh**: Script de inicio para macOS/Linux
- **.gitignore**: Ignora dist/, node_modules/, etc.

**Endpoints del Print Server:**

- `GET /health`: Verifica estado (usado para health check)
- `GET /`: Información del servidor
- `POST /print/ticket`: Imprime ticket de venta
- `POST /print/comanda`: Imprime comanda de cocina

## Flujo de Uso para Nuevos Tenants

### Escenario 1: Negocio sin Impresora Térmica

1. **Tenant se registra** → Onboarding
2. **Ve información** sobre opciones de impresión en Step 1
3. **No hace nada** (directPrint queda en false por defecto)
4. **Al imprimir** → Se abre diálogo del navegador
5. **Puede imprimir** en cualquier impresora normal

### Escenario 2: Negocio con Impresora Térmica

1. **Tenant se registra** → Onboarding
2. **Ve información** sobre Print Server con link de descarga
3. **Puede continuar** sin instalarlo (funciona con diálogo)
4. **Cuando quiera usar impresión directa:**
   - Descarga el ejecutable del Print Server
   - Lo ejecuta en su computadora local
   - Va a Configuración → Tiendas → click en "Impresión"
   - Activa "Impresión Directa"
   - Configura su impresora
   - ¡Listo! Ahora imprime directo

## Distribución del Print Server

### Generar Ejecutables

```bash
cd print-server
npm install
npm run build:all
```

Esto genera:
- `dist/AstrodishPrintServer-win.exe` (Windows 64-bit)
- `dist/AstrodishPrintServer-mac` (macOS 64-bit)
- `dist/AstrodishPrintServer-linux` (Linux 64-bit)

### Publicar en GitHub Releases

1. Comprimir cada ejecutable
2. Crear un Release en GitHub (v1.0.0)
3. Adjuntar los archivos comprimidos
4. Actualizar el link en OnboardingPage.js

### Usuarios Finales

**NO necesitan:**
- Instalar Node.js
- Instalar dependencias
- Configurar nada técnico

**Solo necesitan:**
1. Descargar el ejecutable para su sistema
2. Ejecutarlo (doble click en Windows, chmod+x en macOS/Linux)
3. Permitir acceso en el firewall si lo pide
4. Configurar en Astrodish

## Ventajas del Sistema Implementado

### Para el Negocio (SaaS)

✅ **Funciona para todos**: Sin impresora térmica → usa diálogo
✅ **Opcional**: Impresión directa es una característica adicional
✅ **No bloquea lanzamiento**: Puedes lanzar ahora, agregar PrintServer después
✅ **Escalable**: Cada tienda configura independientemente
✅ **Fallback automático**: Si falla, usa diálogo (cero downtime)

### Para los Usuarios

✅ **Fácil de instalar**: Un solo ejecutable, no requiere Node.js
✅ **Cero configuración en nube**: Todo funciona local
✅ **Privacidad**: Datos de impresión no salen de su red local
✅ **Flexible**: Pueden tener tiendas con y sin impresión directa

## Mantenimiento y Actualizaciones

### Actualizar el Print Server

1. Modifica `server.js`
2. Incrementa versión en `package.json`
3. Genera nuevos ejecutables: `npm run build:all`
4. Crea nuevo Release en GitHub
5. Los usuarios descargan y reemplazan el ejecutable

### Monitoreo

El Print Server incluye logs en consola. Para producción puedes:
- Redirigir logs a archivo
- Usar servicios como PM2 para Node.js
- Configurar restart automático

## Próximos Pasos Recomendados

### Antes del Lanzamiento

1. ✅ Probar el sistema completo
2. ✅ Generar ejecutables para todas las plataformas
3. ✅ Crear Release en GitHub
4. ✅ Actualizar link en OnboardingPage
5. ✅ Probar instalación en máquina limpia

### Post-Lanzamiento (Opcional)

1. **Telemetría**: Agregar analytics para ver cuántos usan impresión directa
2. **Instalador Gráfico**: Crear instalador con interfaz (Inno Setup para Windows)
3. **Auto-Update**: Sistema de actualización automática
4. **Soporte para más impresoras**: Agregar más tipos de impresoras
5. **Dashboard del Print Server**: UI web para monitoreo

## Documentación para Soporte

### Preguntas Frecuentes

**P: ¿Necesito instalar el Print Server?**
R: No, es opcional. Solo si quieres impresión directa en impresora térmica.

**P: ¿Funciona con cualquier impresora?**
R: El diálogo del navegador funciona con todas. Impresión directa requiere impresora térmica compatible.

**P: ¿Qué pasa si el Print Server no está disponible?**
R: Automáticamente usa el diálogo del navegador.

**P: ¿Puedo usar diferentes impresoras para ticket y comanda?**
R: Sí, puedes configurar una impresora separada para comandas de cocina.

**P: ¿El Print Server funciona con múltiples tiendas?**
R: Sí, pero cada computadora solo puede tener una instancia. Para múltiples tiendas en la misma computadora, usa la misma configuración de impresora.

## Soporte Técnico

### Archivos de Log

Los logs del Print Server se muestran en consola. Para guardarlos:

**Windows:**
```batch
AstrodishPrintServer-win.exe > print-server.log 2>&1
```

**macOS/Linux:**
```bash
./AstrodishPrintServer-mac > print-server.log 2>&1
```

### Problemas Comunes

Ver sección "Solución de Problemas" en `print-server/README.md`

## Conclusión

El sistema está completo y listo para:
1. **Lanzar a producción** con impresión mediante diálogo
2. **Ofrecer impresión directa** como característica premium/opcional
3. **Escalar** sin cambios arquitectónicos

Los usuarios pueden empezar a usar Astrodish inmediatamente con impresión normal, y cuando quieran upgrade a impresión directa, solo descargan el ejecutable.

**¡El sistema está diseñado para crecer con tu negocio!**

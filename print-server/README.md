# Astrodish Print Server

Servidor local para impresión directa en impresoras térmicas para Astrodish POS.

## Descripción

El Print Server es una aplicación Node.js que se ejecuta localmente en la computadora donde está conectada la impresora térmica. Permite a Astrodish enviar tickets y comandas directamente a la impresora sin mostrar el diálogo de impresión del navegador.

## Características

- Impresión directa de tickets de venta
- Impresión de comandas para cocina
- Soporte para múltiples tipos de impresoras térmicas
- Conexión USB, Red (TCP/IP) y Serial
- Apertura automática de cajón de dinero
- Fallback automático a diálogo de impresión si el servidor no está disponible

## Requisitos Previos

- Node.js v16 o superior
- NPM o Yarn
- Impresora térmica compatible (EPSON, STAR, TANCA, DARUMA, BEMATECH)
- Windows, macOS o Linux

## Instalación

**Dos Opciones de Instalación:**

### Opción A: Usar Ejecutable (RECOMENDADO - Más Fácil)

Si prefieres no instalar Node.js, descarga el ejecutable para tu sistema operativo:

1. **Descarga el ejecutable:**
   - Ve a [Releases](https://github.com/yourusername/astrodish/releases)
   - Descarga el archivo para tu sistema:
     - Windows: `AstrodishPrintServer-win-v1.0.0.zip`
     - macOS: `AstrodishPrintServer-mac-v1.0.0.zip`
     - Linux: `AstrodishPrintServer-linux-v1.0.0.tar.gz`

2. **Extrae y ejecuta:**

   **Windows:**
   ```bash
   # Extrae el .zip
   # Doble click en AstrodishPrintServer-win.exe
   # Si Windows Firewall pide permiso, haz click en "Permitir acceso"
   ```

   **macOS:**
   ```bash
   # Extrae el .zip
   chmod +x AstrodishPrintServer-mac
   ./AstrodishPrintServer-mac
   ```

   **Linux:**
   ```bash
   tar -xzf AstrodishPrintServer-linux-v1.0.0.tar.gz
   chmod +x AstrodishPrintServer-linux
   ./AstrodishPrintServer-linux
   ```

3. **Verifica que esté funcionando:**
   - Abre tu navegador
   - Ve a http://localhost:9100/health
   - Deberías ver `{"status": "ok"}`

**Ventajas del Ejecutable:**
- No necesitas instalar Node.js
- Un solo archivo, fácil de distribuir
- Listo para usar inmediatamente

---

### Opción B: Instalar con Node.js (Para Desarrolladores)

#### 1. Instalar Node.js

Si no tienes Node.js instalado:

**Windows:**
- Descarga el instalador desde https://nodejs.org/
- Ejecuta el instalador y sigue las instrucciones
- Verifica la instalación:
  ```bash
  node --version
  npm --version
  ```

**macOS (con Homebrew):**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Configurar el Print Server

1. Navega a la carpeta del Print Server:
   ```bash
   cd print-server
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. (Opcional) Configura el puerto en el que se ejecutará el servidor:
   ```bash
   # En Windows
   set PORT=9100

   # En macOS/Linux
   export PORT=9100
   ```

### 3. Identificar tu Impresora

**Windows:**
1. Ve a "Configuración" > "Dispositivos" > "Impresoras y escáneres"
2. Anota el nombre exacto de tu impresora (ej: "EPSON TM-T20III Receipt")

**macOS:**
1. Ve a "Preferencias del Sistema" > "Impresoras y escáneres"
2. Anota el nombre exacto de tu impresora

**Linux:**
```bash
lpstat -p
```

### 4. Configurar la Impresora en Astrodish

1. Inicia sesión en Astrodish
2. Ve a "Configuración" > "Tiendas"
3. Selecciona la tienda y haz clic en "Impresión"
4. Activa "Impresión Directa"
5. Configura los siguientes campos:
   - **URL del Print Server**: `http://localhost:9100` (por defecto)
   - **Nombre de la Impresora**: El nombre exacto de tu impresora
   - **Tipo de Impresora**: Selecciona la marca (EPSON, STAR, etc.)
   - **Tipo de Conexión**: USB, Red o Serial
   - Si es Red: configura IP y Puerto

## Uso

### Iniciar el Servidor

**Modo Normal:**
```bash
npm start
```

**Modo Desarrollo (con auto-restart):**
```bash
npm run dev
```

Verás un mensaje como este cuando el servidor esté listo:
```
==============================================
   ASTRODISH PRINT SERVER
==============================================
   Puerto: 9100
   Tiempo: 16/12/2024, 08:30:45 p. m.
==============================================

El servidor de impresión está listo.
Esperando solicitudes de impresión...
```

### Verificar que el Servidor está Funcionando

Abre tu navegador y ve a:
```
http://localhost:9100/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Print Server is running",
  "version": "1.0.0",
  "timestamp": "2024-12-16T20:30:45.000Z"
}
```

### Configurar para Inicio Automático

#### Windows (Usando NSSM)

1. Descarga NSSM: https://nssm.cc/download
2. Extrae el archivo ZIP
3. Abre CMD como Administrador y navega a la carpeta de NSSM
4. Ejecuta:
   ```bash
   nssm install AstrodishPrintServer
   ```
5. En la ventana que aparece:
   - **Path**: Ruta completa a node.exe (ej: `C:\Program Files\nodejs\node.exe`)
   - **Startup directory**: Ruta completa a la carpeta print-server
   - **Arguments**: `server.js`
6. Haz clic en "Install service"
7. Inicia el servicio:
   ```bash
   nssm start AstrodishPrintServer
   ```

#### macOS (Usando launchd)

1. Crea un archivo plist:
   ```bash
   nano ~/Library/LaunchAgents/com.astrodish.printserver.plist
   ```

2. Pega lo siguiente (ajusta las rutas):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.astrodish.printserver</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/ruta/a/print-server/server.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
   </dict>
   </plist>
   ```

3. Carga el servicio:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.astrodish.printserver.plist
   ```

#### Linux (Usando systemd)

1. Crea un archivo de servicio:
   ```bash
   sudo nano /etc/systemd/system/astrodish-print.service
   ```

2. Pega lo siguiente (ajusta las rutas):
   ```ini
   [Unit]
   Description=Astrodish Print Server
   After=network.target

   [Service]
   Type=simple
   User=tu-usuario
   WorkingDirectory=/ruta/a/print-server
   ExecStart=/usr/bin/node /ruta/a/print-server/server.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Habilita e inicia el servicio:
   ```bash
   sudo systemctl enable astrodish-print
   sudo systemctl start astrodish-print
   sudo systemctl status astrodish-print
   ```

## Solución de Problemas

### La impresora no imprime

1. **Verifica que el servidor esté ejecutándose:**
   - Abre http://localhost:9100/health en tu navegador
   - Deberías ver `{"status": "ok"}`

2. **Verifica el nombre de la impresora:**
   - En Windows: Panel de Control > Dispositivos e impresoras
   - El nombre debe coincidir EXACTAMENTE con el configurado en Astrodish

3. **Verifica los permisos:**
   - Windows: Ejecuta el servidor como Administrador
   - Linux: Agrega tu usuario al grupo `lp`: `sudo usermod -a -G lp tu-usuario`

4. **Verifica la conexión:**
   - USB: Asegúrate de que el cable esté bien conectado
   - Red: Verifica que la IP sea correcta y que haya conectividad

5. **Revisa los logs:**
   - El servidor muestra logs en la consola
   - Busca mensajes de error en rojo

### Error "Printer is not connected or not available"

- Verifica que la impresora esté encendida
- Verifica que los drivers estén instalados
- En Windows, prueba imprimir una página de prueba desde Windows
- Revisa que el nombre de la impresora sea exacto

### Error "CORS"

- Asegúrate de que el servidor esté configurado con CORS habilitado
- Verifica que la URL en Astrodish sea `http://localhost:9100` (con http, no https)

### El cajón no se abre

- Verifica que "Abrir Cajón Automáticamente" esté activado en la configuración
- Verifica que el cajón esté conectado correctamente a la impresora
- Algunas impresoras requieren configuración adicional para el cajón

## API Endpoints

### GET /health
Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Print Server is running",
  "version": "1.0.0",
  "timestamp": "2024-12-16T20:30:45.000Z"
}
```

### POST /print/ticket
Imprime un ticket de venta.

**Body:**
```json
{
  "sale": { /* datos de la venta */ },
  "config": { /* configuración de impresión */ },
  "ticketConfig": { /* configuración del ticket */ }
}
```

### POST /print/comanda
Imprime una comanda de cocina.

**Body:**
```json
{
  "sale": { /* datos de la venta */ },
  "config": { /* configuración de impresión */ }
}
```

## Soporte

Si tienes problemas con el Print Server:

1. Verifica los requisitos previos
2. Revisa la sección de Solución de Problemas
3. Consulta los logs del servidor
4. Abre un issue en el repositorio de GitHub

## Licencia

MIT

## Autor

Astrodish Team

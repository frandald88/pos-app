# Guía de Construcción del Print Server

Esta guía explica cómo generar los ejecutables del Print Server para distribución.

## Requisitos Previos

- Node.js v16 o superior
- NPM instalado

## Instalación de Dependencias

```bash
cd print-server
npm install
```

Esto instalará todas las dependencias necesarias, incluyendo `pkg` que es la herramienta que usamos para empaquetar.

## Generar Ejecutables

### Generar para Windows (64-bit)

```bash
npm run build:win
```

Esto genera: `dist/AstrodishPrintServer-win.exe`

### Generar para macOS (64-bit)

```bash
npm run build:mac
```

Esto genera: `dist/AstrodishPrintServer-mac`

### Generar para Linux (64-bit)

```bash
npm run build:linux
```

Esto genera: `dist/AstrodishPrintServer-linux`

### Generar para Todas las Plataformas

```bash
npm run build:all
```

Esto genera ejecutables para Windows, macOS y Linux en la carpeta `dist/`.

## Distribución

Los ejecutables generados son autónomos y NO requieren que el usuario instale Node.js.

### Tamaño de los Ejecutables

Los ejecutables incluyen Node.js y todas las dependencias, por lo que son relativamente grandes (~50-80 MB):
- Windows: ~60 MB
- macOS: ~65 MB
- Linux: ~60 MB

### Crear un Release en GitHub

1. **Generar ejecutables**:
   ```bash
   npm run build:all
   ```

2. **Comprimir cada ejecutable** (opcional pero recomendado):
   ```bash
   # Windows
   zip dist/AstrodishPrintServer-win-v1.0.0.zip dist/AstrodishPrintServer-win.exe

   # macOS
   zip dist/AstrodishPrintServer-mac-v1.0.0.zip dist/AstrodishPrintServer-mac

   # Linux
   tar -czf dist/AstrodishPrintServer-linux-v1.0.0.tar.gz -C dist AstrodishPrintServer-linux
   ```

3. **Crear Release en GitHub**:
   - Ve a tu repositorio en GitHub
   - Click en "Releases" → "Create a new release"
   - Tag version: `v1.0.0`
   - Release title: `Astrodish Print Server v1.0.0`
   - Descripción: Incluye notas de la versión
   - Adjunta los archivos .zip/.tar.gz
   - Click en "Publish release"

### Instrucciones para Usuarios

#### Windows

1. Descargar `AstrodishPrintServer-win-v1.0.0.zip`
2. Extraer el archivo
3. Doble click en `AstrodishPrintServer-win.exe`
4. Windows Firewall pedirá permiso - hacer click en "Permitir acceso"
5. El servidor se ejecutará en http://localhost:9100

Para ejecutar al inicio de Windows:
- Crear un acceso directo del .exe
- Copiar el acceso directo a: `C:\Users\[TuUsuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

#### macOS

1. Descargar `AstrodishPrintServer-mac-v1.0.0.zip`
2. Extraer el archivo
3. Abrir Terminal
4. Dar permisos de ejecución:
   ```bash
   chmod +x ~/Downloads/AstrodishPrintServer-mac
   ```
5. Ejecutar:
   ```bash
   ~/Downloads/AstrodishPrintServer-mac
   ```

macOS podría mostrar un mensaje de seguridad. Para permitir:
- Ve a "Preferencias del Sistema" → "Seguridad y Privacidad"
- Click en "Abrir de todos modos"

Para ejecutar al inicio:
- Sigue las instrucciones de launchd en el README principal

#### Linux

1. Descargar `AstrodishPrintServer-linux-v1.0.0.tar.gz`
2. Extraer el archivo:
   ```bash
   tar -xzf AstrodishPrintServer-linux-v1.0.0.tar.gz
   ```
3. Dar permisos de ejecución:
   ```bash
   chmod +x AstrodishPrintServer-linux
   ```
4. Ejecutar:
   ```bash
   ./AstrodishPrintServer-linux
   ```

Para ejecutar al inicio:
- Sigue las instrucciones de systemd en el README principal

## Verificación

Después de ejecutar el ejecutable, verifica que funcione:

1. Abre tu navegador
2. Ve a http://localhost:9100/health
3. Deberías ver:
   ```json
   {
     "status": "ok",
     "message": "Print Server is running",
     "version": "1.0.0"
   }
   ```

## Solución de Problemas

### El ejecutable no inicia

**Windows:**
- Verifica que no haya otro programa usando el puerto 9100
- Ejecuta como Administrador
- Verifica que Windows Defender no lo esté bloqueando

**macOS:**
- Verifica los permisos con `ls -l`
- Si macOS lo bloquea, ve a Seguridad y Privacidad

**Linux:**
- Verifica permisos de ejecución
- Verifica que el puerto 9100 esté disponible: `netstat -tuln | grep 9100`

### Error "Cannot find module"

Este error no debería ocurrir con los ejecutables generados por `pkg`, ya que todos los módulos están empaquetados. Si ocurre:
- Regenera el ejecutable con `npm run build:[plataforma]`
- Verifica que no haya archivos corruptos

### Actualizar la Versión

1. Actualiza el número de versión en `package.json`
2. Actualiza la versión en `server.js` (línea que dice `version: '1.0.0'`)
3. Regenera los ejecutables
4. Crea un nuevo release en GitHub

## Notas de Desarrollo

- Los ejecutables se generan en la carpeta `dist/`
- La carpeta `dist/` está en `.gitignore` - no se sube al repositorio
- Los ejecutables son binarios compilados - no son editables
- Para hacer cambios, modifica `server.js` y regenera

## Alternativa: Instalador

Si quieres crear instaladores más profesionales (con interfaz gráfica):

### Windows - Inno Setup
- Descarga: https://jrsoftware.org/isdl.php
- Crea un script .iss para generar un instalador .exe

### macOS - DMG
- Usa `create-dmg` para crear una imagen de disco:
  ```bash
  npm install -g create-dmg
  create-dmg AstrodishPrintServer-mac
  ```

### Linux - DEB/RPM
- Usa `fpm` para crear paquetes:
  ```bash
  gem install fpm
  fpm -s dir -t deb -n astrodish-print-server -v 1.0.0 AstrodishPrintServer-linux=/usr/local/bin/
  ```

## Licencia

MIT - Ver LICENSE para más detalles

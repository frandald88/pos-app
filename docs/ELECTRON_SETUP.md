# Guía: Convertir POS a Aplicación Electron con Instalador

## 🎯 Objetivo

Crear un archivo `setup.exe` que:
- ✅ Instala una aplicación de escritorio (Electron)
- ✅ Funciona **sin conexión a internet** (offline-first)
- ✅ Incluye base de datos local (MongoDB embebido)
- ✅ Se instala como cualquier programa de Windows
- ✅ Cliente NO puede ver el código fuente
- ✅ Se ejecuta con doble clic, sin configuración técnica

---

## 📦 Arquitectura del Sistema Offline

```
┌─────────────────────────────────────┐
│   Aplicación Electron (Ventana)    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Frontend (React compilado)  │ │
│  └───────────────┬───────────────┘ │
│                  │                  │
│  ┌───────────────▼───────────────┐ │
│  │   Backend (Express/Node.js)   │ │
│  └───────────────┬───────────────┘ │
│                  │                  │
│  ┌───────────────▼───────────────┐ │
│  │  MongoDB Local (NeDB/SQLite)  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
        Todo empaquetado en un .exe
```

---

## 🔧 Paso 1: Preparar el Proyecto para Electron

### 1.1 Instalar Dependencias

```bash
cd C:\Users\ernan\Desktop\Personal\pos-app

# Instalar Electron y herramientas de empaquetado
npm install --save-dev electron electron-builder
npm install --save-dev concurrently wait-on cross-env

# Para base de datos local (reemplaza MongoDB)
npm install nedb-promises
# O si prefieres SQLite:
npm install better-sqlite3
```

### 1.2 Crear Estructura para Electron

```bash
# Crear carpeta para archivos de Electron
mkdir electron
cd electron

# Archivos necesarios:
# - main.js (proceso principal de Electron)
# - preload.js (puente seguro entre frontend y backend)
# - package.json (configuración específica de Electron)
```

---

## 📝 Paso 2: Crear Archivos de Electron

### 2.1 `electron/main.js` - Proceso Principal

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');

let mainWindow;
let backendServer;

// Iniciar servidor backend Express
function startBackend() {
  const backend = express();
  backend.use(cors());
  backend.use(express.json());

  // Importar tus rutas del backend
  const authRoutes = require('../backend/core/auth/routes');
  const usersRoutes = require('../backend/core/users/routes');
  const productsRoutes = require('../backend/core/products/routes');
  const salesRoutes = require('../backend/core/sales/routes');
  // ... importar resto de rutas

  // Configurar rutas
  backend.use('/api/auth', authRoutes);
  backend.use('/api/users', usersRoutes);
  backend.use('/api/products', productsRoutes);
  backend.use('/api/sales', salesRoutes);
  // ... resto de rutas

  // Iniciar servidor en puerto local
  const PORT = 5555; // Puerto fijo para Electron
  backendServer = backend.listen(PORT, 'localhost', () => {
    console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  });

  return PORT;
}

// Crear ventana principal
function createWindow() {
  const PORT = startBackend();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true, // Ocultar barra de menú
    // fullscreen: true, // Descomentar para modo kiosko
  });

  // Cargar frontend compilado
  mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));

  // Inyectar URL del backend en el frontend
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.ELECTRON_API_URL = 'http://localhost:${PORT}';
    `);
  });

  // Abrir DevTools en desarrollo (comentar en producción)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar app cuando Electron esté listo
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar backend al cerrar app
app.on('window-all-closed', () => {
  if (backendServer) {
    backendServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar cierre limpio
app.on('before-quit', () => {
  if (backendServer) {
    backendServer.close();
  }
});
```

### 2.2 `electron/preload.js` - Puente Seguro

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al frontend
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,

  // Funciones para comunicación con el proceso principal
  send: (channel, data) => {
    const validChannels = ['save-data', 'print-ticket'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  receive: (channel, func) => {
    const validChannels = ['data-saved', 'print-complete'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
```

### 2.3 `electron/package.json` - Configuración

```json
{
  "name": "pos-system",
  "version": "1.0.0",
  "description": "Sistema POS para Restaurantes",
  "main": "main.js",
  "author": "Tu Nombre",
  "license": "Propietario",
  "build": {
    "appId": "com.tuempresa.pos",
    "productName": "POS System",
    "copyright": "Copyright © 2025 Tu Empresa",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "../frontend/build/**/*",
      "../backend/**/*",
      "../license.json",
      "!../backend/node_modules",
      "!../frontend/node_modules"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "../assets/icon.ico",
      "artifactName": "POS-Setup-${version}.exe"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "installerIcon": "../assets/icon.ico",
      "uninstallerIcon": "../assets/icon.ico",
      "installerHeaderIcon": "../assets/icon.ico",
      "license": "../LICENSE.txt",
      "language": "3082"
    },
    "mac": {
      "target": "dmg",
      "icon": "../assets/icon.icns",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "../assets/icon.png",
      "category": "Office"
    }
  }
}
```

---

## 🗄️ Paso 3: Reemplazar MongoDB con Base de Datos Local

### Opción 1: NeDB (Más fácil, compatible con MongoDB)

```javascript
// backend/config/database.js
const Datastore = require('nedb-promises');
const path = require('path');
const { app } = require('electron');

// Ubicación de la base de datos en carpeta de usuario
const dbPath = app ?
  path.join(app.getPath('userData'), 'pos-database') :
  path.join(__dirname, '../../data');

const db = {
  users: Datastore.create({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  products: Datastore.create({ filename: path.join(dbPath, 'products.db'), autoload: true }),
  sales: Datastore.create({ filename: path.join(dbPath, 'sales.db'), autoload: true }),
  clientes: Datastore.create({ filename: path.join(dbPath, 'clientes.db'), autoload: true }),
  // ... más colecciones
};

// Crear índices
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.products.ensureIndex({ fieldName: 'codigo' });

module.exports = db;
```

### Opción 2: SQLite (Más robusto para muchos datos)

```javascript
// backend/config/database.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = app ?
  path.join(app.getPath('userData'), 'pos.db') :
  path.join(__dirname, '../../data/pos.db');

const db = new Database(dbPath);

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    precio REAL NOT NULL,
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

module.exports = db;
```

### Actualizar Modelos del Backend

```javascript
// Ejemplo: backend/core/users/model.js
// ANTES (MongoDB):
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({...});
module.exports = mongoose.model('User', userSchema);

// DESPUÉS (NeDB):
const db = require('../../config/database');
module.exports = {
  find: (query) => db.users.find(query),
  findOne: (query) => db.users.findOne(query),
  insert: (doc) => db.users.insert(doc),
  update: (query, update) => db.users.update(query, update),
  remove: (query) => db.users.remove(query),
};
```

---

## 🔧 Paso 4: Modificar Frontend para Electron

### 4.1 Actualizar API URL

```javascript
// frontend/src/config/api.js
const API_BASE_URL =
  window.ELECTRON_API_URL || // URL inyectada por Electron
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

export default API_BASE_URL;
```

### 4.2 Compilar Frontend

```bash
cd frontend
npm run build

# Esto genera carpeta 'build/' con todo optimizado
# Electron cargará estos archivos estáticos
```

---

## 📦 Paso 5: Crear el Instalador

### 5.1 Script de Build

```json
// package.json (raíz del proyecto)
{
  "name": "pos-system-full",
  "version": "1.0.0",
  "scripts": {
    "electron": "electron electron/main.js",
    "electron:build": "electron-builder --config electron/package.json",
    "pack": "npm run build:frontend && npm run electron:build",
    "build:frontend": "cd frontend && npm run build",
    "dist:win": "npm run pack -- --win",
    "dist:mac": "npm run pack -- --mac",
    "dist:linux": "npm run pack -- --linux",
    "dist:all": "npm run pack -- --win --mac --linux"
  }
}
```

### 5.2 Preparar Licencia del Cliente

```bash
# Editar license.json con datos del cliente ANTES de compilar
nano license.json

# El archivo se incluirá en el ejecutable
```

### 5.3 Generar Instalador

```bash
# Windows
npm run dist:win

# Esto genera en electron/dist/:
# - POS-Setup-1.0.0.exe (instalador NSIS)
# - POS-1.0.0-win.zip (portable)

# El .exe incluye TODO:
# ✅ Frontend compilado
# ✅ Backend
# ✅ Node.js embebido
# ✅ Base de datos vacía
# ✅ license.json del cliente
# ✅ Iconos y recursos
```

---

## 🎨 Paso 6: Personalizar Instalador

### 6.1 Crear Iconos

```bash
# Necesitas iconos en diferentes formatos:
# Windows: icon.ico (256x256)
# macOS: icon.icns
# Linux: icon.png (512x512)

# Herramientas:
# - https://www.icoconverter.com/ (online)
# - https://iconverticons.com/online/ (online)
# - electron-icon-maker (npm)
```

### 6.2 Crear Splash Screen (Opcional)

```javascript
// electron/main.js - Agregar ventana de carga
function createSplashScreen() {
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));

  return splash;
}

function createWindow() {
  const splash = createSplashScreen();

  // ... crear ventana principal

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splash.close();
      mainWindow.show();
    }, 2000);
  });
}
```

### 6.3 Archivo de Licencia (EULA)

```text
// LICENSE.txt (raíz del proyecto)
ACUERDO DE LICENCIA DE USUARIO FINAL (EULA)
Sistema POS - Tu Empresa

Este software es propiedad de [Tu Empresa].

LICENCIA DE USO:
Este software se proporciona bajo licencia, no se vende.
El Cliente tiene derecho a:
- Instalar en UN equipo/ubicación
- Uso comercial interno

El Cliente NO tiene derecho a:
- Redistribuir el software
- Realizar ingeniería inversa
- Sublicenciar a terceros

SOPORTE:
Soporte técnico disponible en: soporte@tuempresa.com

© 2025 Tu Empresa. Todos los derechos reservados.
```

---

## 🚀 Paso 7: Distribución al Cliente

### 7.1 Lo que le entregas al cliente:

```
📦 Paquete de entrega:
├── POS-Setup-1.0.0.exe (15-150 MB dependiendo del proyecto)
├── Manual_de_Usuario.pdf
├── Credenciales.txt (usuario admin inicial)
└── Contacto_Soporte.txt
```

### 7.2 Instalación del Cliente (Super Simple):

```bash
1. Doble clic en "POS-Setup-1.0.0.exe"
2. Siguiente > Siguiente > Instalar
3. Se crea ícono en escritorio
4. Doble clic en ícono "POS System"
5. ¡Listo! Sistema funcionando

✅ Sin instalar Node.js
✅ Sin instalar MongoDB
✅ Sin configurar nada
✅ Funciona sin internet
```

### 7.3 Primera Ejecución

```javascript
// electron/main.js - Detectar primera ejecución
const Store = require('electron-store');
const store = new Store();

app.whenReady().then(() => {
  const isFirstRun = store.get('firstRun', true);

  if (isFirstRun) {
    // Crear usuario admin por defecto
    createDefaultAdmin();

    // Mostrar tutorial
    showWelcomeWizard();

    store.set('firstRun', false);
  }

  createWindow();
});
```

---

## 🔒 Paso 8: Protección del Código

### 8.1 Ofuscación Automática

```json
// electron/package.json
{
  "build": {
    "asar": true,  // Empaqueta código en archivo .asar (difícil de extraer)
    "asarUnpack": [
      "node_modules/better-sqlite3/**/*"  // Excepciones si son necesarias
    ]
  }
}
```

### 8.2 Ofuscación Adicional (Opcional)

```bash
npm install --save-dev javascript-obfuscator

# Crear script de ofuscación
# obfuscate.js
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Ofuscar backend
const backendFiles = [
  'backend/core/auth/routes.js',
  'backend/core/users/routes.js',
  // ... más archivos
];

backendFiles.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    stringArray: true,
    stringArrayThreshold: 0.75
  });

  fs.writeFileSync(file, obfuscated.getObfuscatedCode());
});
```

---

## 📊 Paso 9: Actualizaciones Automáticas (Opcional)

### 9.1 Configurar Auto-Updater

```javascript
// electron/main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  createWindow();

  // Verificar actualizaciones al iniciar
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded');
});

// En el frontend, mostrar notificación:
window.electron.receive('update-available', () => {
  alert('Nueva versión disponible. Se descargará automáticamente.');
});
```

### 9.2 Servidor de Actualizaciones

```bash
# Opción 1: GitHub Releases (gratis)
# Sube cada versión como release en GitHub
# Electron descargará automáticamente

# Opción 2: Tu propio servidor
# Configura servidor con las versiones
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://tuservidor.com/updates'
});
```

---

## ✅ Checklist Final

### Antes de Compilar
- [ ] Frontend compilado (`npm run build`)
- [ ] License.json configurada con datos del cliente
- [ ] Credenciales admin configuradas
- [ ] Base de datos local configurada (NeDB/SQLite)
- [ ] Iconos creados (.ico, .icns, .png)
- [ ] LICENSE.txt con EULA
- [ ] Versión actualizada en package.json

### Compilación
- [ ] `npm run dist:win` ejecutado sin errores
- [ ] Instalador .exe generado en electron/dist/
- [ ] Tamaño razonable (50-150 MB típico)

### Pruebas
- [ ] Instalar en máquina limpia (VM recomendada)
- [ ] Verificar que funciona sin conexión
- [ ] Probar todas las funcionalidades
- [ ] Verificar que licencia está correcta
- [ ] Probar impresora (si aplica)
- [ ] Verificar persistencia de datos (cerrar y abrir)

### Entrega
- [ ] Setup.exe renombrado con nombre del cliente
- [ ] Manual de usuario incluido
- [ ] Credenciales admin documentadas
- [ ] Contacto de soporte incluido

---

## 💡 Ventajas de Este Enfoque

✅ **Para ti (desarrollador):**
- Código protegido (no visible)
- Distribución fácil (un solo archivo)
- Sin configuración del cliente
- Control de licencias embebido
- Actualizaciones centralizadas posibles

✅ **Para el cliente:**
- Instalación súper simple
- Funciona sin internet
- No requiere conocimientos técnicos
- Parece software "profesional"
- Rápido y sin latencia de red

---

## 🎯 Resumen del Flujo Completo

```
TU MÁQUINA:
1. Configuras license.json del cliente
2. npm run dist:win
3. Sale: POS-Setup-Cliente-1.0.0.exe (80 MB)

CLIENTE:
4. Doble clic en .exe
5. Siguiente, siguiente, instalar
6. Ícono en escritorio
7. Doble clic
8. ¡Sistema funcionando offline!

SIN INTERNET ✅
SIN NODE.JS ✅
SIN MONGODB ✅
SIN CONFIGURACIÓN ✅
```

---

## 📞 Siguiente Paso

¿Quieres que te ayude a implementar esto?

Podemos empezar por:
1. Crear la estructura de Electron
2. Migrar la base de datos a NeDB/SQLite
3. Configurar electron-builder
4. Generar el primer instalador de prueba

---

**Última actualización**: Enero 2025
**Dificultad**: Media-Alta
**Tiempo estimado**: 2-4 días de trabajo

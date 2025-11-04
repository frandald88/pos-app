# Implementación Sistema Dual-Mode (Web + Desktop)

## 🎯 Objetivo

Mantener **UNA sola codebase** que funcione en dos modos:
- **Modo Web**: MongoDB Atlas (conexión a internet, múltiples clientes)
- **Modo Desktop**: NeDB local (sin internet, instalación única)

---

## 📐 Arquitectura de Capas

```
┌─────────────────────────────────────────────┐
│         Rutas & Controladores               │
│      (NO CAMBIAN - API igual)               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Capa de Abstracción (Database)         │
│   ✅ Detecta modo (web vs electron)         │
│   ✅ Usa MongoDB o NeDB según contexto      │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼────────┐
│   MongoDB       │  │     NeDB       │
│   (Web Mode)    │  │ (Desktop Mode) │
└─────────────────┘  └────────────────┘
```

---

## 🔧 PASO 1: Crear Database Adapter

### 1.1 Estructura de Archivos

```
backend/
├── config/
│   ├── database.js              # ⭐ Detecta modo y elige DB
│   ├── mongodb.js               # Configuración MongoDB
│   └── nedb.js                  # Configuración NeDB
├── adapters/                    # ⭐ NUEVA CARPETA
│   ├── DatabaseAdapter.js       # Interfaz común
│   ├── MongoAdapter.js          # Implementación MongoDB
│   └── NeDBAdapter.js           # Implementación NeDB
└── models/
    └── BaseModel.js             # Modelo base que usa adapter
```

### 1.2 Código: `backend/config/database.js`

```javascript
// Detecta el entorno y conecta a la BD apropiada
const isElectron = process.versions && process.versions.electron;
const useLocalDB = process.env.USE_LOCAL_DB === 'true' || isElectron;

let db;

if (useLocalDB) {
  console.log('🔷 Modo Desktop: Usando NeDB local');
  db = require('./nedb');
} else {
  console.log('🌐 Modo Web: Usando MongoDB Atlas');
  db = require('./mongodb');
}

module.exports = db;
```

### 1.3 Código: `backend/config/mongodb.js`

```javascript
// Configuración existente de MongoDB
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

connectDB();

module.exports = mongoose;
```

### 1.4 Código: `backend/config/nedb.js`

```javascript
// Nueva configuración para NeDB local
const Datastore = require('nedb-promises');
const path = require('path');

// Detectar si estamos en Electron
let dbPath;
if (process.versions && process.versions.electron) {
  const { app } = require('electron');
  dbPath = path.join(app.getPath('userData'), 'pos-database');
} else {
  // Desarrollo local
  dbPath = path.join(__dirname, '../../data');
}

const db = {
  users: Datastore.create({
    filename: path.join(dbPath, 'users.db'),
    autoload: true,
    timestampData: true
  }),
  products: Datastore.create({
    filename: path.join(dbPath, 'products.db'),
    autoload: true,
    timestampData: true
  }),
  sales: Datastore.create({
    filename: path.join(dbPath, 'sales.db'),
    autoload: true,
    timestampData: true
  }),
  clientes: Datastore.create({
    filename: path.join(dbPath, 'clientes.db'),
    autoload: true,
    timestampData: true
  }),
  tiendas: Datastore.create({
    filename: path.join(dbPath, 'tiendas.db'),
    autoload: true,
    timestampData: true
  }),
  empleados: Datastore.create({
    filename: path.join(dbPath, 'empleados.db'),
    autoload: true,
    timestampData: true
  }),
  // ... resto de colecciones
};

// Crear índices para optimización
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.products.ensureIndex({ fieldName: 'codigo' });
db.clientes.ensureIndex({ fieldName: 'email' });

console.log(`📁 Base de datos local en: ${dbPath}`);

module.exports = db;
```

---

## 🔧 PASO 2: Crear Database Adapter (Interfaz Común)

### 2.1 Código: `backend/adapters/DatabaseAdapter.js`

```javascript
// Interfaz común para ambas bases de datos
class DatabaseAdapter {
  // CRUD básico que debe implementar cada adapter
  async find(collection, query = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  async findOne(collection, query) {
    throw new Error('Method not implemented');
  }

  async findById(collection, id) {
    throw new Error('Method not implemented');
  }

  async create(collection, data) {
    throw new Error('Method not implemented');
  }

  async updateById(collection, id, data) {
    throw new Error('Method not implemented');
  }

  async deleteById(collection, id) {
    throw new Error('Method not implemented');
  }

  async count(collection, query = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = DatabaseAdapter;
```

### 2.2 Código: `backend/adapters/MongoAdapter.js`

```javascript
// Implementación para MongoDB
const DatabaseAdapter = require('./DatabaseAdapter');
const mongoose = require('../config/mongodb');

class MongoAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.models = {}; // Cache de modelos
  }

  getModel(collection) {
    if (!this.models[collection]) {
      // Cargar modelo dinámicamente
      const modelPath = `../models/${collection}`;
      this.models[collection] = require(modelPath);
    }
    return this.models[collection];
  }

  async find(collection, query = {}, options = {}) {
    const Model = this.getModel(collection);
    return await Model.find(query)
      .limit(options.limit)
      .skip(options.skip)
      .sort(options.sort);
  }

  async findOne(collection, query) {
    const Model = this.getModel(collection);
    return await Model.findOne(query);
  }

  async findById(collection, id) {
    const Model = this.getModel(collection);
    return await Model.findById(id);
  }

  async create(collection, data) {
    const Model = this.getModel(collection);
    return await Model.create(data);
  }

  async updateById(collection, id, data) {
    const Model = this.getModel(collection);
    return await Model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(collection, id) {
    const Model = this.getModel(collection);
    return await Model.findByIdAndDelete(id);
  }

  async count(collection, query = {}) {
    const Model = this.getModel(collection);
    return await Model.countDocuments(query);
  }
}

module.exports = MongoAdapter;
```

### 2.3 Código: `backend/adapters/NeDBAdapter.js`

```javascript
// Implementación para NeDB
const DatabaseAdapter = require('./DatabaseAdapter');
const db = require('../config/nedb');

class NeDBAdapter extends DatabaseAdapter {
  async find(collection, query = {}, options = {}) {
    let cursor = db[collection].find(query);

    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);

    return await cursor;
  }

  async findOne(collection, query) {
    return await db[collection].findOne(query);
  }

  async findById(collection, id) {
    return await db[collection].findOne({ _id: id });
  }

  async create(collection, data) {
    return await db[collection].insert(data);
  }

  async updateById(collection, id, data) {
    await db[collection].update(
      { _id: id },
      { $set: data },
      { returnUpdatedDocs: true }
    );
    return await this.findById(collection, id);
  }

  async deleteById(collection, id) {
    const doc = await this.findById(collection, id);
    await db[collection].remove({ _id: id });
    return doc;
  }

  async count(collection, query = {}) {
    return await db[collection].count(query);
  }
}

module.exports = NeDBAdapter;
```

### 2.4 Código: `backend/adapters/index.js` (Factory)

```javascript
// Factory que devuelve el adapter correcto
const MongoAdapter = require('./MongoAdapter');
const NeDBAdapter = require('./NeDBAdapter');

const isElectron = process.versions && process.versions.electron;
const useLocalDB = process.env.USE_LOCAL_DB === 'true' || isElectron;

let adapter;

if (useLocalDB) {
  adapter = new NeDBAdapter();
  console.log('📦 Usando NeDB Adapter');
} else {
  adapter = new MongoAdapter();
  console.log('🌐 Usando MongoDB Adapter');
}

module.exports = adapter;
```

---

## 🔧 PASO 3: Actualizar Modelos (Opcional - Solo si usas Mongoose schemas)

### Opción A: Mantener Mongoose Schemas (Recomendado)

```javascript
// backend/models/User.js (ejemplo existente)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

**No cambies nada** - El MongoAdapter lo usará directamente.

### Opción B: Crear Modelo Base (Más flexible)

```javascript
// backend/models/BaseModel.js
const db = require('../adapters');

class BaseModel {
  constructor(collectionName) {
    this.collection = collectionName;
  }

  async find(query = {}, options = {}) {
    return await db.find(this.collection, query, options);
  }

  async findOne(query) {
    return await db.findOne(this.collection, query);
  }

  async findById(id) {
    return await db.findById(this.collection, id);
  }

  async create(data) {
    return await db.create(this.collection, data);
  }

  async updateById(id, data) {
    return await db.updateById(this.collection, id, data);
  }

  async deleteById(id) {
    return await db.deleteById(this.collection, id);
  }

  async count(query = {}) {
    return await db.count(this.collection, query);
  }
}

module.exports = BaseModel;
```

---

## 🔧 PASO 4: Actualizar Controladores/Services

### Antes (uso directo de Mongoose):

```javascript
// backend/controllers/userController.js
const User = require('../models/User');

exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
```

### Después (usando adapter):

```javascript
// backend/controllers/userController.js
const db = require('../adapters');

exports.getUsers = async (req, res) => {
  const users = await db.find('users');
  res.json(users);
};
```

**O si usas BaseModel:**

```javascript
const BaseModel = require('../models/BaseModel');
const userModel = new BaseModel('users');

exports.getUsers = async (req, res) => {
  const users = await userModel.find();
  res.json(users);
};
```

---

## 🔧 PASO 5: Instalar Dependencias

```bash
# Instalar NeDB (base de datos local)
npm install nedb-promises

# Instalar Electron y builder
npm install --save-dev electron electron-builder

# Mantener MongoDB (ya instalado)
# No se desinstala, simplemente no se usa en modo Desktop
```

---

## 🔧 PASO 6: Crear Estructura Electron

```bash
mkdir electron
cd electron

# Crear archivos principales
touch main.js preload.js package.json
```

### 6.1 `electron/main.js`

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

// ⭐ IMPORTANTE: Setear variable de entorno ANTES de cargar backend
process.env.USE_LOCAL_DB = 'true';

let mainWindow;
let backendServer;

function startBackend() {
  // Cargar servidor Express
  const server = require('../backend/server');

  console.log('✅ Backend iniciado en modo Electron');
  return 5555; // Puerto fijo
}

function createWindow() {
  const PORT = startBackend();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Cargar frontend compilado
  mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));

  // Inyectar URL del backend
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.ELECTRON_API_URL = 'http://localhost:${PORT}';
    `);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 6.2 `electron/preload.js`

```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true
});
```

### 6.3 `electron/package.json`

```json
{
  "name": "pos-system",
  "version": "1.0.0",
  "main": "main.js",
  "build": {
    "appId": "com.tuempresa.pos",
    "files": [
      "main.js",
      "preload.js",
      "../frontend/build/**/*",
      "../backend/**/*",
      "../license.json",
      "!../backend/node_modules/@types/**/*",
      "!../**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
    ],
    "win": {
      "target": "nsis",
      "icon": "../assets/icon.ico"
    }
  }
}
```

---

## 🔧 PASO 7: Modificar Backend Server.js

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ⭐ IMPORTANTE: La conexión a DB ya se maneja automáticamente
// en config/database.js según el modo (web o desktop)

// Cargar rutas (sin cambios)
const authRoutes = require('./core/auth/routes');
const usersRoutes = require('./core/users/routes');
// ... resto de rutas

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
// ... resto de configuración

// Solo iniciar servidor si NO está en Electron
// (En Electron, main.js lo inicia)
if (!process.versions.electron) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

// Exportar app para Electron
module.exports = app;
```

---

## 🔧 PASO 8: Scripts de Build

### 8.1 `package.json` (raíz)

```json
{
  "scripts": {
    "dev:web": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm start\"",
    "dev:electron": "cross-env USE_LOCAL_DB=true electron electron/main.js",

    "build:frontend": "cd frontend && npm run build",
    "build:electron": "npm run build:frontend && electron-builder --config electron/package.json",

    "dist:win": "npm run build:electron -- --win",
    "dist:mac": "npm run build:electron -- --mac",
    "dist:linux": "npm run build:electron -- --linux"
  }
}
```

---

## 🔧 PASO 9: Testing

### 9.1 Probar Modo Web (desarrollo actual)

```bash
npm run dev:web
# Debe funcionar exactamente igual que antes con MongoDB
```

### 9.2 Probar Modo Desktop (desarrollo)

```bash
# Instalar NeDB
npm install nedb-promises

# Ejecutar en modo Electron
npm run dev:electron

# Debe abrir ventana de Electron con NeDB local
```

### 9.3 Compilar para Distribución

```bash
# Configurar license.json del cliente
nano license.json

# Compilar frontend
cd frontend
npm run build

# Generar instalador Windows
cd ..
npm run dist:win

# Salida: electron/dist/POS-Setup-1.0.0.exe
```

---

## ✅ Resumen de Cambios por Archivo

| Archivo/Carpeta | Acción | Propósito |
|----------------|--------|-----------|
| `backend/adapters/` | ⭐ CREAR | Capa de abstracción DB |
| `backend/config/database.js` | ⭐ CREAR | Detecta modo y elige DB |
| `backend/config/mongodb.js` | CREAR | Config MongoDB (código existente) |
| `backend/config/nedb.js` | ⭐ CREAR | Config NeDB local |
| `backend/server.js` | MODIFICAR | Exportar app, detección Electron |
| `backend/controllers/*` | MODIFICAR | Usar adapter en vez de modelos directos |
| `electron/` | ⭐ CREAR | Todo el código de Electron |
| `package.json` | MODIFICAR | Agregar scripts de build |

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Un solo código**: Mantienes una sola codebase
✅ **Sin duplicación**: No hay código duplicado
✅ **Fácil mantenimiento**: Cambios se aplican a ambos modos
✅ **Testing simple**: Pruebas web funcionan igual
✅ **Migración gradual**: Puedes migrar controlador por controlador
✅ **Sin breaking changes**: Modo web sigue funcionando 100%

---

## ⏱️ Tiempo Estimado por Paso

| Paso | Descripción | Tiempo |
|------|-------------|--------|
| 1 | Instalar dependencias | 10 min |
| 2 | Crear adapters y config | 2-3 hrs |
| 3 | Actualizar 1 controlador (prueba) | 30 min |
| 4 | Actualizar resto controladores | 3-4 hrs |
| 5 | Crear estructura Electron | 1-2 hrs |
| 6 | Testing modo web | 1 hr |
| 7 | Testing modo desktop | 2 hrs |
| 8 | Generar primer .exe | 1 hr |
| 9 | Pulir y optimizar | 2-3 hrs |
| **TOTAL** | | **2-3 días** |

---

## 🚀 Siguiente Paso Recomendado

**Empezar por un módulo pequeño como prueba de concepto:**

1. Crear adapters
2. Migrar solo controlador de `users`
3. Probar en modo web (debe seguir funcionando)
4. Probar en modo desktop con NeDB
5. Si funciona, migrar resto de controladores

¿Quieres que empecemos con el Paso 1 (adapters)?

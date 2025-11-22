# TuPOS - Sistema POS SaaS Multi-tenant

Sistema de punto de venta en la nube con arquitectura multi-tenant, diseñado para pequeños y medianos negocios.

## Estructura del Proyecto

```
pos-app/
├── apps/
│   ├── api/          # Backend (Node.js + Express + MongoDB)
│   ├── app/          # Aplicación principal (React)
│   └── landing/      # Página de aterrizaje (React)
├── package.json      # Workspace raíz
└── README.md
```

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local o Atlas)

## Instalación

1. Clonar el repositorio
```bash
git clone <repository-url>
cd pos-app
```

2. Instalar dependencias de todos los workspaces
```bash
npm run install:all
```

3. Configurar variables de entorno
```bash
# Copiar el archivo .env de ejemplo en apps/api
cp apps/api/.env.example apps/api/.env
# Editar las variables según tu configuración
```

## Desarrollo

### Ejecutar todo el proyecto
```bash
npm run dev
```

Esto iniciará:
- API en `http://localhost:5000`
- App principal en `http://localhost:3000`
- Landing page en `http://localhost:3001`

### Ejecutar servicios individuales

```bash
# Solo API
npm run dev:api

# Solo App
npm run dev:app

# Solo Landing
npm run dev:landing
```

## Build para Producción

```bash
# Build de todos los proyectos
npm run build

# Build individual
npm run build:api
npm run build:app
npm run build:landing
```

## Scripts Disponibles

- `npm run install:all` - Instala dependencias de todos los workspaces
- `npm run dev` - Inicia todos los servicios en modo desarrollo
- `npm run build` - Construye todos los proyectos para producción
- `npm start` - Inicia el servidor API en producción
- `npm test` - Ejecuta tests en todos los workspaces

## Tecnologías

### Backend (API)
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Stripe (pagos)

### Frontend (App)
- React 19
- React Router
- Axios
- TailwindCSS

### Landing Page
- React 18
- CSS personalizado

## Licencia

Propietario - Todos los derechos reservados
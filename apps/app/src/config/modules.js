// 📁 /frontend/src/config/modules.js
// Configuración basada en las rutas existentes de App.js

export const CORE_MODULES = {
  auth: {
    name: 'Autenticación',
    path: '/',
    enabled: true,
    routes: ['login'],
    permissions: ['public']
  },
  users: {
    name: 'Usuarios',
    path: '/admin/usuarios',
    enabled: true,
    routes: ['list'],
    permissions: ['admin']
  },
  products: {
    name: 'Productos',
    path: '/admin/productos',
    enabled: true,
    routes: ['list'],
    permissions: ['admin']
  },
  sales: {
    name: 'Ventas',
    path: '/admin/ventas',
    enabled: true,
    routes: ['list'],
    permissions: ['admin', 'vendedor', 'repartidor']
  },
  tiendas: {
    name: 'Tiendas',
    path: '/admin/tiendas',
    enabled: true,
    routes: ['list'],
    permissions: ['admin']
  }
};

export const OPTIONAL_MODULES = {
  clientes: {
    name: 'Clientes',
    path: '/admin/clientes',
    enabled: true,
    routes: ['list'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'Users'
  },
  devoluciones: {
    name: 'Devoluciones',
    path: '/admin/devoluciones',
    enabled: true,
    routes: ['list'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'RotateCcw'
  },
  gastos: {
    name: 'Gastos',
    path: '/admin/gastos',
    enabled: true,
    routes: ['list'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'Receipt'
  },
  empleados: {
    name: 'Empleados',
    path: '/admin/empleados',
    enabled: true,
    routes: ['list', 'history'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'UserCheck'
  },
  caja: {
    name: 'Caja',
    path: '/admin/caja',
    enabled: true,
    routes: ['list'],
    permissions: ['admin'],
    icon: 'DollarSign'
  },
  reportes: {
    name: 'Reportes',
    path: '/admin/reportes',
    enabled: true,
    routes: ['list'],
    permissions: ['admin'],
    icon: 'BarChart3'
  },
  delivery: {
    name: 'Delivery',
    path: '/admin/ordenes',
    enabled: true,
    routes: ['orders', 'tracking'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'Truck'
  },
  vacaciones: {
    name: 'Vacaciones',
    path: '/admin/vacaciones',
    enabled: true,
    routes: ['admin', 'request'],
    permissions: ['admin', 'vendedor', 'repartidor'],
    icon: 'Calendar'
  }
};

// Rutas existentes en tu App.js
export const EXISTING_ROUTES = {
  '/': 'LoginPage',
  '/admin/tiendas': 'TiendasPage',
  '/admin/usuarios': 'UsersPage',
  '/admin/productos': 'ProductsPage',
  '/admin/devoluciones': 'ReturnsPage',
  '/admin/reportes': 'ReportPage',
  '/admin/ventas': 'SalesPage',
  '/admin/clientes': 'ClientesPage',
  '/admin/empleados': 'EmployeesPage',
  '/admin/gastos': 'ExpensesPage',
  '/admin/ordenes': 'OrdersPage',
  '/admin/seguimiento-pedidos': 'OrderTrackingPage',
  '/admin/historial-empleados': 'EmployeeHistoryPage',
  '/admin/caja': 'CajaPage',
  '/vacaciones': 'VacationRequestPage',
  '/admin/vacaciones': 'VacationAdminPage'
};

export const getActiveModules = () => {
  const activeCore = Object.entries(CORE_MODULES)
    .filter(([_, config]) => config.enabled)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {});

  const activeOptional = Object.entries(OPTIONAL_MODULES)
    .filter(([_, config]) => config.enabled)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {});

  return { core: activeCore, modules: activeOptional };
};

export const hasModulePermission = (moduleName, userRole) => {
  const module = CORE_MODULES[moduleName] || OPTIONAL_MODULES[moduleName];
  if (!module) return false;
  
  return module.permissions.includes(userRole) || module.permissions.includes('public');
};

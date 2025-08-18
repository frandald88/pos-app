const moduleConfig = {
  core: {
    auth: { enabled: true, required: true },
    users: { enabled: true, required: true },
    tiendas: { enabled: true, required: true },
    products: { enabled: true, required: true },
    sales: { enabled: true, required: true }
  },

  modules: {
    empleados: { 
      enabled: process.env.MODULE_EMPLEADOS === 'true',
      dependencies: ['users', 'tiendas']
    },
    asistencia: { 
      enabled: process.env.MODULE_ASISTENCIA === 'true',
      dependencies: ['empleados']
    },
    vacaciones: { 
      enabled: process.env.MODULE_VACACIONES === 'true',
      dependencies: ['empleados']
    },
    reportes: { 
      enabled: process.env.MODULE_REPORTES === 'true',
      dependencies: ['sales']
    },
    delivery: { 
      enabled: process.env.MODULE_DELIVERY === 'true',
      dependencies: ['sales', 'users']
    },
    clientes: { 
      enabled: process.env.MODULE_CLIENTES === 'true',
      dependencies: ['sales']
    },
    gastos: { 
      enabled: process.env.MODULE_GASTOS === 'true',
      dependencies: ['users', 'tiendas']
    },
    caja: { 
      enabled: process.env.MODULE_CAJA === 'true',
      dependencies: ['sales']
    },
    devoluciones: { 
      enabled: process.env.MODULE_DEVOLUCIONES === 'true',
      dependencies: ['sales']
    }
  }
};

// Función para verificar dependencias
function checkDependencies(moduleName) {
  const module = moduleConfig.modules[moduleName];
  if (!module) return false;

  if (module.dependencies) {
    for (const dep of module.dependencies) {
      const coreModule = moduleConfig.core[dep];
      const optionalModule = moduleConfig.modules[dep];
      
      if (coreModule && !coreModule.enabled) return false;
      if (optionalModule && !optionalModule.enabled) return false;
    }
  }
  return true;
}

// Obtener módulos activos
function getActiveModules() {
  const active = { ...moduleConfig.core };
  
  Object.keys(moduleConfig.modules).forEach(moduleName => {
    const module = moduleConfig.modules[moduleName];
    if (module.enabled && checkDependencies(moduleName)) {
      active[moduleName] = module;
    }
  });
  
  return active;
}

module.exports = {
  moduleConfig,
  checkDependencies,
  getActiveModules
};
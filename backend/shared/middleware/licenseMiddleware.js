const fs = require('fs');
const path = require('path');

// Cargar licencia desde archivo
let license = null;

function loadLicense() {
  try {
    const licensePath = path.join(__dirname, '../../../license.json');
    const licenseData = fs.readFileSync(licensePath, 'utf8');
    license = JSON.parse(licenseData);

    console.log('📜 Licencia cargada exitosamente');
    console.log(`   Cliente: ${license.clientName}`);
    console.log(`   Tier: ${license.tier}`);
    console.log(`   Expira: ${new Date(license.expiresAt).toLocaleDateString()}`);

    return license;
  } catch (error) {
    console.error('❌ Error al cargar licencia:', error.message);
    console.log('⚠️  Usando configuración básica por defecto');

    // Licencia básica por defecto
    license = {
      clientId: 'unlicensed',
      clientName: 'Sin Licencia',
      tier: 'basic',
      modules: {},
      features: {
        maxUsers: 3,
        maxStores: 1,
        multiStore: false
      },
      active: true
    };

    return license;
  }
}

// Obtener licencia actual
function getLicense() {
  if (!license) {
    loadLicense();
  }
  return license;
}

// Verificar si un módulo está habilitado
function isModuleEnabled(moduleName) {
  const currentLicense = getLicense();

  if (!currentLicense.active) {
    return false;
  }

  // Si no existe en la configuración, asumimos que está deshabilitado
  return currentLicense.modules[moduleName] === true;
}

// Verificar si la licencia está expirada
function isLicenseExpired() {
  const currentLicense = getLicense();

  if (!currentLicense.expiresAt) {
    return false; // Sin fecha de expiración = no expira
  }

  const now = new Date();
  const expirationDate = new Date(currentLicense.expiresAt);

  return now > expirationDate;
}

// Verificar si la licencia está activa y válida
function isLicenseValid() {
  const currentLicense = getLicense();

  if (!currentLicense.active) {
    console.log('⚠️  Licencia inactiva');
    return false;
  }

  if (isLicenseExpired()) {
    console.log('⚠️  Licencia expirada');
    return false;
  }

  return true;
}

// Middleware para verificar si un módulo está habilitado
function requireModule(moduleName) {
  return (req, res, next) => {
    if (!isLicenseValid()) {
      return res.status(403).json({
        success: false,
        message: 'Licencia inválida o expirada',
        error: 'LICENSE_INVALID'
      });
    }

    if (!isModuleEnabled(moduleName)) {
      return res.status(403).json({
        success: false,
        message: `El módulo '${moduleName}' no está habilitado en tu licencia`,
        error: 'MODULE_NOT_LICENSED',
        module: moduleName
      });
    }

    next();
  };
}

// Endpoint para obtener información de la licencia (sin datos sensibles)
function getLicenseInfo(req, res) {
  const currentLicense = getLicense();

  // Información pública de la licencia
  const publicInfo = {
    clientName: currentLicense.clientName,
    tier: currentLicense.tier,
    modules: currentLicense.modules,
    features: currentLicense.features,
    expiresAt: currentLicense.expiresAt,
    active: currentLicense.active,
    isExpired: isLicenseExpired(),
    isValid: isLicenseValid()
  };

  res.json({
    success: true,
    license: publicInfo
  });
}

module.exports = {
  loadLicense,
  getLicense,
  isModuleEnabled,
  isLicenseExpired,
  isLicenseValid,
  requireModule,
  getLicenseInfo
};

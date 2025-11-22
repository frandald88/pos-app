# Verificar estructura del proyecto
Write-Host "🔍 VERIFICANDO ESTRUCTURA DEL PROYECTO" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

# Verificar donde estamos
Write-Host "`n📍 Directorio actual:" -ForegroundColor Cyan
Get-Location

# Verificar estructura de carpetas
Write-Host "`n📁 Estructura del proyecto:" -ForegroundColor Cyan
Get-ChildItem -Directory | ForEach-Object {
    Write-Host "  📂 $($_.Name)" -ForegroundColor Gray
    
    # Verificar si tiene package.json
    if (Test-Path "$($_.Name)/package.json") {
        Write-Host "    📄 package.json ✅" -ForegroundColor Green
    }
    
    # Verificar si tiene node_modules
    if (Test-Path "$($_.Name)/node_modules") {
        Write-Host "    📦 node_modules ✅" -ForegroundColor Green
    }
    
    # Verificar si tiene server.js
    if (Test-Path "$($_.Name)/server.js") {
        Write-Host "    🚀 server.js ✅" -ForegroundColor Green
    }
}

# Verificar en directorio actual
Write-Host "`n📋 En directorio actual:" -ForegroundColor Cyan
if (Test-Path "package.json") {
    Write-Host "  📄 package.json ✅" -ForegroundColor Green
} else {
    Write-Host "  📄 package.json ❌" -ForegroundColor Red
}

if (Test-Path "node_modules") {
    Write-Host "  📦 node_modules ✅" -ForegroundColor Green
} else {
    Write-Host "  📦 node_modules ❌" -ForegroundColor Red
}

# Verificar package.json en backend
Write-Host "`n📋 En carpeta backend:" -ForegroundColor Cyan
if (Test-Path "backend/package.json") {
    Write-Host "  📄 package.json ✅" -ForegroundColor Green
    $backendPackage = Get-Content "backend/package.json" | ConvertFrom-Json
    Write-Host "  📦 Dependencias principales:" -ForegroundColor Gray
    if ($backendPackage.dependencies) {
        $backendPackage.dependencies.PSObject.Properties | ForEach-Object {
            Write-Host "    - $($_.Name): $($_.Value)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "    ❌ No hay dependencias" -ForegroundColor Red
    }
} else {
    Write-Host "  📄 package.json ❌" -ForegroundColor Red
}

if (Test-Path "backend/node_modules") {
    Write-Host "  📦 node_modules ✅" -ForegroundColor Green
} else {
    Write-Host "  📦 node_modules ❌" -ForegroundColor Red
}

Write-Host "`n💡 RECOMENDACIONES:" -ForegroundColor Yellow
Write-Host "1. Si node_modules está en raíz: ejecuta comandos desde raíz" -ForegroundColor White
Write-Host "2. Si no hay node_modules en backend: cd backend && npm install" -ForegroundColor White
Write-Host "3. Verificar que package.json tenga las dependencias correctas" -ForegroundColor White
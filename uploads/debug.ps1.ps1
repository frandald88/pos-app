# Script para encontrar rutas mal formadas
Write-Host "🔍 BUSCANDO RUTAS MAL FORMADAS" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

# Buscar archivos de rutas
$routeFiles = Get-ChildItem -Recurse -Include "*routes*.js", "*route*.js" | Where-Object {
    $_.FullName -notmatch "node_modules"
}

$problematicPatterns = @(
    '/:$',           # parámetro sin nombre al final
    '/:\s',          # parámetro sin nombre seguido de espacio
    '/:/',           # parámetro sin nombre seguido de /
    '/:,',           # parámetro sin nombre seguido de coma
    '/:\)',          # parámetro sin nombre seguido de )
    '\.get\s*\(\s*[''"].*:$',  # rutas que terminan con :
    '\.post\s*\(\s*[''"].*:$',
    '\.put\s*\(\s*[''"].*:$', 
    '\.patch\s*\(\s*[''"].*:$',
    '\.delete\s*\(\s*[''"].*:$'
)

Write-Host "`n📁 Archivos de rutas encontrados:" -ForegroundColor Cyan
foreach ($file in $routeFiles) {
    Write-Host "  📄 $($file.FullName)" -ForegroundColor Gray
}

Write-Host "`n🔍 Buscando patrones problemáticos..." -ForegroundColor Cyan

$foundIssues = $false

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName
    
    Write-Host "`n📋 Analizando: $($file.Name)" -ForegroundColor White
    
    # Buscar patrones problemáticos
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        $lineNumber = $i + 1
        
        foreach ($pattern in $problematicPatterns) {
            if ($line -match $pattern) {
                Write-Host "  ❌ Línea $lineNumber`: Patrón problemático encontrado" -ForegroundColor Red
                Write-Host "     $line" -ForegroundColor Gray
                Write-Host "     Patrón: $pattern" -ForegroundColor Yellow
                $foundIssues = $true
            }
        }
        
        # Buscar rutas con parámetros mal formados específicamente
        if ($line -match "router\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]*)['\"]") {
            $route = $matches[2]
            if ($route -match ":$" -or $route -match ":/") {
                Write-Host "  ❌ Línea $lineNumber`: Ruta mal formada: $route" -ForegroundColor Red
                Write-Host "     $line" -ForegroundColor Gray
                $foundIssues = $true
            }
        }
    }
    
    # Buscar todas las rutas definidas
    $routeMatches = [regex]::Matches($content, "router\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]*)['\"]")
    
    if ($routeMatches.Count -gt 0) {
        Write-Host "  📋 Rutas encontradas:" -ForegroundColor Green
        foreach ($match in $routeMatches) {
            $method = $match.Groups[1].Value.ToUpper()
            $route = $match.Groups[2].Value
            
            if ($route -match ":$" -or $route -match ":/" -or $route -match ":\s") {
                Write-Host "    ❌ $method $route (PROBLEMÁTICA)" -ForegroundColor Red
            } else {
                Write-Host "    ✅ $method $route" -ForegroundColor Green
            }
        }
    }
}

if (-not $foundIssues) {
    Write-Host "`n✅ No se encontraron patrones problemáticos obvios" -ForegroundColor Green
    Write-Host "El error podría estar en:" -ForegroundColor Yellow
    Write-Host "1. Un archivo de rutas que no se encontró" -ForegroundColor White
    Write-Host "2. Una ruta definida dinámicamente" -ForegroundColor White
    Write-Host "3. Un middleware que modifica rutas" -ForegroundColor White
} else {
    Write-Host "`n❌ Se encontraron patrones problemáticos" -ForegroundColor Red
    Write-Host "Revisa las líneas marcadas arriba" -ForegroundColor Yellow
}

Write-Host "`n💡 BUSCAR MANUALMENTE:" -ForegroundColor Cyan
Write-Host "Busca en tu código patrones como:" -ForegroundColor White
Write-Host "  - router.get('/:') o router.post('/:')  " -ForegroundColor Gray
Write-Host "  - router.get('/:/', callback)" -ForegroundColor Gray  
Write-Host "  - router.get('/something/:') " -ForegroundColor Gray
Write-Host "  - Rutas que terminan con dos puntos :" -ForegroundColor Gray
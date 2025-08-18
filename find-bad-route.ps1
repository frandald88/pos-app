# Buscar la ruta problemática exacta
Write-Host "🔍 BUSCANDO RUTA PROBLEMÁTICA EXACTA" -ForegroundColor Yellow

$file = "backend\modules\devoluciones\routes.js"

if (Test-Path $file) {
    $lines = Get-Content $file
    
    Write-Host "📋 Analizando $($lines.Length) líneas..." -ForegroundColor Cyan
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i].Trim()
        $lineNumber = $i + 1
        
        # Buscar líneas con router.
        if ($line -match "router\.(get|post|put|patch|delete)") {
            Write-Host "Línea $lineNumber`: $line" -ForegroundColor White
            
            # Verificar patrones problemáticos específicos
            if ($line -match "router\.\w+\s*\(\s*['\`"]([^'\`"]*)['\`"]") {
                $route = $matches[1]
                
                # Verificar patrones problemáticos
                if ($route -match ":$") {
                    Write-Host "  🔥 PROBLEMA: Ruta termina con ':' - $route" -ForegroundColor Red
                } elseif ($route -match ":/") {
                    Write-Host "  🔥 PROBLEMA: Ruta tiene ':/' - $route" -ForegroundColor Red
                } elseif ($route -match ":\s") {
                    Write-Host "  🔥 PROBLEMA: Ruta tiene ': ' (espacio) - $route" -ForegroundColor Red
                } elseif ($route -match ":[^a-zA-Z0-9_]") {
                    Write-Host "  🔥 PROBLEMA: Parámetro mal formado - $route" -ForegroundColor Red
                } else {
                    Write-Host "  ✅ Ruta OK - $route" -ForegroundColor Green
                }
            } else {
                Write-Host "  ⚠️ No se pudo extraer la ruta" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "❌ Archivo no encontrado: $file" -ForegroundColor Red
}

Write-Host "`n🔍 Busca las líneas marcadas con 🔥" -ForegroundColor Yellow
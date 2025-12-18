@echo off
echo ================================================
echo    ASTRODISH PRINT SERVER - INICIADOR
echo ================================================
echo.

REM Verificar si existe el ejecutable
if exist "AstrodishPrintServer-win.exe" (
    echo Ejecutando Astrodish Print Server...
    echo.
    start "" "AstrodishPrintServer-win.exe"
    echo.
    echo El servidor se está iniciando...
    timeout /t 3 /nobreak >nul
    echo.
    echo Abriendo navegador para verificar estado...
    timeout /t 2 /nobreak >nul
    start http://localhost:9100/health
    echo.
    echo ================================================
    echo   El Print Server está ejecutándose
    echo   Puede cerrar esta ventana
    echo ================================================
    pause
) else if exist "server.js" (
    echo No se encontró el ejecutable.
    echo Ejecutando desde código fuente con Node.js...
    echo.
    node server.js
) else (
    echo ERROR: No se encontró ni el ejecutable ni el código fuente.
    echo.
    echo Por favor descarga el ejecutable o clona el repositorio.
    pause
    exit /b 1
)

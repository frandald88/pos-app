#!/bin/bash

echo "================================================"
echo "   ASTRODISH PRINT SERVER - INICIADOR"
echo "================================================"
echo ""

# Detectar sistema operativo
OS="$(uname -s)"
case "${OS}" in
    Linux*)     EXECUTABLE="AstrodishPrintServer-linux";;
    Darwin*)    EXECUTABLE="AstrodishPrintServer-mac";;
    *)          EXECUTABLE="unknown";;
esac

# Verificar si existe el ejecutable
if [ -f "$EXECUTABLE" ]; then
    echo "Ejecutando Astrodish Print Server ($EXECUTABLE)..."
    echo ""

    # Dar permisos de ejecución si no los tiene
    chmod +x "$EXECUTABLE"

    # Ejecutar el servidor
    ./"$EXECUTABLE" &
    SERVER_PID=$!

    echo "El servidor se está iniciando... (PID: $SERVER_PID)"
    sleep 3

    echo ""
    echo "Verificando estado del servidor..."
    sleep 2

    # Intentar abrir el navegador
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:9100/health
    elif command -v open > /dev/null; then
        open http://localhost:9100/health
    else
        echo "Por favor abre http://localhost:9100/health en tu navegador"
    fi

    echo ""
    echo "================================================"
    echo "   El Print Server está ejecutándose"
    echo "   PID: $SERVER_PID"
    echo "   Para detener: kill $SERVER_PID"
    echo "================================================"

elif [ -f "server.js" ]; then
    echo "No se encontró el ejecutable."
    echo "Ejecutando desde código fuente con Node.js..."
    echo ""

    if command -v node > /dev/null; then
        node server.js
    else
        echo "ERROR: Node.js no está instalado."
        echo "Por favor instala Node.js desde https://nodejs.org/"
        exit 1
    fi
else
    echo "ERROR: No se encontró ni el ejecutable ni el código fuente."
    echo ""
    echo "Por favor descarga el ejecutable o clona el repositorio."
    exit 1
fi

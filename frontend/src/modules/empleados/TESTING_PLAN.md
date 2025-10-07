# Plan de Pruebas - EmpleadosPage.js
## Cobertura Total de Funcionalidad

---

## 1. PRUEBAS DE CARGA INICIAL

### 1.1 Carga de Datos del Usuario Actual
**Objetivo:** Verificar que el usuario actual se cargue correctamente

**Pasos:**
1. Iniciar sesión con credenciales válidas
2. Navegar a `/empleados` o `/asistencia`
3. Verificar que la página cargue sin errores

**Resultado Esperado:**
- ✅ El nombre del usuario aparece en el selector (si no es admin)
- ✅ No hay mensajes de error
- ✅ Los datos del usuario se muestran correctamente

**Casos de Prueba:**
- [ ] **CP-1.1.1:** Usuario con rol `vendedor`
- [ ] **CP-1.1.2:** Usuario con rol `repartidor`
- [ ] **CP-1.1.3:** Usuario con rol `admin`

---

### 1.2 Carga de Lista de Empleados
**Objetivo:** Verificar que la lista de empleados se cargue según el rol

**Pasos:**
1. Iniciar sesión como admin
2. Navegar a la página de empleados
3. Verificar el selector de empleados

**Resultado Esperado (Admin):**
- ✅ El selector muestra todos los vendedores y repartidores
- ✅ El selector NO muestra usuarios con rol `admin`
- ✅ El selector está vacío por defecto (sin usuario pre-seleccionado)

**Resultado Esperado (Vendedor/Repartidor):**
- ✅ El selector solo muestra el usuario actual
- ✅ El usuario actual está pre-seleccionado
- ✅ El selector está deshabilitado
- ✅ Mensaje: "Solo puedes registrar tu propia asistencia"

**Casos de Prueba:**
- [ ] **CP-1.2.1:** Admin ve todos los empleados (vendedores y repartidores)
- [ ] **CP-1.2.2:** Vendedor solo ve su propio usuario
- [ ] **CP-1.2.3:** Repartidor solo ve su propio usuario
- [ ] **CP-1.2.4:** Lista vacía si no hay empleados registrados

---

### 1.3 Carga de Tiendas
**Objetivo:** Verificar que las tiendas se carguen correctamente

**Pasos:**
1. Navegar a la sección de reportes (solo admin)
2. Verificar el selector de tiendas

**Resultado Esperado:**
- ✅ Todas las tiendas aparecen en el selector
- ✅ Opción "Todas las tiendas" está disponible
- ✅ No hay tiendas duplicadas

**Casos de Prueba:**
- [ ] **CP-1.3.1:** Sistema con múltiples tiendas
- [ ] **CP-1.3.2:** Sistema con una sola tienda
- [ ] **CP-1.3.3:** Error en carga de tiendas (manejo de errores)

---

## 2. PRUEBAS DE ESTADO DE ASISTENCIA

### 2.1 Visualización del Estado Actual
**Objetivo:** Verificar que el estado de asistencia se muestre correctamente

**Pasos:**
1. Seleccionar un empleado
2. Verificar el componente "Estado Actual de Asistencia"

**Resultado Esperado:**
- ✅ Muestra el estado actual (No iniciado, Trabajando, En descanso, etc.)
- ✅ Muestra horas trabajadas
- ✅ Muestra tiempo en descansos
- ✅ Muestra número de entradas del día

**Casos de Prueba:**
- [ ] **CP-2.1.1:** Empleado sin check-in del día
- [ ] **CP-2.1.2:** Empleado con check-in activo
- [ ] **CP-2.1.3:** Empleado en descanso
- [ ] **CP-2.1.4:** Empleado con múltiples entradas

---

### 2.2 Registro del Día (Time Entries)
**Objetivo:** Verificar que se muestren todas las entradas del día

**Resultado Esperado:**
- ✅ Lista ordenada de entradas (check-in/check-out)
- ✅ Tipo de entrada identificado (💼 Trabajo, ☕ Descanso, 🍽️ Almuerzo)
- ✅ Horas de entrada y salida formateadas
- ✅ Duración calculada o "En curso"

**Casos de Prueba:**
- [ ] **CP-2.2.1:** Entrada de trabajo sin salida (en curso)
- [ ] **CP-2.2.2:** Entrada de trabajo con salida (completada)
- [ ] **CP-2.2.3:** Entrada de descanso
- [ ] **CP-2.2.4:** Entrada de almuerzo
- [ ] **CP-2.2.5:** Múltiples entradas del mismo tipo

---

## 3. PRUEBAS DE CHECK-IN

### 3.1 Check-In Exitoso
**Objetivo:** Verificar el proceso de check-in normal

**Pasos:**
1. Seleccionar un empleado sin check-in activo
2. Seleccionar tipo de entrada (Trabajo/Descanso/Almuerzo)
3. Hacer clic en "Check-In"

**Resultado Esperado:**
- ✅ Mensaje: "Check-in exitoso ✅"
- ✅ El estado de asistencia se actualiza automáticamente
- ✅ Aparece una nueva entrada en el registro del día
- ✅ Las horas trabajadas comienzan a contar

**Casos de Prueba:**
- [ ] **CP-3.1.1:** Check-in de trabajo (primera entrada del día)
- [ ] **CP-3.1.2:** Check-in después de un descanso
- [ ] **CP-3.1.3:** Check-in de descanso
- [ ] **CP-3.1.4:** Check-in de almuerzo

---

### 3.2 Check-In con Validaciones
**Objetivo:** Verificar validaciones y casos especiales

**Casos de Prueba:**
- [ ] **CP-3.2.1:** Check-in sin seleccionar empleado
  - Resultado: "Selecciona un empleado primero ❌"

- [ ] **CP-3.2.2:** Check-in con empleado sin horario asignado
  - Resultado: Mensaje del backend con 📅

- [ ] **CP-3.2.3:** Check-in con empleado sin ruta (para repartidores)
  - Resultado: Mensaje del backend sobre ruta no encontrada

- [ ] **CP-3.2.4:** Check-in cuando ya existe un check-in activo
  - Resultado: Mensaje de error apropiado

- [ ] **CP-3.2.5:** Check-in durante período de carga (loading)
  - Resultado: Botón deshabilitado, muestra "Procesando..."

---

## 4. PRUEBAS DE CHECK-OUT

### 4.1 Check-Out Exitoso
**Objetivo:** Verificar el proceso de check-out normal

**Pasos:**
1. Seleccionar un empleado con check-in activo
2. Seleccionar tipo de salida (Descanso/Almuerzo/Fin de día)
3. Hacer clic en "Check-Out"

**Resultado Esperado:**
- ✅ Mensaje: "Check-out exitoso ✅"
- ✅ El estado de asistencia se actualiza
- ✅ La entrada actual muestra hora de salida
- ✅ Se calcula la duración

**Casos de Prueba:**
- [ ] **CP-4.1.1:** Check-out para descanso
- [ ] **CP-4.1.2:** Check-out para almuerzo
- [ ] **CP-4.1.3:** Check-out de fin de día
- [ ] **CP-4.1.4:** Check-out después de varias horas

---

### 4.2 Check-Out con Validaciones
**Objetivo:** Verificar validaciones y casos especiales

**Casos de Prueba:**
- [ ] **CP-4.2.1:** Check-out sin seleccionar empleado
  - Resultado: "Selecciona un empleado primero ❌"

- [ ] **CP-4.2.2:** Check-out sin check-in activo
  - Resultado: Mensaje de error apropiado

- [ ] **CP-4.2.3:** Check-out inmediato (menos de 1 minuto)
  - Resultado: Check-out exitoso con duración mínima

- [ ] **CP-4.2.4:** Check-out durante período de carga
  - Resultado: Botón deshabilitado

---

## 5. PRUEBAS DE REGISTRO DE AUSENCIAS

### 5.1 Ausencia Exitosa
**Objetivo:** Verificar el registro de ausencias

**Pasos:**
1. Seleccionar un empleado
2. Escribir razón de ausencia (ej: "Enfermedad")
3. Hacer clic en "Registrar Ausencia"

**Resultado Esperado:**
- ✅ Mensaje: "Falta registrada exitosamente ✅"
- ✅ El campo de razón se limpia automáticamente
- ✅ El registro se guarda en el sistema

**Casos de Prueba:**
- [ ] **CP-5.1.1:** Ausencia por enfermedad
- [ ] **CP-5.1.2:** Ausencia por motivos personales
- [ ] **CP-5.1.3:** Ausencia con razón larga (>100 caracteres)

---

### 5.2 Validaciones de Ausencia
**Objetivo:** Verificar validaciones del registro de ausencias

**Casos de Prueba:**
- [ ] **CP-5.2.1:** Ausencia sin seleccionar empleado
  - Resultado: "Selecciona un empleado primero ❌"

- [ ] **CP-5.2.2:** Ausencia sin proporcionar razón
  - Resultado: "Proporciona una razón de ausencia ❌"

- [ ] **CP-5.2.3:** Ausencia con campo vacío (solo espacios)
  - Resultado: "Proporciona una razón de ausencia ❌"

- [ ] **CP-5.2.4:** Ausencia para empleado sin horario
  - Resultado: Mensaje del backend con 📅

---

## 6. PRUEBAS DE REPORTES (Solo Admin)

### 6.1 Generación de Reporte
**Objetivo:** Verificar la generación de reportes de asistencia

**Pasos (Admin):**
1. Hacer clic en "Ver Reportes"
2. Seleccionar fechas de inicio y fin
3. Opcionalmente seleccionar empleado y tienda
4. Hacer clic en "Generar Reporte"

**Resultado Esperado:**
- ✅ Mensaje: "Reporte generado exitosamente ✅ - X registros encontrados"
- ✅ Tabla con todos los registros
- ✅ Estadísticas: Total, Presentes, Tardes, Ausentes

**Casos de Prueba:**
- [ ] **CP-6.1.1:** Reporte de todos los empleados, todas las tiendas
- [ ] **CP-6.1.2:** Reporte de un empleado específico
- [ ] **CP-6.1.3:** Reporte de una tienda específica
- [ ] **CP-6.1.4:** Reporte con rango de fechas de 1 día
- [ ] **CP-6.1.5:** Reporte con rango de fechas de 1 mes
- [ ] **CP-6.1.6:** Reporte con rango de fechas de 1 año

---

### 6.2 Validaciones de Reporte
**Objetivo:** Verificar validaciones al generar reportes

**Casos de Prueba:**
- [ ] **CP-6.2.1:** Generar sin fecha de inicio
  - Resultado: "Debes seleccionar una fecha de inicio y fin para el reporte ❌"

- [ ] **CP-6.2.2:** Generar sin fecha de fin
  - Resultado: "Debes seleccionar una fecha de inicio y fin para el reporte ❌"

- [ ] **CP-6.2.3:** Fecha fin anterior a fecha inicio
  - Resultado: "La fecha 'hasta' no puede ser anterior a la fecha 'desde' ❌"

- [ ] **CP-6.2.4:** Reporte sin registros
  - Resultado: "No se encontraron registros para las fechas seleccionadas 📋"

---

### 6.3 Visualización de Reporte
**Objetivo:** Verificar que los datos del reporte se muestren correctamente

**Columnas Esperadas:**
- ✅ Fecha (formato: día, mes, año)
- ✅ Empleado (username)
- ✅ Tienda (nombre)
- ✅ Estado (badge con color y ícono)
- ✅ Entrada (hora formateada)
- ✅ Salida (hora formateada)
- ✅ Horas (calculadas con 2 decimales)
- ✅ Notas

**Casos de Prueba:**
- [ ] **CP-6.3.1:** Estado "Presente" (badge verde ✅)
- [ ] **CP-6.3.2:** Estado "Tarde" (badge amarillo ⏰)
- [ ] **CP-6.3.3:** Estado "Ausente" (badge rojo ❌)
- [ ] **CP-6.3.4:** Registro sin salida (muestra "-")
- [ ] **CP-6.3.5:** Registro con notas
- [ ] **CP-6.3.6:** Registro sin notas (muestra "-")

---

### 6.4 Estadísticas del Reporte
**Objetivo:** Verificar cálculos de estadísticas

**Resultado Esperado:**
- ✅ Total Registros: suma correcta
- ✅ Presentes: cantidad correcta
- ✅ Tardes: cantidad correcta
- ✅ Ausentes: cantidad correcta

**Casos de Prueba:**
- [ ] **CP-6.4.1:** Reporte con solo presentes
- [ ] **CP-6.4.2:** Reporte con solo ausentes
- [ ] **CP-6.4.3:** Reporte con mezcla de estados
- [ ] **CP-6.4.4:** Reporte vacío (todas las estadísticas en 0)

---

## 7. PRUEBAS DE PERMISOS Y ROLES

### 7.1 Permisos de Admin
**Objetivo:** Verificar funcionalidades exclusivas de admin

**Casos de Prueba:**
- [ ] **CP-7.1.1:** Admin puede ver botón "Ver Reportes"
- [ ] **CP-7.1.2:** Admin puede seleccionar cualquier empleado
- [ ] **CP-7.1.3:** Admin puede hacer check-in/check-out de cualquier empleado
- [ ] **CP-7.1.4:** Admin puede registrar ausencias de cualquier empleado
- [ ] **CP-7.1.5:** Admin puede generar reportes

---

### 7.2 Permisos de Vendedor/Repartidor
**Objetivo:** Verificar restricciones para usuarios no-admin

**Casos de Prueba:**
- [ ] **CP-7.2.1:** NO puede ver botón "Ver Reportes"
- [ ] **CP-7.2.2:** Selector de empleado está deshabilitado
- [ ] **CP-7.2.3:** Solo puede ver su propio usuario pre-seleccionado
- [ ] **CP-7.2.4:** Solo puede hacer check-in/check-out de sí mismo
- [ ] **CP-7.2.5:** Solo puede registrar sus propias ausencias

---

## 8. PRUEBAS DE INTERFAZ Y UX

### 8.1 Mensajes y Feedback
**Objetivo:** Verificar que los mensajes al usuario sean claros

**Casos de Prueba:**
- [ ] **CP-8.1.1:** Mensajes de éxito se muestran en verde con ✅
- [ ] **CP-8.1.2:** Mensajes de error se muestran en rojo con ❌
- [ ] **CP-8.1.3:** Mensajes desaparecen automáticamente después de 3-5 segundos
- [ ] **CP-8.1.4:** Estados de carga muestran "Procesando..."
- [ ] **CP-8.1.5:** Botones se deshabilitan durante operaciones

---

### 8.2 Responsividad
**Objetivo:** Verificar que la página funcione en diferentes tamaños de pantalla

**Casos de Prueba:**
- [ ] **CP-8.2.1:** Desktop (>1024px) - Layout de 4 columnas
- [ ] **CP-8.2.2:** Tablet (768px-1024px) - Layout de 2 columnas
- [ ] **CP-8.2.3:** Mobile (<768px) - Layout de 1 columna
- [ ] **CP-8.2.4:** Tabla de reporte con scroll horizontal en mobile

---

### 8.3 Estados de Carga
**Objetivo:** Verificar indicadores visuales durante operaciones asíncronas

**Casos de Prueba:**
- [ ] **CP-8.3.1:** Spinner durante carga inicial
- [ ] **CP-8.3.2:** Botones deshabilitados con "Procesando..."
- [ ] **CP-8.3.3:** Estado de carga al generar reporte

---

## 9. PRUEBAS DE NAVEGACIÓN

### 9.1 Enlaces y Botones
**Objetivo:** Verificar navegación dentro de la página

**Casos de Prueba:**
- [ ] **CP-9.1.1:** Botón "Solicitar Vacaciones" redirige a `/vacaciones`
- [ ] **CP-9.1.2:** Botón "Ver Reportes" muestra/oculta sección de reportes
- [ ] **CP-9.1.3:** Volver a la página mantiene el estado previo

---

## 10. PRUEBAS DE MANEJO DE ERRORES

### 10.1 Errores de Red
**Objetivo:** Verificar comportamiento ante fallos de conexión

**Casos de Prueba:**
- [ ] **CP-10.1.1:** Error al cargar usuario actual
- [ ] **CP-10.1.2:** Error al cargar empleados
- [ ] **CP-10.1.3:** Error al cargar tiendas
- [ ] **CP-10.1.4:** Error al hacer check-in
- [ ] **CP-10.1.5:** Error al hacer check-out
- [ ] **CP-10.1.6:** Error al registrar ausencia
- [ ] **CP-10.1.7:** Error al cargar estado de asistencia
- [ ] **CP-10.1.8:** Error al generar reporte

**Resultado Esperado para todos:**
- ✅ Mensaje de error descriptivo
- ✅ No se rompe la aplicación
- ✅ Usuario puede reintentar la operación

---

### 10.2 Errores del Backend
**Objetivo:** Verificar manejo de errores específicos del backend

**Casos de Prueba:**
- [ ] **CP-10.2.1:** Error "NO_SCHEDULE_ASSIGNED"
  - Resultado: Mensaje con 📅

- [ ] **CP-10.2.2:** Error "ROUTE_NOT_FOUND"
  - Resultado: Mensaje sobre ruta no encontrada

- [ ] **CP-10.2.3:** Error 401 (No autorizado)
  - Resultado: Redirigir a login

- [ ] **CP-10.2.4:** Error 500 (Error del servidor)
  - Resultado: Mensaje genérico de error

---

## 11. PRUEBAS DE INTEGRACIÓN

### 11.1 Flujo Completo de un Día Laboral
**Objetivo:** Simular un día completo de trabajo

**Escenario:**
1. Empleado hace check-in al inicio del día (tipo: Trabajo)
2. Hace check-out para descanso
3. Hace check-in después del descanso
4. Hace check-out para almuerzo
5. Hace check-in después del almuerzo
6. Hace check-out de fin de día

**Resultado Esperado:**
- ✅ Todas las operaciones exitosas
- ✅ Registro del día muestra 6 entradas
- ✅ Horas trabajadas calculadas correctamente
- ✅ Tiempo de descansos calculado correctamente
- ✅ Estado final: "Día finalizado"

**Casos de Prueba:**
- [ ] **CP-11.1.1:** Flujo completo para vendedor
- [ ] **CP-11.1.2:** Flujo completo para repartidor
- [ ] **CP-11.1.3:** Admin registrando para otro empleado

---

### 11.2 Generación y Verificación de Reporte
**Objetivo:** Verificar que los datos registrados aparezcan en reportes

**Escenario:**
1. Registrar asistencia de varios empleados en diferentes días
2. Generar reporte para el período
3. Verificar que todos los registros aparezcan

**Resultado Esperado:**
- ✅ Todos los registros aparecen
- ✅ Estadísticas son correctas
- ✅ Filtros funcionan correctamente

**Casos de Prueba:**
- [ ] **CP-11.2.1:** Reporte después de múltiples check-ins
- [ ] **CP-11.2.2:** Reporte con ausencias registradas
- [ ] **CP-11.2.3:** Reporte con diferentes estados (Presente, Tarde, Ausente)

---

## 12. PRUEBAS DE RENDIMIENTO

### 12.1 Carga con Muchos Datos
**Objetivo:** Verificar rendimiento con grandes volúmenes

**Casos de Prueba:**
- [ ] **CP-12.1.1:** Reporte con >100 registros
- [ ] **CP-12.1.2:** Reporte con >500 registros
- [ ] **CP-12.1.3:** Reporte con >1000 registros
- [ ] **CP-12.1.4:** Empleado con >20 entradas en el mismo día

**Resultado Esperado:**
- ✅ Carga en <3 segundos
- ✅ Tabla renderiza sin lag
- ✅ Scroll funciona suavemente

---

## 13. CHECKLIST DE VERIFICACIÓN VISUAL

### 13.1 Diseño y Estilos
- [ ] Colores consistentes con el resto de la aplicación
- [ ] Íconos apropiados (✅, ❌, ⏰, 💼, ☕, 🍽️, 📊, etc.)
- [ ] Bordes y sombras aplicados correctamente
- [ ] Espaciado uniforme entre elementos
- [ ] Fuentes legibles y del tamaño apropiado

### 13.2 Accesibilidad
- [ ] Contraste de colores adecuado
- [ ] Botones tienen tamaño mínimo de 44x44px
- [ ] Labels asociados a inputs
- [ ] Estados de hover/focus visibles
- [ ] Mensajes de error descriptivos

---

## RESUMEN DE COBERTURA

### Total de Casos de Prueba: **100+**

**Por Módulo:**
- Carga Inicial: 8 casos
- Estado de Asistencia: 9 casos
- Check-In: 9 casos
- Check-Out: 8 casos
- Ausencias: 7 casos
- Reportes: 26 casos
- Permisos: 10 casos
- Interfaz: 9 casos
- Navegación: 3 casos
- Errores: 12 casos
- Integración: 6 casos
- Rendimiento: 4 casos
- Visual/Accesibilidad: 10 casos

---

## PRIORIZACIÓN DE PRUEBAS

### Prioridad Alta (Críticas):
- CP-1.1.1, CP-1.1.2, CP-1.1.3 (Carga de usuario)
- CP-3.1.1 (Check-in básico)
- CP-4.1.1 (Check-out básico)
- CP-7.1.x, CP-7.2.x (Permisos)
- CP-10.x.x (Manejo de errores)

### Prioridad Media (Importantes):
- CP-2.x.x (Estado de asistencia)
- CP-5.x.x (Ausencias)
- CP-6.1.x (Reportes básicos)
- CP-8.x.x (UX)

### Prioridad Baja (Opcionales):
- CP-12.x.x (Rendimiento)
- CP-13.x.x (Visual)

---

## HERRAMIENTAS RECOMENDADAS

- **Pruebas Manuales:** Navegador web con DevTools
- **Pruebas Automatizadas:** Jest + React Testing Library
- **Pruebas E2E:** Cypress o Playwright
- **Pruebas de Rendimiento:** Lighthouse, Chrome DevTools Performance
- **Pruebas de Accesibilidad:** axe DevTools

---

## NOTAS IMPORTANTES

1. **Token de Autenticación:** Todas las pruebas requieren un token válido en localStorage
2. **Datos de Prueba:** Crear datos de prueba en el backend antes de ejecutar
3. **Fechas:** Usar fechas relativas (hoy, ayer, etc.) para pruebas repetibles
4. **Limpieza:** Limpiar datos de prueba después de cada ejecución
5. **Logs:** Verificar console.log para errores no mostrados al usuario

---

**Fecha de Creación:** 2025-01-04
**Versión:** 1.0
**Última Actualización:** 2025-01-04

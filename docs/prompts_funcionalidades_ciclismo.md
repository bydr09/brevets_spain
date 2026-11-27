# Prompts de desarrollo — Plataforma cicloturista

Prompts listos para utilizar con un asistente de programación (Claude Code, Codex u otro). Están pensados para trabajar en un repositorio real y desarrollar los módulos de forma incremental. **Antes de comenzar, proporciona al asistente `funcionalidades_ciclismo.md` como especificación funcional.**

## Prompt 0 — Preparar la base común

```text
Actúa como arquitecto de software y desarrollador full-stack senior.

Lee íntegramente funcionalidades_ciclismo.md y revisa el repositorio existente antes de modificar archivos. Vamos a construir una plataforma cicloturista con tres módulos independientes pero integrados: Calendario de Brevets, Simulador de Brevets y Observatorio de Vías Verdes. No es una red social ni otro Strava.

Objetivos de esta tarea:
1. Audita la estructura actual del proyecto y propón una arquitectura pragmática, priorizando reutilizar lo que ya exista.
2. Si el repositorio está vacío, prepara una base con React + TypeScript, FastAPI y PostgreSQL/PostGIS, con Docker Compose para desarrollo local.
3. Define entidades compartidas, migraciones, validación de datos, gestión de errores, configuración por variables de entorno y documentación de arranque.
4. Establece una estrategia común de procedencia de datos: fuente, URL, fecha de consulta, fecha de publicación y estado de verificación.
5. Configura pruebas básicas y una estructura preparada para añadir los tres módulos sin acoplamientos innecesarios.

Restricciones:
- No inventes datos reales ni credenciales.
- No añadas dependencias innecesarias ni automatizaciones de scraping todavía.
- Si hay decisiones de producto sin resolver, explica tus supuestos antes de implementarlos.
- No sobrescribas código existente sin justificarlo.

Entregables: código funcional, README de ejecución, esquema de arquitectura, migraciones y pruebas. Al terminar, indica archivos modificados, comandos para ejecutar y limitaciones pendientes.
```

## Prompt 1 — Calendario de Brevets

```text
Actúa como desarrollador full-stack especializado en aplicaciones de calendario y gestión de eventos deportivos.

Lee funcionalidades_ciclismo.md, especialmente el apartado «Calendario de Brevets», e inspecciona la arquitectura existente. Implementa el MVP completo de este módulo, sin modificar los otros dos salvo por componentes compartidos justificados.

Requisitos:
- Modelo de eventos con nombre, organizador, fecha/hora y zona horaria, salida, distancia, desnivel opcional, límite de tiempo opcional, enlaces oficiales, GPX opcional, estado de inscripción y estado de confirmación.
- Fuente y fecha de última verificación visibles en cada ficha.
- API con paginación y filtros por año, mes, ubicación, distancia, organizador y confirmación.
- Interfaz con vista de listado y calendario mensual, ficha detallada y filtros combinables.
- Exportación de un evento a .ics correctamente formateado.
- CRUD de administración protegido; visitantes pueden consultar sin iniciar sesión.
- Historial básico de cambios de fecha, estado o recorrido.
- Estados de carga, vacío y error; interfaz responsive y accesible.

Datos: crea únicamente fixtures claramente ficticios para pruebas y demostración. No presentes eventos reales como confirmados sin fuente verificable. No implementes scraping indiscriminado.

Pruebas mínimas: filtros, duplicados, fechas y zonas horarias, generación .ics, permisos de edición y cambios de estado.

Trabaja por fases: primero modelo y API, luego UI, después pruebas y documentación. Ejecuta las pruebas disponibles y resume resultados, archivos modificados y mejoras futuras.
```

## Prompt 2 — Simulador de Brevets

```text
Actúa como ingeniero de software especializado en procesamiento GPX, simulación temporal y UX de planificación ciclista.

Lee funcionalidades_ciclismo.md, especialmente «Simulador de Brevets», e inspecciona el proyecto. Implementa un MVP que permita importar un GPX, definir una estrategia de marcha y paradas, y calcular horas estimadas de paso por controles.

Requisitos:
1. Importar GPX con validación, límite de tamaño, manejo de archivos malformados y ausencia de altitud.
2. Calcular distancia acumulada, desnivel cuando sea fiable y perfil de ruta; mostrar advertencias sobre calidad de datos.
3. Configurar fecha/hora de salida con zona horaria, velocidad media en movimiento, controles por kilómetro, paradas por kilómetro y duración, y periodos de sueño.
4. Calcular horas de llegada, tiempo en movimiento, tiempo parado y margen frente a cierres de control introducidos por el usuario.
5. Permitir editar una parada o velocidad y recalcular toda la simulación inmediatamente.
6. Guardar y comparar al menos dos escenarios (por ejemplo, conservador y base).
7. Mostrar tabla de hitos y gráficos claros de distancia/tiempo y perfil altimétrico.
8. Exportar los resultados a CSV.

Reglas técnicas:
- Separa velocidad en movimiento de velocidad global.
- Utiliza cálculos deterministas y comprobables; no uses un LLM para calcular tiempos.
- Maneja cambio de día, zonas horarias y cambios de horario de verano.
- No supongas que los límites de tiempo son iguales para todas las organizaciones.
- No confundas una estimación con una garantía de llegada.

Pruebas mínimas: GPX vacío o corrupto, ruta sin elevación, controles consecutivos, paradas superpuestas, velocidad inválida, cambio de día y horario de verano, escenarios con y sin sueño.

Entrega código ejecutable, ejemplos ficticios, pruebas, documentación de fórmulas y resumen de decisiones. No implementes funciones meteorológicas ni predicciones avanzadas hasta estabilizar el MVP.
```

## Prompt 3 — Observatorio de Vías Verdes

```text
Actúa como desarrollador GIS/full-stack y analista de datos públicos sobre infraestructuras ciclistas.

Lee funcionalidades_ciclismo.md, especialmente «Observatorio de Vías Verdes», e inspecciona el repositorio. Implementa el MVP de un observatorio geográfico de vías verdes españolas, con prioridad inicial en Castilla y León y Extremadura.

Requisitos:
- Entidades de corredor y tramo con geometría geográfica, extremos, longitud, territorio y metadatos.
- Tres campos independientes: estado administrativo, estado físico observado y apertura/uso oficial.
- Estados administrativos configurables: operativo, en obras, en proyecto/tramitación, propuesto, suspendido/descartado y desconocido. No reduzcas toda la realidad a un único booleano «abierto».
- Mapa interactivo con tramos diferenciados visualmente, leyenda accesible, filtros por provincia y estado y selección de tramo.
- Ficha de tramo con descripción, responsables si constan, fecha de última revisión, fuentes enlazadas y cronología de hitos.
- CRUD de administración con trazabilidad de cambios y referencias documentales obligatorias para declarar una apertura oficial.
- Listado alternativo al mapa, responsive y utilizable con teclado.

Fuentes y fiabilidad:
- Diseña el sistema para registrar fuentes oficiales, boletines, contratos, noticias y observaciones de campo sin confundir sus niveles de evidencia.
- OpenStreetMap puede servir de base cartográfica, pero no confirma el estado administrativo.
- Usa datos de ejemplo ficticios o datos reales solo si dispones de fuente verificable y licencia compatible. No inventes estados de tramos ni fechas de obras.
- Respeta atribución cartográfica y licencias.

Pruebas mínimas: geometrías inválidas, tramos sin trazado, filtrado geográfico, transiciones de estado, fuentes ausentes, control de permisos y coherencia de la cronología.

Entrega código funcional, migraciones PostGIS, interfaz de mapa, documentación de fuentes y pruebas. Explica qué necesitaría el sistema para incorporar seguimiento automático de boletines y cambios de proyectos en una segunda fase.
```

## Prompt 4 — Integración y revisión final

```text
Actúa como responsable técnico y de calidad del proyecto. Lee funcionalidades_ciclismo.md, revisa los tres módulos ya implementados y realiza una integración completa sin añadir funcionalidades fuera del MVP.

Comprueba:
- Navegación coherente entre Calendario, Simulador y Observatorio.
- Consistencia de modelos, migraciones, APIs, validaciones, autenticación administrativa y diseño visual.
- Fuentes y fechas visibles donde correspondan; separación explícita entre información oficial, estimaciones y aportaciones comunitarias.
- Pruebas unitarias, integración y flujos de usuario de extremo a extremo.
- Accesibilidad, rendimiento básico, seguridad de subida de GPX, sanitización de contenido y gestión de errores.
- README reproducible desde una instalación limpia, con datos de demostración inequívocamente ficticios.

Corrige problemas reales detectados, ejecuta las pruebas disponibles y entrega un informe con: qué funciona, qué no funciona, riesgos conocidos, pasos de despliegue y backlog priorizado para una versión 2. No declares pruebas como superadas si no las has ejecutado.
```

## Orden recomendado de ejecución

1. Prompt 0: base técnica compartida.
2. Prompt 1: Calendario de Brevets.
3. Prompt 2: Simulador de Brevets.
4. Prompt 3: Observatorio de Vías Verdes.
5. Prompt 4: integración y revisión.

**Consejo:** ejecuta cada prompt en una rama o commit independiente, revisa los cambios y valida el resultado antes de pasar al siguiente. Los prompts son especificaciones de trabajo, no una garantía de que todos los datos externos estén disponibles.

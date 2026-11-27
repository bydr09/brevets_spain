# Plataforma cicloturista: definición de funcionalidades

## Visión general

Aplicación web orientada al cicloturismo de larga distancia y a la información sobre infraestructuras ciclistas. Se compone de tres módulos conectados, pero independientes: **Calendario de Brevets**, **Simulador de Brevets** y **Observatorio de Vías Verdes**. No pretende ser una red social ni sustituir a Strava, Komoot o Wikiloc.

**Objetivos:** centralizar información fiable, facilitar la planificación y mostrar la evolución de proyectos ciclistas. **Ámbito inicial:** España; arquitectura preparada para ampliar a otros países.

## 1. Calendario de Brevets

### Propósito

Reunir en un único calendario los brevets y eventos de randonnée relevantes, evitando consultar múltiples webs de clubes. Mostrar información verificable y permitir comparar pruebas.

### Funcionalidades

- Vista de calendario mensual, listado cronológico y mapa de salidas.
- Filtros por año, mes, provincia/comunidad autónoma, distancia (200, 300, 400, 600, 1.000, 1.200 km y otras), organizador y estado de inscripción.
- Ficha de prueba: nombre, fecha, lugar de salida, organizador, distancia, desnivel (si se conoce), límite de tiempo, enlace oficial, inscripción, GPX, homologación y observaciones.
- Distinción entre **confirmado oficialmente**, **provisional** y **sin verificar**; fecha de última comprobación y enlace a la fuente.
- Comparador de pruebas según fecha, distancia, desnivel por 100 km, disponibilidad de recorrido y logística.
- Favoritos y exportación a calendario (.ics), sin necesidad de crear cuenta para consultar.
- Detección de cambios en fechas, recorridos y apertura de inscripciones, con historial de cambios.
- Importación asistida desde páginas de organizadores, siempre con revisión antes de publicar.

### MVP

Listado + calendario, filtros, ficha de prueba, enlaces oficiales, estado de verificación, panel sencillo para incorporar o corregir eventos y exportación .ics.

### Datos y consideraciones

Priorizar organizadores y calendarios oficiales; guardar URL, fecha de consulta y procedencia de cada dato. No inferir homologaciones, fechas ni recorridos. Evitar scraping que incumpla condiciones de uso. Los eventos no confirmados deben aparecer claramente identificados.

## 2. Simulador de Brevets

### Propósito

Planificar la ejecución de un brevet a partir de un recorrido GPX: ritmo, desnivel, paradas, sueño, controles y horas de paso. Permitir experimentar con escenarios sin confundir estimaciones con certezas.

### Funcionalidades

- Importación de GPX y cálculo de distancia acumulada, perfil altimétrico y segmentos de subida/bajada; advertir sobre calidad y ausencia de elevaciones.
- Parámetros: fecha/hora de salida, velocidad media **en movimiento**, ritmo por terreno o pendiente, duración y ubicación de paradas, horas de sueño, márgenes de seguridad y tiempos máximos de control.
- Tabla de paso estimado por hitos o controles, con hora local, tiempo en movimiento, tiempo detenido y margen respecto al cierre.
- Simulación de escenarios: conservador, base y optimista; posibilidad de crear escenarios propios y compararlos.
- Edición interactiva: «duermo 3 horas en el km 620», «paro 20 minutos cada 100 km», «bajo 2 km/h de noche»; recálculo completo.
- Visualización de tramos nocturnos, amanecer/atardecer y puntos de abastecimiento si existen datos fiables.
- Alertas por márgenes ajustados, controles fuera de plazo, paradas incompatibles y supuestos poco realistas.
- Exportación del plan a PDF/CSV y guardado de escenarios.

### MVP

Carga de GPX, configuración de salida y velocidad, paradas editables, controles manuales, cálculo de tiempos de paso, tabla y gráfico de distancia frente a tiempo, comparación de dos escenarios.

### Modelo básico

Para cada segmento: `tiempo_movimiento = distancia_segmento / velocidad_estimada_segmento`. A la hora acumulada se suman las paradas programadas antes del hito. Separar **velocidad en movimiento** de **velocidad total**, incluir zona horaria y cambio de horario de verano, y redondear únicamente al presentar resultados. Las reglas de homologación y tiempos de control se configurarán según normativa aplicable, no se asumirán universales.

### Limitaciones

La velocidad real depende de fatiga, viento, tráfico, estado del firme, temperatura y otros factores. El simulador no garantiza cumplir un brevet ni sustituye el reglamento o el libro de ruta oficial.

## 3. Observatorio de Vías Verdes

### Propósito

Mantener un inventario geográfico y documental de vías verdes españolas y sus ampliaciones, con especial atención a tramos nuevos, obras, proyectos y discontinuidades. Permitir distinguir qué está oficialmente abierto de lo que se puede recorrer de hecho.

### Funcionalidades

- Mapa por tramos con estado: **operativo oficial**, **en obras**, **en proyecto/tramitación**, **propuesto**, **suspendido/descartado** y **estado desconocido**.
- Ficha por corredor y por tramo: extremos, longitud, trazado disponible, tipo de firme, continuidad, administración responsable, accesos y documentación.
- Cronología de hitos: anuncio, estudio, financiación, licitación, adjudicación, inicio de obra, recepción, apertura y mantenimiento; cada hito con fuente y fecha.
- Separar tres dimensiones: **estado administrativo**, **estado físico observado** y **apertura/uso oficial**. Por ejemplo, un tramo puede ser transitable en la práctica y no estar inaugurado.
- Comparador temporal del mapa para ver qué tramos cambiaron de estado en los últimos meses.
- Seguimiento de obras y proyectos, con avisos de novedades y enlaces a boletines, contratos y noticias oficiales.
- Reportes comunitarios de incidencias (cortes, señalización, firme) con fecha, evidencias y estado de revisión; no convertir testimonios en confirmaciones oficiales.
- Exportación de fichas y enlaces a GPX oficiales cuando estén disponibles y autorizados.

### MVP

Mapa y listado de tramos, filtros por provincia y estado, ficha con fuentes, cronología básica, fecha de última revisión y panel de edición. Comenzar con un conjunto pequeño y verificado de corredores de Castilla y León y Extremadura antes de escalar a toda España.

### Datos y consideraciones

Fuentes: Fundación de los Ferrocarriles Españoles / Vías Verdes, administraciones, boletines, contratación pública y documentación de proyectos; OpenStreetMap como apoyo cartográfico, no como prueba del estado administrativo. Respetar atribución y licencias. Nunca mostrar como abierto oficialmente un tramo solo porque aparezca dibujado o alguien lo haya recorrido.

## 4. Arquitectura sugerida

- **Frontend:** React + TypeScript, con calendario y mapa (MapLibre GL JS o Leaflet).
- **Backend:** Python + FastAPI, validación con Pydantic y tareas de actualización programadas.
- **Base de datos:** PostgreSQL + PostGIS para tramos y recorridos; migraciones versionadas.
- **GPX:** procesamiento con bibliotecas de Python; preservar el archivo original y registrar errores de lectura.
- **Fuentes:** modelo de procedencia común (`source_url`, `source_type`, `checked_at`, `published_at`, `confidence/status`).
- **Operación:** contenedores Docker, pruebas automatizadas, logs y copia de seguridad.

### Entidades mínimas

- `Organizer`, `BrevetEvent`, `EventSource`, `EventChange`.
- `Route`, `RoutePoint`, `SimulationScenario`, `Stop`, `Control`, `SimulationResult`.
- `Greenway`, `GreenwaySegment`, `ProjectMilestone`, `EvidenceSource`, `FieldReport`.

## 5. Hoja de ruta

1. **Base común:** repositorio, API, base de datos, autenticación de administradores, diseño de fichas y modelo de fuentes.
2. **Calendario MVP:** ingestión manual verificable, filtros, fichas y .ics.
3. **Simulador MVP:** GPX, tiempos, controles, paradas y escenarios.
4. **Observatorio MVP:** mapa, tramos, estados multidimensionales y cronología.
5. **Evolución:** automatizar comprobaciones de fuentes, notificaciones, enriquecimiento cartográfico y funciones avanzadas.

## 6. Criterios transversales de calidad

- No inventar eventos, recorridos, desniveles ni estados de obras.
- Mostrar siempre fuentes, fecha de actualización y grado de confirmación.
- Diferenciar datos oficiales, estimaciones algorítmicas y aportaciones comunitarias.
- Priorizar accesibilidad móvil, rendimiento del mapa, seguridad de archivos GPX y privacidad.
- Acompañar cada módulo de pruebas unitarias, de integración y casos límite documentados.

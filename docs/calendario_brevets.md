# Calendario de Brevets España 2027

## Propósito y alcance

Este repositorio publica un calendario informativo de los Brevets de Randonneurs
Mondiaux (BRM) con salida en España durante el año civil 2027. El objetivo es reunir
en una web estática y sencilla la información del calendario oficial, facilitar su
consulta por fecha, club, distancia y territorio, e indicar siempre la procedencia
de los datos.

El proyecto es independiente. No representa al Audax Club Parisien (ACP), a los
clubes organizadores ni a ninguna federación. La información práctica y cualquier
cambio de última hora deben confirmarse con el organizador correspondiente.

El alcance se limita al calendario. No incluye mapas, cuentas de usuario, favoritos,
inscripciones, seguimiento de participantes ni scraping automático.

## Estado actual

El dataset contiene **159 brevets**, organizados por **28 clubes**, entre el 9 de
enero y el 30 de octubre de 2027. Todas las pruebas tienen provincia y comunidad
autónoma asignadas.

Distribución por distancia:

| Distancia | Pruebas |
| ---: | ---: |
| 200 km | 62 |
| 300 km | 34 |
| 400 km | 24 |
| 600 km | 28 |
| 1.000 km | 11 |

También constan 31 responsables distintos, 28 correos de contacto de club, 31
registros con desnivel, 16 pruebas con hora de salida y 7 brevets de 600 km marcados
en el documento oficial con más de 8.000 m de desnivel acumulado.

## Fuente y trazabilidad

La fuente primaria es
`sources/calendario_brevets_2027_oficial.pdf`, incorporada y comprobada inicialmente
el 5 de noviembre de 2026. Su SHA-256 es:

`DAF25294CCC3C475DBE7980999C123A567EC862D2C011DD0016007484934BF05`

El PDF contiene dos registros de noviembre de 2026 al principio del documento; no
se incluyen porque quedan fuera del año civil 2027. Cada evento importado conserva:

- documento, página y fecha de comprobación de la fuente;
- estado de verificación `official_calendar`;
- código ACP, fecha, distancia y localidad de salida;
- provincia y comunidad autónoma;
- club, responsable y correo de contacto cuando constan;
- desnivel, indicador de 600 km con más de 8.000 m y enlaces disponibles;
- nombre y hora de salida cuando existe enriquecimiento respaldado por una fuente.

Los datos de contacto se publican para facilitar la comunicación con los clubes y
proceden del calendario oficial. No deben reutilizarse para publicidad, envíos
masivos ni finalidades ajenas a la organización de los brevets.

Como fuente complementaria se utilizó el calendario de Randonneurs Andalucía,
consultado inicialmente el 5 de noviembre de 2026:

- <https://randonneursandalucia.es/brevets2027/>

Esta fuente aportó nombres y horas de salida para 16 pruebas. No sustituye al
calendario oficial como referencia de homologación.

## Incidencias conocidas de la fuente

- El BRM 400 de Randonneurs Andalucía con salida en Benacazón aparece el 6 de marzo
  de 2027 en la tabla principal. Una repetición parcial posterior muestra por error
  `03/06/2027`; se conserva el 6 de marzo, coincidente con la publicación del club.
- El brevet de Penya Cicloturista Cambrils del 19 de junio figura con 600 km, 8.892 m
  de desnivel y una `X` en la categoría de 600 km con más de 8.000 m. El modelo
  conserva por separado distancia, desnivel e indicador especial.
- El correo `info@mallorcaultracycling` aparece sin dominio completo en el documento.
  Se normaliza como `info@mallorcaultracycling.com`.

## Modelo de datos

`data/brevets_2027.json` es la única copia canónica versionada. Contiene objetos JSON
con los siguientes grupos de campos:

- identidad: `id`, `name`, `acp_code`;
- fecha y lugar: `date`, `start_time`, `timezone`, `start_locality`, `province`,
  `autonomous_community`;
- recorrido: `distance_km`, `distance_label`, `elevation_m`,
  `is_600_plus_8000m`;
- organización: `organizer`, `ride_organizer`, `organizer_email`, `organizer_url`,
  `event_url`;
- procedencia: `verification_status`, `source_type`, `source_document`, `source_page`,
  `source_checked_at`.

Los valores desconocidos se guardan como `null`; no se inventan horarios, desniveles,
enlaces ni datos de homologación.

## Importación y publicación

El importador `scripts/import_official_calendar.py` lee las tablas y anotaciones del
PDF, normaliza provincias, comunidades, correos y URL, conserva enriquecimientos
existentes y ordena las pruebas cronológicamente. Falla si no obtiene exactamente
159 eventos o si genera identificadores duplicados.

La aplicación consume `web/data/brevets_2027.json`, pero ese archivo es generado y
no se versiona:

- `web/serve-local.ps1` copia el dataset canónico antes de iniciar el servidor local;
- el workflow de GitHub Pages hace la misma copia antes de construir el artefacto.

De este modo no existen dos fuentes de verdad ni puede publicarse accidentalmente
una copia antigua del calendario.

## Interfaz publicada

La web ofrece cuatro vistas:

- **Inicio:** accesos compactos a los primeros brevets por fecha y a los clubes por
  orden alfabético.
- **Listado:** tabla cronológica con filtros por texto, distancia, mes, comunidad y
  club.
- **Calendario:** distribución mensual de las pruebas con código de color por
  distancia.
- **Clubes:** directorio con localidades, distancias, responsables, correos y próxima
  prueba de cada organizador.

Incluye además una traducción informativa del reglamento BRM y una política de
privacidad. La web no tiene backend, cuentas, cookies propias, analítica ni formularios
de recogida de datos. Solo guarda localmente la última vista seleccionada.

## Seguridad y mantenimiento

- El contenido procedente del JSON se inserta como texto, no como HTML.
- Las URL externas solo se aceptan con protocolo HTTP o HTTPS y sin credenciales.
- Las páginas aplican Content Security Policy y no envían cabecera `Referer` a sitios
  enlazados.
- El despliegue usa GitHub Actions fijadas por SHA y permisos mínimos.
- Dependabot revisa mensualmente las acciones y la dependencia Python.
- El importador está destinado al PDF oficial incluido. Un PDF desconocido debe
  procesarse únicamente en un entorno aislado.

## Limitaciones

- Es una fotografía del calendario consultado; cancelaciones o cambios posteriores
  requieren actualizar la fuente y regenerar el dataset.
- Los enlaces externos dependen de terceros y pueden cambiar o dejar de funcionar.
- La presencia de una prueba no sustituye el reglamento, la inscripción ni las
  instrucciones particulares del club.
- La web está dedicada a la temporada 2027; una temporada futura requerirá revisar
  el importador, los textos y las validaciones de cantidad y fechas.

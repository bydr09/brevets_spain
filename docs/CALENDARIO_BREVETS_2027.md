# Calendario de brevets de España 2027

## Objetivo

Publicar un calendario consultable de brevets con salida en España durante el año
civil 2027. Cada evento debe indicar de dónde procede la información y qué grado
de verificación tiene.

## Primer alcance

La primera versión incluirá:

- listado cronológico;
- filtros por mes, comunidad autónoma, provincia, distancia y organizador;
- ficha básica del evento;
- enlace a la fuente y fecha de última comprobación;
- exportación individual a calendario (`.ics`).

Quedan fuera de esta primera versión el mapa, las cuentas de usuario, los
favoritos, el scraping automático y los otros módulos descritos en
`funcionalidades_ciclismo.md`.

## Criterio de inclusión

Un evento puede incorporarse cuando exista al menos una fuente identificable.
La interfaz deberá distinguir estos estados:

- `organizer_published`: publicado por el organizador, pendiente de comprobar
  en el calendario oficial de homologaciones;
- `official_calendar`: presente en el calendario oficial aplicable;
- `provisional`: anunciado expresamente como provisional;
- `unverified`: localizado en una fuente secundaria y pendiente de contraste;
- `cancelled`: cancelado por una fuente autorizada.

`organizer_published` no equivale por sí solo a homologación ACP.

## Datos mínimos de cada evento

- Identificador interno estable.
- Nombre y distancia nominal.
- Fecha, hora local y zona horaria.
- Localidad, provincia y comunidad autónoma de salida.
- Organizador.
- Estado de verificación.
- URL de la fuente y fecha de última comprobación.

Los datos opcionales —recorrido, desnivel, inscripción, hora límite y código
ACP— no se mostrarán como conocidos mientras no estén respaldados por una
fuente.

## Fuente oficial

El conjunto nacional procede de `sources/calendario_brevets_2027_oficial.pdf`,
aportado como calendario oficial el 2026-11-05. Contiene 159 eventos del año
civil 2027 correspondientes a 28 clubes. Los dos registros de noviembre de
2026 que aparecen al principio del documento no forman parte de este alcance.

Los eventos del PDF tienen el estado `official_calendar`. El proceso de
importación conserva el código ACP, la distancia, la fecha, la localidad de
salida, el desnivel cuando consta y el indicador específico para pruebas de
600 km con más de 8.000 m de desnivel.

Por minimización de datos, no se copian al calendario público los nombres,
correos electrónicos ni otros datos de contacto de los responsables que
figuran en el documento fuente.

La copia preservada en el repositorio tiene SHA-256
`DAF25294CCC3C475DBE7980999C123A567EC862D2C011DD0016007484934BF05`.

### Incidencias detectadas en el documento

- La tabla maestra sitúa el BRM 400 de Randonneurs Andalucía con salida en
  Benacazón el 6 de marzo de 2027. Una repetición parcial posterior muestra por
  error `03/06/2027`. Se conserva el 6 de marzo, que también coincide con la
  publicación del organizador.
- El brevet de Penya Cicloturista Cambrils del 19 de junio figura como 600 km,
  8.892 m de desnivel y marcado con `X` en la columna de 600 km con más de
  8.000 m. El modelo conserva la distancia y el indicador por separado.

Como fuente de detalle complementaria se utiliza el calendario publicado por
Randonneurs Andalucía:

- https://randonneursandalucia.es/brevets2027/
- Última comprobación inicial: 2026-11-05.

Esta fuente complementaria aporta nombres y horas de salida para 16 eventos de
Andalucía, pero no sustituye los datos de homologación del calendario oficial.

## Próximo hito

Completar provincia y comunidad autónoma para los eventos que todavía solo
disponen de localidad de salida. Después, construir una página estática que lea
`data/brevets_2027.json`, muestre el listado cronológico y permita filtrar por
mes, territorio, distancia y organizador.

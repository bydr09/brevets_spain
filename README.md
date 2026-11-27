# Brevets España 2027

Calendario independiente y consultable de los Brevets de Randonneurs Mondiaux
(BRM) con salida en España durante 2027.

**Web publicada:** <https://bydr09.github.io/brevets_spain/>

El proyecto reúne en una web estática los datos del calendario oficial, con
trazabilidad de la fuente y acceso por fecha, mes, distancia, territorio y club. No
tiene backend, cuentas, publicidad, analítica ni cookies propias.

## Estado

- **159 brevets** entre el 9 de enero y el 30 de octubre de 2027.
- **28 clubes**, con responsables y correos de contacto cuando constan.
- **20 provincias** y **11 comunidades autónomas**, sin ubicaciones pendientes.
- Distancias de 200, 300, 400, 600 y 1.000 km.
- Fuente principal preservada en el repositorio y datos marcados como calendario
  oficial.

## Funcionalidades

- Inicio compacto con accesos por fecha y por club.
- Listado cronológico con filtros por texto, distancia, mes, comunidad y organizador.
- Calendario mensual con identificación visual de distancias.
- Directorio de clubes con localidades, distancias, responsable, correo y próxima
  prueba.
- Enlaces a información del club o del evento cuando están disponibles.
- Reglamento BRM explicado en español y política de privacidad.
- Diseño adaptable a escritorio y móvil.

El proyecto se limita deliberadamente al calendario. No incluye mapa, cuentas,
favoritos, inscripciones, seguimiento de participantes ni scraping automático.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `web/` | Aplicación estática publicada: HTML, CSS y JavaScript |
| `data/brevets_2027.json` | Único dataset canónico versionado |
| `scripts/import_official_calendar.py` | Importador del PDF oficial al JSON |
| `sources/calendario_brevets_2027_oficial.pdf` | Fuente primaria preservada |
| `docs/calendario_brevets.md` | Alcance, cifras, modelo, procedencia e incidencias |
| `.github/workflows/deploy-pages.yml` | Despliegue automático en GitHub Pages |
| `AGENTS.md` y `CLAUDE.md` | Instrucciones de mantenimiento para asistentes |

La aplicación solicita `web/data/brevets_2027.json`, pero esa ruta se genera a
partir del dataset canónico. La copia publicada está ignorada por Git: no debe
editarse ni confirmarse.

## Ejecutar en local

Requiere Python 3 para levantar un servidor HTTP sencillo:

```powershell
.\web\serve-local.ps1
```

Después, abre <http://127.0.0.1:5173>.

El script copia automáticamente `data/brevets_2027.json` a la ruta que consume la
web antes de iniciar el servidor. No abras `web/index.html` directamente mediante
`file://`, porque el navegador puede bloquear la carga del JSON.

Se puede utilizar otro servidor estático, siempre que antes se genere la copia:

```powershell
New-Item -ItemType Directory -Force web\data | Out-Null
Copy-Item data\brevets_2027.json web\data\brevets_2027.json -Force
python -m http.server 5173 --bind 127.0.0.1 --directory web
```

## Regenerar el calendario

La dependencia Python solo es necesaria para leer el PDF oficial:

```powershell
python -m pip install -r requirements.txt
python scripts\import_official_calendar.py sources\calendario_brevets_2027_oficial.pdf data\brevets_2027.json
```

Ejecuta el comando desde la raíz. El importador:

- procesa las tablas y enlaces del documento;
- normaliza correos, URL, provincias y comunidades;
- conserva datos enriquecidos respaldados por fuentes;
- ordena los eventos cronológicamente;
- exige exactamente 159 pruebas de 2027;
- falla si produce identificadores duplicados.

Está diseñado para el PDF incluido en `sources/`. No proceses PDF de procedencia
desconocida fuera de un entorno aislado.

## Datos y procedencia

Cada evento conserva el documento, la página, la fecha de comprobación, el tipo de
fuente y el estado de verificación. Los campos desconocidos se mantienen como `null`:
no se inventan fechas, horarios, desniveles, enlaces ni homologaciones.

La fuente principal es
`sources/calendario_brevets_2027_oficial.pdf`, con SHA-256:

```text
DAF25294CCC3C475DBE7980999C123A567EC862D2C011DD0016007484934BF05
```

La metodología completa, las estadísticas y las incidencias conocidas están en
[`docs/calendario_brevets.md`](docs/calendario_brevets.md).

## Validación

Comprobaciones mínimas antes de confirmar cambios:

```powershell
git diff --check
node --check web\app.js
python -m py_compile scripts\import_official_calendar.py
```

También deben verificarse el recuento de 159 eventos, la unicidad de los
identificadores, la presencia de provincia y comunidad, la igualdad entre el JSON
canónico y la copia generada y la carga de la web sin errores de consola.

## Seguridad y privacidad

- Content Security Policy en las tres páginas HTML.
- Referencias externas sin envío de `Referer`.
- DOM construido con nodos de texto, sin insertar HTML procedente del dataset.
- URL externas restringidas a HTTP(S) y sin credenciales incrustadas.
- GitHub Actions fijadas por SHA y con permisos mínimos.
- Dependabot mensual para Actions y la dependencia Python.
- Sin secretos, formularios, cuentas, analítica ni almacenamiento de datos de
  visitantes; únicamente se recuerda en el navegador la última vista elegida.

Los nombres y correos publicados corresponden a contactos organizativos incluidos en
el calendario oficial. No deben reutilizarse para publicidad o envíos masivos.

## Despliegue

Un `push` a `main` activa `.github/workflows/deploy-pages.yml`. El workflow:

1. descarga el repositorio sin conservar credenciales;
2. configura GitHub Pages;
3. genera `web/data/brevets_2027.json` desde el dataset canónico;
4. sube el artefacto estático;
5. publica la web en GitHub Pages.

No se necesita compilación, Node.js en producción, base de datos ni servidor propio.

## Limitaciones

- El calendario refleja las fuentes comprobadas; los cambios posteriores requieren
  actualizar los datos.
- Los enlaces externos dependen de los clubes y pueden cambiar.
- La web no sustituye la inscripción, el reglamento ni las instrucciones particulares
  del organizador.
- Para una temporada futura habrá que revisar el PDF, el importador, las cifras y los
  textos específicos de 2027.

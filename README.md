# Brevets España 2027

Calendario consultable de brevets (randonnée) con salida en España durante el año
civil 2027. Web estática sin backend ni dependencias de terceros, alimentada por un
JSON que se genera desde el PDF oficial del calendario.

Estado: **159 eventos** importados del calendario oficial, con procedencia y grado de
verificación en cada registro.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `web/` | Web estática publicable (HTML, CSS, JS) y la copia de datos que sirve |
| `data/brevets_2027.json` | Dataset canónico de eventos |
| `scripts/import_official_calendar.py` | Importador PDF oficial → JSON |
| `sources/` | PDF oficial del calendario 2027 (fuente primaria) |
| `docs/` | Alcance del módulo y especificación de la plataforma cicloturista |
| `tmp/` | Material de trabajo regenerable, ignorado por git |

## Ver la web en local

```powershell
cd web
.\serve-local.ps1     # http://127.0.0.1:5173
```

No abras `web/index.html` con doble clic: sobre `file://` el navegador bloquea la
carga del JSON local.

## Regenerar los datos

Requiere Python 3. Ejecutar **desde la raíz del proyecto**, porque el
script resuelve rutas relativas al directorio actual:

```powershell
python -m pip install -r requirements.txt
python scripts\import_official_calendar.py sources\calendario_brevets_2027_oficial.pdf data\brevets_2027.json
copy data\brevets_2027.json web\data\brevets_2027.json
```

El importador está pensado para el PDF oficial incluido en `sources/`. No ejecutes
archivos PDF de procedencia desconocida fuera de un entorno aislado.

El importador falla a propósito si no obtiene exactamente 159 eventos de 2027 o si
genera identificadores duplicados. Conserva los campos enriquecidos del JSON previo
mediante `--existing` (por defecto `data/brevets_2027.json`).

## Datos y procedencia

- Fuente primaria: el PDF de `sources/`. Cada evento registra `source_document`,
  `source_page`, `source_checked_at` y `verification_status`.
- `data/brevets_2027.json` es el origen de verdad. `web/data/brevets_2027.json` es la
  copia que consume `web/app.js`. Ahora son idénticas; tras regenerar hay que copiarla
  a mano.

## Documentación

- `docs/CALENDARIO_BREVETS_2027.md` — objetivo, alcance y criterios de inclusión.
- `docs/funcionalidades_ciclismo.md` — especificación de la plataforma cicloturista
  completa (Calendario, Simulador y Observatorio). **Compartida** con el proyecto
  `vias_verdes`.
- `docs/prompts_funcionalidades_ciclismo.md` — prompts de desarrollo por módulo.
  **Compartida**.

## Pendiente

- Las dos copias de `brevets_2027.json` no se sincronizan automáticamente.
- El **Simulador de Brevets** descrito en `docs/funcionalidades_ciclismo.md` no está
  implementado en este repositorio.

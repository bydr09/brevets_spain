# Instrucciones de trabajo

## Proyecto y alcance

Este repositorio mantiene **Brevets España 2027**, una web estática e independiente
para consultar el calendario BRM español. No forma parte de una plataforma conjunta
con Vías Verdes o Cicloturismo.

Mantén el producto centrado en calendario, listado y directorio de clubes. No añadas
mapas, cuentas, favoritos, backend, analítica, scraping o formularios sin una
petición explícita.

## Arquitectura

- `web/`: HTML, CSS y JavaScript que se publica en GitHub Pages.
- `data/brevets_2027.json`: única fuente de verdad versionada para los eventos.
- `web/data/brevets_2027.json`: copia generada; está ignorada y nunca debe editarse
  ni confirmarse.
- `scripts/import_official_calendar.py`: importador del PDF oficial al JSON canónico.
- `sources/calendario_brevets_2027_oficial.pdf`: fuente primaria preservada.
- `docs/calendario_brevets.md`: documentación funcional, de datos y procedencia.
- `.github/workflows/deploy-pages.yml`: despliegue automático de `main`.

La web no tiene proceso de compilación ni dependencias JavaScript. `pdfplumber`,
declarado en `requirements.txt`, solo se usa para regenerar los datos.

## Reglas para datos y contenido

- No inventes eventos, horarios, desniveles, homologaciones, responsables o enlaces.
- Conserva la fuente, página, fecha de comprobación y estado de verificación.
- Mantén identificadores únicos y orden cronológico.
- Inserta contenido del dataset mediante `textContent` o nodos de texto; no uses
  `innerHTML` con datos.
- Las URL importadas o mostradas deben limitarse a HTTP(S), sin credenciales.
- No edites el PDF fuente ni guardes secretos, tokens o credenciales en el repo.
- Si cambia el dataset, actualiza también `docs/calendario_brevets.md` y las cifras
  visibles de la interfaz cuando corresponda.

## Trabajo local

Desde la raíz, instala la dependencia del importador cuando sea necesaria:

```powershell
python -m pip install -r requirements.txt
```

Para servir la web:

```powershell
.\web\serve-local.ps1
```

El script sincroniza automáticamente el JSON canónico y sirve únicamente en
`127.0.0.1:5173`.

Para regenerar el calendario:

```powershell
python scripts\import_official_calendar.py sources\calendario_brevets_2027_oficial.pdf data\brevets_2027.json
```

## Validación mínima

Antes de confirmar cambios relevantes:

```powershell
git diff --check
node --check web\app.js
python -m py_compile scripts\import_official_calendar.py
```

Comprueba además que:

- el JSON es válido, contiene 159 eventos y no tiene identificadores duplicados;
- todas las pruebas tienen provincia y comunidad autónoma;
- el servidor local genera `web/data/brevets_2027.json` idéntico al canónico;
- la página carga las 159 pruebas y los 28 clubes sin errores de consola;
- las tres páginas conservan su Content Security Policy;
- el repositorio queda sin archivos temporales ni cambios ajenos a la tarea.

## Git y despliegue

- Trabaja en local y no hagas `push` ni despliegues salvo petición explícita.
- No reescribas historial, fuerces actualizaciones ni descartes cambios del usuario.
- Usa commits breves y descriptivos.
- Un `push` a `main` publica automáticamente GitHub Pages; después de subir, verifica
  que el workflow termine correctamente.
- Mantén las GitHub Actions fijadas a SHA completos y deja que Dependabot proponga
  actualizaciones revisables.

## Seguridad y privacidad

Preserva la CSP, `rel="noopener noreferrer"` en enlaces externos abiertos en otra
pestaña, la política `no-referrer` y la construcción segura del DOM. La web no debe
incorporar cookies, seguimiento ni servicios externos sin actualizar primero el
análisis de privacidad y solicitar autorización.

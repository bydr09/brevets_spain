# Web estática — Brevets España 2027

Esta carpeta contiene los archivos que publica GitHub Pages. La aplicación es HTML,
CSS y JavaScript sin compilación, backend, analítica ni dependencias de ejecución.

## Verla en local

Desde PowerShell:

```powershell
.\serve-local.ps1
```

Después, abre `http://127.0.0.1:5173`.

El script copia automáticamente el dataset canónico de
`../data/brevets_2027.json` a `data/` antes de iniciar el servidor. La copia generada
está ignorada por Git y no debe editarse. No abras `index.html` directamente porque
el navegador puede bloquear la carga del JSON local.

## Publicación

Cada `push` a `main` ejecuta `.github/workflows/deploy-pages.yml`. El workflow copia
el dataset canónico a esta carpeta y despliega el artefacto en:

<https://bydr09.github.io/brevets_spain/>

No hagas una segunda copia manual del JSON ni la añadas al repositorio.

# Prototipo local — Brevets España 2027

Esta carpeta contiene una web estática sin dependencias, servicios externos ni
configuración de alojamiento.

## Verla en local

Desde PowerShell:

```powershell
.\serve-local.ps1
```

Después, abre `http://127.0.0.1:5173`.

También puedes utilizar cualquier servidor de archivos estáticos. No abras
`index.html` directamente porque el navegador puede bloquear la carga del JSON
local.

## Publicarla más adelante en GitHub Pages

El contenido de esta carpeta puede copiarse directamente a la raíz de la rama
o carpeta que se configure como origen de GitHub Pages. No requiere proceso de
compilación.

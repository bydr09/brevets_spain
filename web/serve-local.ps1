param(
    [int]$Port = 5173
)

$ErrorActionPreference = "Stop"
$webRoot = $PSScriptRoot
$projectRoot = Split-Path -Parent $webRoot
$canonicalData = Join-Path $projectRoot "data\brevets_2027.json"
$publishedDataDirectory = Join-Path $webRoot "data"
$publishedData = Join-Path $publishedDataDirectory "brevets_2027.json"

if (-not (Test-Path -LiteralPath $canonicalData -PathType Leaf)) {
    throw "No se encuentra el dataset canónico: $canonicalData"
}

New-Item -ItemType Directory -Path $publishedDataDirectory -Force | Out-Null
Copy-Item -LiteralPath $canonicalData -Destination $publishedData -Force

Write-Host "Brevets España 2027"
Write-Host "Abre http://127.0.0.1:$Port en tu navegador."
Write-Host "Pulsa Ctrl+C para detener el servidor."

python -m http.server $Port --bind 127.0.0.1 --directory $webRoot

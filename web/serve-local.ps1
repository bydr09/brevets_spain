param(
    [int]$Port = 5173
)

$webRoot = $PSScriptRoot
Write-Host "Brevets España 2027"
Write-Host "Abre http://localhost:$Port en tu navegador."
Write-Host "Pulsa Ctrl+C para detener el servidor."

python -m http.server $Port --directory $webRoot

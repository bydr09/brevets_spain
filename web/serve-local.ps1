param(
    [int]$Port = 5173
)

$webRoot = $PSScriptRoot
Write-Host "Brevets España 2027"
Write-Host "Abre http://127.0.0.1:$Port en tu navegador."
Write-Host "Pulsa Ctrl+C para detener el servidor."

python -m http.server $Port --bind 127.0.0.1 --directory $webRoot

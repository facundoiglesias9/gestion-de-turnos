Add-Type -AssemblyName System.Drawing
$files = @('grafico_funciones_1024x500.png', 'captura_login.png', 'icono_app_512.png')
$desktop = "C:\Users\Facundo\Desktop"

foreach ($f in $files) {
    $path = Join-Path $desktop $f
    if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile($path)
        Write-Host "$f : $($img.Width)x$($img.Height)"
        $img.Dispose()
    }
    else {
        Write-Host "$f not found"
    }
}

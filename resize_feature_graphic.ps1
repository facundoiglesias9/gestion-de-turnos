Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\public\feature-graphic.png"
$destPath = "C:\Users\Facundo\Desktop\grafico_funciones_1024x500.png"

if (Test-Path $sourcePath) {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $res = New-Object System.Drawing.Bitmap(1024, 500)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, 1024, 500)
    $res.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $img.Dispose()
    $res.Dispose()
    $g.Dispose()
    Write-Host "Resized feature graphic to 1024x500 at $destPath"
}
else {
    Write-Error "Source file not found: $sourcePath"
}

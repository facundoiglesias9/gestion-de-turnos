Add-Type -AssemblyName System.Drawing

$destDir = "C:\Users\Facundo\Desktop\ENTREGABLES_GOOGLE_PLAY"
if (!(Test-Path $destDir)) { mkdir $destDir }

# 1. Resize Icon to 512x512
$iconSource = "C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\public\icon-512.png"
$iconDest = Join-Path $destDir "icono_512x512.png"
if (Test-Path $iconSource) {
    $img = [System.Drawing.Image]::FromFile($iconSource)
    $res = New-Object System.Drawing.Bitmap(512, 512)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, 512, 512)
    $res.Save($iconDest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose(); $res.Dispose(); $g.Dispose()
    Write-Host "Created Icon: $iconDest"
}

# 2. Resize Feature Graphic to 1024x500
$featSource = "C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\public\feature-graphic.png"
$featDest = Join-Path $destDir "grafico_funciones_1024x500.png"
if (Test-Path $featSource) {
    $img = [System.Drawing.Image]::FromFile($featSource)
    $res = New-Object System.Drawing.Bitmap(1024, 500)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, 1024, 500)
    $res.Save($featDest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose(); $res.Dispose(); $g.Dispose()
    Write-Host "Created Feature Graphic: $featDest"
}

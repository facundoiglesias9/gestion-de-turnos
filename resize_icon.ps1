Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\public\icon-512.png"
$destPath = "C:\Users\Facundo\Desktop\icono_app_512.png"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$res = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($res)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 512, 512)
$res.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$res.Dispose()
$g.Dispose()

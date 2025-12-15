
Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\Facundo\Desktop\Gestion de turnos\icon.png"
$baseDir = "c:\Users\Facundo\Desktop\Gestion de turnos\android\app\src\main\res"

$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($key in $sizes.Keys) {
    $size = $sizes[$key]
    $targetDir = Join-Path $baseDir $key
    
    # Square
    $destPath = Join-Path $targetDir "ic_launcher.png"
    $res = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $res.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $res.Dispose()

    # Round (using same for now)
    $destPathRound = Join-Path $targetDir "ic_launcher_round.png"
    $resRound = New-Object System.Drawing.Bitmap($size, $size)
    $gRound = [System.Drawing.Graphics]::FromImage($resRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.DrawImage($img, 0, 0, $size, $size)
    $resRound.Save($destPathRound, [System.Drawing.Imaging.ImageFormat]::Png)
    $gRound.Dispose()
    $resRound.Dispose()
    
    Write-Host "Updated $key ($size x $size)"
}

$img.Dispose()

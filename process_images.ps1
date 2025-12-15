Add-Type -AssemblyName System.Drawing

$destDir = "C:\Users\Facundo\Desktop\ENTREGABLES_GOOGLE_PLAY"
if (!(Test-Path $destDir)) { mkdir $destDir }

$rawFiles = @('raw_shot_1.png', 'raw_shot_2.png', 'raw_shot_3.png')

foreach ($file in $rawFiles) {
    if (Test-Path $file) {
        $sourceImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $file))
        
        # 1. Save the original vertical screenshot (for "Phone Screenshots" section)
        $origDest = Join-Path $destDir "captura_celular_$file"
        $sourceImg.Save($origDest, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved vertical screenshot: $origDest"

        # 2. Create the 1024x500 version (for "Feature Graphic" section or if user insists)
        # We will place the vertical screenshot in the center of a 1024x500 canvas
        $featBmp = New-Object System.Drawing.Bitmap(1024, 500)
        $g = [System.Drawing.Graphics]::FromImage($featBmp)
        $g.Clear([System.Drawing.Color]::FromArgb(20, 20, 30)) # Dark background
        
        # Calculate position to center the vertical image
        # Scale down the vertical image to fit height 500 (with some padding)
        # Target height = 460 (20px padding)
        $scaleHeight = 460
        $scaleWidth = [int]($sourceImg.Width * ($scaleHeight / $sourceImg.Height))
        
        $x = (1024 - $scaleWidth) / 2
        $y = (500 - $scaleHeight) / 2
        
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($sourceImg, [int]$x, [int]$y, [int]$scaleWidth, [int]$scaleHeight)
        
        $featDest = Join-Path $destDir "captura_formato_grafico_$file"
        $featBmp.Save($featDest, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved 1024x500 version: $featDest"
        
        $g.Dispose()
        $featBmp.Dispose()
        $sourceImg.Dispose()
    }
}

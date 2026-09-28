# Builds index-3d-play.html (3D, scenes auto-play, no scroll story) from index-3d.html.
# Edit index-3d.html only, then run:  powershell -File build-play.ps1
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $dir 'index-3d.html')
$out = $src.Replace('<body data-mode="scroll">', '<body data-mode="play">')
if ($out -eq $src) { throw 'body data-mode marker not found' }
[IO.File]::WriteAllText((Join-Path $dir 'index-3d-play.html'), $out, (New-Object Text.UTF8Encoding $false))
'index-3d-play.html built'

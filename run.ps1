# Script start the programm and rebuilds on press r
# written by Shadowdara
# licensed under MIT 2025
# https://github.com/ShadowDara/dotfiles

# Pfad zur Server-EXE
$exePath = ".\findergen.exe"

# Funktion: Server starten
function Start-Server {
    Write-Host "`n[INFO] Baue Finderngen Server..."
    go build -o $exePath ./cmd/findergen
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FEHLER] Build fehlgeschlagen." -ForegroundColor Red
        return $null
    }

    Write-Host "[INFO] Starte Server..."
    $process = Start-Process -FilePath $exePath -PassThru
    Write-Host "[INFO] Server läuft mit PID $($process.Id)"
    return $process
}

# Funktion: Server stoppen
function Stop-Server($proc) {
    if ($proc -and !$proc.HasExited) {
        Write-Host "[INFO] Beende Server mit PID $($proc.Id)..."
        $proc.Kill()
        $proc.WaitForExit()
    }
}

# Haupt-Loop
$serverProcess = Start-Server
if (-not $serverProcess) { exit }

while ($true) {
    Write-Host "`nDruecke [r] zum Neustarten, [q] zum Beenden:"
    $key = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown").Character

    if ($key -eq 'r') {
        Stop-Server $serverProcess
        $serverProcess = Start-Server
        if (-not $serverProcess) { break }
    }
    elseif ($key -eq 'q') {
        Stop-Server $serverProcess
        break
    }
}

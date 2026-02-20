param(
    [string]$Version
)

$ErrorActionPreference = "Stop"

$repo = "tylergibbs1/context7cli"
$binaryName = "context7"

if (-not $Version) {
    Write-Host "Fetching latest version..."
    $release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
    $Version = $release.tag_name
}

$url = "https://github.com/$repo/releases/download/$Version/$binaryName-windows-x64.exe"
$installDir = Join-Path $HOME ".local" "bin"

if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$dest = Join-Path $installDir "$binaryName.exe"

Write-Host "Installing $binaryName $Version..."
Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing

# Smoke test
try {
    & $dest --help | Out-Null
    Write-Host "Smoke test passed."
} catch {
    Write-Warning "Smoke test failed. The binary may not be compatible with your system."
}

# Check if install dir is in PATH
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$installDir*") {
    $addToPath = Read-Host "Add $installDir to your PATH? (y/N)"
    if ($addToPath -eq "y" -or $addToPath -eq "Y") {
        [Environment]::SetEnvironmentVariable("PATH", "$userPath;$installDir", "User")
        Write-Host "Added to PATH. Restart your terminal for changes to take effect."
    } else {
        Write-Host ""
        Write-Host "To add manually, run:"
        Write-Host "  `$env:PATH += `";$installDir`""
    }
}

Write-Host ""
Write-Host "Installed $binaryName to $dest"

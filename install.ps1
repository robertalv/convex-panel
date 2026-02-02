#Requires -Version 5.1
<#
.SYNOPSIS
    Convex Panel Installer for Windows
.DESCRIPTION
    Downloads and installs the latest version of Convex Panel from GitHub Releases.
.EXAMPLE
    irm https://raw.githubusercontent.com/robertalv/convex-panel/main/install.ps1 | iex
.NOTES
    Requires PowerShell 5.1 or later
#>

# Configuration
$Repo = "robertalv/convex-panel"
$AppName = "Convex Panel"

# Error handling
$ErrorActionPreference = "Stop"

function Write-Banner {
    Write-Host ""
    Write-Host "   ____                          ____                  _ " -ForegroundColor Cyan
    Write-Host "  / ___|___  _ ____   _______  _|  _ \ __ _ _ __   ___| |" -ForegroundColor Cyan
    Write-Host " | |   / _ \| '_ \ \ / / _ \ \/ / |_) / _`` | '_ \ / _ \ |" -ForegroundColor Cyan
    Write-Host " | |__| (_) | | | \ V /  __/>  <|  __/ (_| | | | |  __/ |" -ForegroundColor Cyan
    Write-Host "  \____\___/|_| |_|\_/ \___/_/\_\_|   \__,_|_| |_|\___|_|" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Convex Panel Installer for Windows" -ForegroundColor White
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
    exit 1
}

function Get-LatestRelease {
    Write-Info "Fetching latest release information..."
    
    try {
        $ReleaseUrl = "https://api.github.com/repos/$Repo/releases/latest"
        $Release = Invoke-RestMethod -Uri $ReleaseUrl -Method Get -Headers @{
            "Accept" = "application/vnd.github.v3+json"
            "User-Agent" = "ConvexPanel-Installer"
        }
        
        $script:Version = $Release.tag_name
        Write-Info "Latest version: $Version"
        
        # Find MSI or NSIS installer
        $Asset = $Release.assets | Where-Object { 
            $_.name -match "\.msi$" -or $_.name -match "\.exe$"
        } | Select-Object -First 1
        
        if (-not $Asset) {
            Write-Error "Could not find Windows installer in release assets. Please download manually from https://github.com/$Repo/releases"
        }
        
        $script:DownloadUrl = $Asset.browser_download_url
        $script:FileName = $Asset.name
        
        Write-Info "Download URL: $DownloadUrl"
        
    } catch {
        Write-Error "Failed to fetch release information: $_"
    }
}

function Get-Installer {
    Write-Info "Downloading $AppName..."
    
    $TempDir = [System.IO.Path]::GetTempPath()
    $script:InstallerPath = Join-Path $TempDir $FileName
    
    try {
        # Use BITS for better download experience with progress
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $InstallerPath -UseBasicParsing
        $ProgressPreference = 'Continue'
        
        Write-Success "Download complete!"
        
    } catch {
        Write-Error "Failed to download installer: $_"
    }
}

function Install-App {
    Write-Info "Installing $AppName..."
    
    try {
        if ($FileName -match "\.msi$") {
            # MSI installation
            Write-Info "Running MSI installer..."
            $Arguments = "/i `"$InstallerPath`" /quiet /norestart"
            $Process = Start-Process -FilePath "msiexec.exe" -ArgumentList $Arguments -Wait -PassThru
            
            if ($Process.ExitCode -ne 0) {
                Write-Warning "MSI installer returned exit code: $($Process.ExitCode)"
                Write-Info "Trying interactive installation..."
                Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$InstallerPath`"" -Wait
            }
            
        } elseif ($FileName -match "\.exe$") {
            # NSIS installation
            Write-Info "Running installer..."
            $Process = Start-Process -FilePath $InstallerPath -ArgumentList "/S" -Wait -PassThru
            
            if ($Process.ExitCode -ne 0) {
                Write-Warning "Silent installation failed. Launching interactive installer..."
                Start-Process -FilePath $InstallerPath -Wait
            }
        }
        
        Write-Success "Installation complete!"
        
    } catch {
        Write-Error "Failed to install: $_"
    }
}

function Remove-TempFiles {
    Write-Info "Cleaning up..."
    
    if (Test-Path $InstallerPath) {
        Remove-Item $InstallerPath -Force -ErrorAction SilentlyContinue
    }
}

function Show-Success {
    Write-Host ""
    Write-Success "$AppName has been installed successfully!"
    Write-Host ""
    Write-Host "  Version: " -NoNewline
    Write-Host $Version -ForegroundColor White
    Write-Host ""
    Write-Host "  You can find $AppName in your Start Menu or search for it."
    Write-Host ""
}

function Request-OpenApp {
    $Response = Read-Host "Would you like to open $AppName now? [Y/n]"
    
    if ($Response -ne "n" -and $Response -ne "N") {
        # Try to find and open the app - check common installation paths
        $Paths = @(
            # NSIS default install location (Tauri uses bundle identifier)
            "$env:LOCALAPPDATA\dev.convexpanel.desktop\Convex Panel.exe",
            "$env:LOCALAPPDATA\Convex Panel\Convex Panel.exe",
            "$env:LOCALAPPDATA\Programs\Convex Panel\Convex Panel.exe",
            # MSI install locations
            "$env:ProgramFiles\Convex Panel\Convex Panel.exe",
            "${env:ProgramFiles(x86)}\Convex Panel\Convex Panel.exe"
        )
        
        foreach ($Path in $Paths) {
            if (Test-Path $Path) {
                Write-Info "Found app at: $Path"
                Start-Process $Path
                return
            }
        }
        
        # Try to find it by searching common locations
        Write-Info "Searching for installation..."
        $SearchPaths = @(
            "$env:LOCALAPPDATA",
            "$env:ProgramFiles",
            "${env:ProgramFiles(x86)}"
        )
        
        foreach ($SearchPath in $SearchPaths) {
            $Found = Get-ChildItem -Path $SearchPath -Filter "Convex Panel.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($Found) {
                Write-Info "Found app at: $($Found.FullName)"
                Start-Process $Found.FullName
                return
            }
        }
        
        # Last resort - try Start Menu shortcut
        $StartMenuPaths = @(
            "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Convex Panel.lnk",
            "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Convex Panel.lnk"
        )
        
        foreach ($ShortcutPath in $StartMenuPaths) {
            if (Test-Path $ShortcutPath) {
                Write-Info "Launching from Start Menu shortcut..."
                Start-Process $ShortcutPath
                return
            }
        }
        
        Write-Warning "Could not find installation path. Please open $AppName from the Start Menu."
    }
}

# Main execution
function Main {
    Write-Banner
    Get-LatestRelease
    Get-Installer
    Install-App
    Remove-TempFiles
    Show-Success
    Request-OpenApp
}

# Run
Main

@echo off
REM Windows Development Setup Wrapper for SpecimenStats
REM This batch file launches the PowerShell setup script

echo Starting SpecimenStats Windows Development Setup...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please ensure PowerShell 5.1+ or PowerShell Core 6+ is installed.
    pause
    exit /b 1
)

REM Launch the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0dev.setup.windows.ps1"

REM Pause to show any output
pause

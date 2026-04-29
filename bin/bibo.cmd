@echo off
REM Bibo - Cross-platform launcher for pi-coding-agent with dashboard
REM Usage: bibo [prompt]
REM Works on Windows (CMD, PowerShell, Git Bash)

setlocal

REM Resolve the directory where this script lives
set "SCRIPT_DIR=%~dp0"

REM Launch the Node.js bibo launcher
node "%SCRIPT_DIR%bibo" %*

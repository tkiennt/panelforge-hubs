<#
.SYNOPSIS
  Dot-source before running an agent so everything it writes (temp files, npm/NuGet caches,
  Codex home with sessions and sandbox) lives under one folder on drive D instead of drive C.

.EXAMPLE
  . "$PSScriptRoot\Use-AgentSandbox.ps1"
#>
param([string]$SandboxRoot = 'D:\FPT-STUDY\10_FALL-2026\SEP490\.sandbox')

$script:AgentSandboxRoot = $SandboxRoot
foreach ($d in 'tmp', 'npm-cache', 'nuget\packages', 'nuget\http-cache', 'codex-home') {
    New-Item -ItemType Directory -Force -Path (Join-Path $SandboxRoot $d) | Out-Null
}

$env:TEMP = Join-Path $SandboxRoot 'tmp'
$env:TMP = $env:TEMP
$env:npm_config_cache = Join-Path $SandboxRoot 'npm-cache'
$env:NUGET_PACKAGES = Join-Path $SandboxRoot 'nuget\packages'
$env:NUGET_HTTP_CACHE_PATH = Join-Path $SandboxRoot 'nuget\http-cache'

# Codex keeps config, auth, sessions and its sandbox under CODEX_HOME. Copy config/auth from the
# user's ~/.codex when newer, so `codex login` done the normal way keeps working.
$codexHome = Join-Path $SandboxRoot 'codex-home'
$userCodex = Join-Path $env:USERPROFILE '.codex'
foreach ($f in 'config.toml', 'auth.json') {
    $src = Join-Path $userCodex $f
    $dst = Join-Path $codexHome $f
    if ((Test-Path $src) -and (-not (Test-Path $dst) -or (Get-Item $src).LastWriteTime -gt (Get-Item $dst).LastWriteTime)) {
        Copy-Item $src $dst -Force
    }
}
$env:CODEX_HOME = $codexHome

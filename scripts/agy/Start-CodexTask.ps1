<#
.SYNOPSIS
  Runs one task headless with OpenAI Codex CLI (`codex exec`) in a worktree, using the same
  standing rules, scoped verify and report format as Start-AgyTask.ps1.

  Output folder: <RunsRoot>\<Id>\  task.md, codex.log, last.md, report.md, done.json

.EXAMPLE
  .\Start-CodexTask.ps1 -Id bib-01 -Worktree D:\...\panelforge-agent-bib-1a\PanelForge_FA26SE251 -TaskFile D:\...\.agy-runs\tasks\bib-01.md
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$Worktree,
    [string]$Task,
    [string]$TaskFile,
    [string]$Model,                       # empty = model from ~/.codex/config.toml
    [string]$Effort,                      # low | medium | high (empty = config)
    [string]$Base = 'trungkien',
    [string[]]$Deny = @(),
    [string[]]$AddDir = @('D:\FPT-STUDY\10_FALL-2026\SEP490\panelforge-hub'),
    [string]$RunsRoot = 'D:\FPT-STUDY\10_FALL-2026\SEP490\.agy-runs',
    [switch]$FullTests,
    [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (-not $Task -and -not $TaskFile) { throw 'Give -Task or -TaskFile.' }
$Worktree = (Resolve-Path $Worktree).Path
$runDir = Join-Path $RunsRoot $Id
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
foreach ($f in 'done.json', 'report.md', 'codex.log', 'last.md') { $p = Join-Path $runDir $f; if (Test-Path $p) { Remove-Item $p -Force } }

# Prompt: task + scope + standing rules (shared with agy)
$body = if ($TaskFile) { [IO.File]::ReadAllText((Resolve-Path $TaskFile).Path, $utf8) } else { $Task }
$rules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'agy-rules.md'), $utf8)
$scope = "Worktree: $Worktree (branch: $((git -C $Worktree branch --show-current)))`nBase branch: $Base`n"
if ($Deny.Count) { $scope += "Do NOT edit these paths (owned by others): $($Deny -join ', ')`n" }
$prompt = "# Task $Id`n`n$scope`n$body`n`n$rules"
[IO.File]::WriteAllText((Join-Path $runDir 'task.md'), $prompt, $utf8)

$lastPath = Join-Path $runDir 'last.md'
$codexArgs = @('exec', '-C', $Worktree, '-s', 'workspace-write', '-o', $lastPath,
    '-c', 'sandbox_workspace_write.network_access=true', '--add-dir', $runDir)
foreach ($d in $AddDir) { if (Test-Path $d) { $codexArgs += @('--add-dir', $d) } }
if ($Model) { $codexArgs += @('-m', $Model) }
if ($Effort) { $codexArgs += @('-c', "model_reasoning_effort=`"$Effort`"") }
$codexArgs += '-'

$started = Get-Date
$log = Join-Path $runDir 'codex.log'
Write-Host "[codex $Id] worktree=$Worktree model=$(if ($Model) { $Model } else { 'config default' })" -ForegroundColor Cyan

Push-Location $Worktree
$prevPref = $ErrorActionPreference
$ErrorActionPreference = 'Continue'   # codex writes progress to stderr; PS 5.1 would treat it as terminating
try {
    $prompt | & codex @codexArgs 2>&1 | ForEach-Object {
        $line = if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { "$_" }
        if ($line -match 'eyJ[A-Za-z0-9_-]{20,}') { $line = $line -replace 'eyJ[A-Za-z0-9_.-]+', '<token redacted>' }
        [IO.File]::AppendAllText($log, $line + "`n", $utf8)
        if ($line.Length -gt 160) { $line = $line.Substring(0, 160) + '...' }
        Write-Host $line
    }
    $codexExit = $LASTEXITCODE
} finally { Pop-Location; $ErrorActionPreference = $prevPref }

$elapsed = [int]((Get-Date) - $started).TotalMinutes
$status = if ($codexExit -eq 0 -and (Test-Path $lastPath)) { 'SUCCESS' } else { "ERROR($codexExit)" }
Write-Host "[codex $Id] finished: $status after $elapsed min" -ForegroundColor Cyan

$verifyText = ''
$verifyCode = 0
if (-not $SkipVerify) {
    Write-Host "[codex $Id] verifying (scoped checks)..." -ForegroundColor Cyan
    $vArgs = @{ Worktree = $Worktree; Base = $Base }
    if ($Deny.Count) { $vArgs.Deny = $Deny }
    if ($FullTests) { $vArgs.FullTests = $true }
    $verifyText = (& (Join-Path $PSScriptRoot 'Invoke-AgyVerify.ps1') @vArgs | Out-String)
    $verifyCode = $LASTEXITCODE
}

$summary = if (Test-Path $lastPath) {
    $lines = @([IO.File]::ReadAllText($lastPath, $utf8) -split "`n")
    ($lines | Select-Object -Last 20) -join "`n"
} else { '(codex returned no final answer - see codex.log)' }

$report = @"
## codex task $Id - $status - $elapsed min

#### codex summary
$summary

$verifyText
"@
[IO.File]::WriteAllText((Join-Path $runDir 'report.md'), $report, $utf8)

$verdict = if ($status -ne 'SUCCESS') { 'AGENT_FAILED' } elseif ($verifyCode -ne 0) { 'VERIFY_FAILED' } else { 'OK' }
$done = [ordered]@{ id = $Id; engine = 'codex'; verdict = $verdict; status = $status; minutes = $elapsed; worktree = $Worktree; report = (Join-Path $runDir 'report.md'); finishedAt = (Get-Date).ToString('s') }
[IO.File]::WriteAllText((Join-Path $runDir 'done.json'), ($done | ConvertTo-Json), $utf8)

Write-Host ''
Write-Host $verifyText
Write-Host "[codex $Id] $verdict - report: $(Join-Path $runDir 'report.md')" -ForegroundColor $(if ($verdict -eq 'OK') { 'Green' } else { 'Yellow' })

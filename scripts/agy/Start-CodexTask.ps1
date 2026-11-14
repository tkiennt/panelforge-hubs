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
$commitMsgPath = Join-Path $runDir 'commit-msg.txt'
if (Test-Path $commitMsgPath) { Remove-Item $commitMsgPath -Force }
$gitNote = @"
## Git (Codex only - overrides the git/commit lines below)
The .git folder is read-only in your sandbox. Do NOT run git commands that write (add, commit, merge, checkout, stash, fetch).
Read-only git (status, diff, log, show) is fine. If a merge is in progress, resolve the conflict markers in the files only.
Do not create or write files outside the worktree (the sandbox cannot write there), and do not touch node_modules.
Make the LAST line of your final answer exactly: COMMIT_MSG: <one conventional commit message>
The runner stages and commits your changes after you finish.
"@
$prompt = "# Task $Id`n`n$scope`n$body`n`n$gitNote`n`n$rules"
[IO.File]::WriteAllText((Join-Path $runDir 'task.md'), $prompt, $utf8)

$lastPath = Join-Path $runDir 'last.md'
$codexArgs = @('exec', '-C', $Worktree, '-s', 'workspace-write', '-o', $lastPath,
    '-c', 'sandbox_workspace_write.network_access=true', '--add-dir', $runDir)
foreach ($d in $AddDir) { if (Test-Path $d) { $codexArgs += @('--add-dir', $d) } }
# A worktree keeps its git metadata in the main repo's .git; the sandbox must be able to write it to commit/merge/fetch.
$gitCommon = (git -C $Worktree rev-parse --path-format=absolute --git-common-dir 2>$null)
if ($gitCommon -and (Test-Path $gitCommon)) { $codexArgs += @('--add-dir', (Resolve-Path $gitCommon).Path) }
# npm/dotnet caches live outside the worktree; npm install / dotnet restore need to write them.
foreach ($cache in (Join-Path $env:LOCALAPPDATA 'npm-cache'), (Join-Path $env:USERPROFILE '.nuget\packages')) {
    if (Test-Path $cache) { $codexArgs += @('--add-dir', $cache) }
}
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

# Commit on Codex's behalf (its sandbox cannot write .git). Skip when conflict markers remain.
$dirty = @(git -C $Worktree status --porcelain 2>$null)
$merging = (git -C $Worktree rev-parse -q --verify MERGE_HEAD 2>$null)
if ($status -eq 'SUCCESS' -and ($dirty.Count -gt 0 -or $merging)) {
    # Unmerged (U) index entries are expected - Codex cannot `git add`. Only real markers in file content count.
    $markers = @(git -C $Worktree grep -l -E '^(<<<<<<<|>>>>>>>)( |$)' 2>$null) | Sort-Object -Unique
    if ($markers.Count -gt 0) {
        $status = 'CONFLICTS_LEFT'
        Write-Host "[codex $Id] not committing: unresolved conflicts in $($markers -join ', ')" -ForegroundColor Yellow
    } else {
        # Commit message comes from the "COMMIT_MSG:" line of the final answer (written by the host, not the sandbox).
        $msg = ''
        if (Test-Path $lastPath) {
            $m = [regex]::Matches([IO.File]::ReadAllText($lastPath, $utf8), '(?m)^\s*COMMIT_MSG:\s*`?(.+?)`?\s*$')
            if ($m.Count) { $msg = $m[$m.Count - 1].Groups[1].Value.Trim() }
        }
        git -C $Worktree add -A | Out-Null
        if ($merging -and -not $msg) { git -C $Worktree commit --no-edit -q }
        else {
            if (-not $msg) { $msg = "chore(config): apply codex task $Id" }
            git -C $Worktree commit -q -m $msg -m 'Co-Authored-By: Codex <noreply@openai.com>'
        }
        Write-Host "[codex $Id] committed: $(git -C $Worktree log --oneline -1)" -ForegroundColor Cyan
    }
}
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

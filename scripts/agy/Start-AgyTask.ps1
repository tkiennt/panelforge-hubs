<#
.SYNOPSIS
  Runs one agy (Antigravity CLI) task headless in a worktree, shows compact progress,
  then runs Invoke-AgyVerify.ps1 and writes a short report.

  Output folder: <RunsRoot>\<Id>\
    task.md     prompt given to agy (task + standing rules)
    agy.jsonl   raw agy event stream
    report.md   agy final summary + token usage + verify table   <- read this
    done.json   written last; its presence means the run finished

.EXAMPLE
  .\Start-AgyTask.ps1 -Id bib-17 -Worktree D:\...\panelforge-agent-bib-1a\PanelForge_FA26SE251 -TaskFile .\tasks\bib-17.md
  .\Start-AgyTask.ps1 -Id fix-eol -Worktree D:\...\PanelForge_FA26SE251 -Task 'Restore line endings of ...' -Deny 'src/PanelForge.Domain/*'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$Worktree,
    [string]$Task,
    [string]$TaskFile,
    [string]$Model = 'gemini-3.8-flash-medium',
    [string]$FallbackModel = 'claude-sonnet-5-5-medium',
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
foreach ($f in 'done.json', 'report.md', 'agy.jsonl') { $p = Join-Path $runDir $f; if (Test-Path $p) { Remove-Item $p -Force } }

$agy = Join-Path $env:LOCALAPPDATA 'agy\bin\agy.exe'
if (-not (Test-Path $agy)) { $agy = 'agy' }

# ── Prompt file: task + scope + standing rules ──────────────────────────────
$body = if ($TaskFile) { [IO.File]::ReadAllText((Resolve-Path $TaskFile).Path, $utf8) } else { $Task }
$rules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'agy-rules.md'), $utf8)
$scope = "Worktree: $Worktree (branch: $((git -C $Worktree branch --show-current)))`nBase branch: $Base`n"
if ($Deny.Count) { $scope += "Do NOT edit these paths (owned by others): $($Deny -join ', ')`n" }
$prompt = "# Task $Id`n`n$scope`n$body`n`n$rules"
$taskPath = Join-Path $runDir 'task.md'
[IO.File]::WriteAllText($taskPath, $prompt, $utf8)

$shortPrompt = "Read the file $taskPath completely and carry out the task it describes, following every rule in it. Work immediately, do not wait for approval."
$agyArgs = @('-p', $shortPrompt, '--model', $Model, '--output-format', 'stream-json', '--add-dir', $runDir)
foreach ($d in $AddDir) { if (Test-Path $d) { $agyArgs += @('--add-dir', $d) } }

# ── Run agy and print compact progress ──────────────────────────────────────
$started = Get-Date
$jsonl = Join-Path $runDir 'agy.jsonl'
$final = $null
Write-Host "[agy $Id] model=$Model worktree=$Worktree" -ForegroundColor Cyan

$script:final = $null
$script:convId = $null
function Invoke-AgyRun([string[]]$RunArgs) {
  $script:final = $null
  Push-Location $Worktree
  try {
    & $agy @RunArgs | ForEach-Object {
        $line = "$_"
        [IO.File]::AppendAllText($jsonl, $line + "`n", $utf8)
        if (-not $line.StartsWith('{')) { return }
        try { $ev = $line | ConvertFrom-Json } catch { return }
        $ts = (Get-Date).ToString('HH:mm:ss')
        if ($ev.event -eq 'init' -and $ev.conversation_id) { $script:convId = $ev.conversation_id }
        if ($ev.event -eq 'step_update') {
            $s = $ev.step_update
            if ($s.step_type -eq 'tool' -and $s.state -eq 'ACTIVE') {
                $params = $s.tool_info.parameters
                $hint = @($params.CommandLine, $params.TargetFile, $params.AbsolutePath, $params.SearchPath, $params.Query) |
                    Where-Object { $_ } | Select-Object -First 1
                if ("$hint".Length -gt 110) { $hint = "$hint".Substring(0, 110) + '...' }
                Write-Host "$ts  $($s.tool_name)  $hint" -ForegroundColor DarkGray
            }
            elseif ($s.step_type -eq 'agent_response' -and $s.text_delta) {
                $first = ("$($s.text_delta)" -split "`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
                if ($first) { if ($first.Length -gt 140) { $first = $first.Substring(0, 140) + '...' }; Write-Host "$ts  > $first" }
            }
        }
        elseif ($ev.event -eq 'result') { $script:final = $ev.result }
    }
  } finally { Pop-Location }
}

Invoke-AgyRun $agyArgs
$usedModel = $Model
# Fallback: quota exhausted / error / no result -> resume the same conversation with a Claude model.
if ((-not $script:final -or $script:final.status -ne 'SUCCESS') -and $FallbackModel -and $FallbackModel -ne $Model) {
    $why = if ($script:final) { $script:final.status } else { 'NO_RESULT' }
    Write-Host "[agy $Id] $Model stopped ($why) - continuing with $FallbackModel" -ForegroundColor Yellow
    $resume = "The previous model stopped before finishing. Check git status and git log, then finish the task in $taskPath following its rules."
    $fbArgs = @('-p', $resume, '--model', $FallbackModel, '--output-format', 'stream-json', '--add-dir', $runDir)
    foreach ($d in $AddDir) { if (Test-Path $d) { $fbArgs += @('--add-dir', $d) } }
    if ($script:convId) { $fbArgs += @('--conversation', $script:convId) }
    Invoke-AgyRun $fbArgs
    $usedModel = $FallbackModel
}
$final = $script:final

$elapsed = [int]((Get-Date) - $started).TotalMinutes
$status = if ($final) { $final.status } else { 'NO_RESULT' }
Write-Host "[agy $Id] finished: $status ($usedModel) after $elapsed min" -ForegroundColor Cyan

# ── Verify + report ─────────────────────────────────────────────────────────
$verifyText = ''
$verifyCode = 0
if (-not $SkipVerify) {
    Write-Host "[agy $Id] verifying (scoped checks)..." -ForegroundColor Cyan
    $vArgs = @{ Worktree = $Worktree; Base = $Base }
    if ($Deny.Count) { $vArgs.Deny = $Deny }
    if ($FullTests) { $vArgs.FullTests = $true }
    $verifyText = (& (Join-Path $PSScriptRoot 'Invoke-AgyVerify.ps1') @vArgs | Out-String)
    $verifyCode = $LASTEXITCODE
}

$summary = if ($final -and $final.response) {
    $lines = @("$($final.response)" -split "`n" | Where-Object { $_ -notmatch '^\s*I (will|am) (wait|await)' })
    $start = 0
    for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^\s*(DONE|BLOCKED)') { $start = $i } }
    ($lines[$start..($lines.Count - 1)] | Select-Object -First 20) -join "`n"
} else { '(agy returned no final answer - see agy.jsonl)' }

$report = @"
## agy task $Id - agy: $status ($usedModel) - $elapsed min

#### agy summary
$summary

$verifyText
"@
[IO.File]::WriteAllText((Join-Path $runDir 'report.md'), $report, $utf8)

$verdict = if ($status -ne 'SUCCESS') { 'AGY_FAILED' } elseif ($verifyCode -ne 0) { 'VERIFY_FAILED' } else { 'OK' }
$done = [ordered]@{ id = $Id; verdict = $verdict; agyStatus = $status; minutes = $elapsed; worktree = $Worktree; report = (Join-Path $runDir 'report.md'); finishedAt = (Get-Date).ToString('s') }
[IO.File]::WriteAllText((Join-Path $runDir 'done.json'), ($done | ConvertTo-Json), $utf8)

Write-Host ''
Write-Host $verifyText
Write-Host "[agy $Id] $verdict - report: $(Join-Path $runDir 'report.md')" -ForegroundColor $(if ($verdict -eq 'OK') { 'Green' } else { 'Yellow' })

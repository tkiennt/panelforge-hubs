<#
.SYNOPSIS
  Scoped post-task verification for an agy worktree (backend .NET or frontend React).
  Runs only the checks the change needs and writes a short Markdown report.

.EXAMPLE
  .\Invoke-AgyVerify.ps1 -Worktree D:\...\panelforge-agent-bib-1a\PanelForge_FA26SE251
  .\Invoke-AgyVerify.ps1 -Worktree D:\...\panelforge-fe -Deny 'src/shared/features/series-bible/*' -OutFile report.md
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Worktree,
    [string]$Base = 'trungkien',
    [string[]]$Deny = @(),
    [string]$OutFile,
    [switch]$FullTests
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Worktree = (Resolve-Path $Worktree).Path
$results = New-Object System.Collections.Generic.List[object]
$notes = New-Object System.Collections.Generic.List[string]

function Add-Result([string]$Check, [string]$Status, [string]$Detail) {
    $results.Add([pscustomobject]@{ Check = $Check; Status = $Status; Detail = $Detail })
}

function Invoke-Step([string]$Command) {
    # Runs a command line in the worktree; returns exit code and the last lines of output.
    Push-Location $Worktree
    try {
        $out = & cmd.exe /d /c "$Command 2>&1"
        $code = $LASTEXITCODE
    } finally { Pop-Location }
    $text = ($out | ForEach-Object { "$_" }) -join "`n"
    return [pscustomobject]@{ Code = $code; Output = $text }
}

function Get-Tail([string]$Text, [int]$Lines = 6) {
    $arr = $Text -split "`n" | Where-Object { $_.Trim() -ne '' }
    if ($arr.Count -le $Lines) { return ($arr -join "`n") }
    return ($arr[($arr.Count - $Lines)..($arr.Count - 1)] -join "`n")
}

function Git([string[]]$GitArgs) {
    $out = & git -C $Worktree @GitArgs 2>$null
    return @($out | Where-Object { $_ -ne $null -and "$_".Trim() -ne '' } | ForEach-Object { "$_".Trim() })
}

# ── Change set ──────────────────────────────────────────────────────────────
$branch = (Git @('branch', '--show-current')) -join ''
$commits = Git @('log', '--oneline', "$Base..HEAD")
$dirty = Git @('status', '--short')
$changed = @(Git @('diff', '--name-only', "$Base...HEAD")) + @(Git @('diff', '--name-only', 'HEAD')) |
    Sort-Object -Unique
$realChanged = @(Git @('diff', '--name-only', '--ignore-cr-at-eol', "$Base...HEAD")) + @(Git @('diff', '--name-only', '--ignore-cr-at-eol', 'HEAD')) |
    Sort-Object -Unique
$wsChanged = @(Git @('diff', '--name-only', '-w', '--ignore-blank-lines', "$Base...HEAD")) | Sort-Object -Unique

if ($commits.Count -gt 0) { Add-Result 'Commits' 'PASS' "$($commits.Count) commit(s) on $branch" }
else { Add-Result 'Commits' 'FAIL' "No commits on $branch since $Base" }

if ($dirty.Count -gt 0) { Add-Result 'Working tree' 'WARN' "$($dirty.Count) uncommitted file(s)" }
else { Add-Result 'Working tree' 'PASS' 'clean' }

# Line endings: files whose diff disappears when CR is ignored, and files stored with CRLF in the index.
$eolOnly = @($changed | Where-Object { $realChanged -notcontains $_ })
$crlfIndexed = @()
if ($changed.Count -gt 0) {
    $eolInfo = & git -C $Worktree ls-files --eol -- $changed 2>$null
    $crlfIndexed = @($eolInfo | Where-Object { $_ -match '^i/crlf' } | ForEach-Object { ($_ -split "`t")[-1] })
}
if ($eolOnly.Count -eq 0 -and $crlfIndexed.Count -eq 0) { Add-Result 'Line endings' 'PASS' 'no CRLF churn' }
else {
    Add-Result 'Line endings' 'FAIL' "$($eolOnly.Count) EOL-only file(s), $($crlfIndexed.Count) file(s) committed with CRLF"
    if ($eolOnly.Count) { $notes.Add("EOL-only (revert with git checkout $Base -- <file>): " + ($eolOnly -join ', ')) }
    if ($crlfIndexed.Count) { $notes.Add("Committed with CRLF (run git add --renormalize .): " + ($crlfIndexed -join ', ')) }
}

$wsOnly = @($realChanged | Where-Object { $wsChanged -notcontains $_ })
if ($wsOnly.Count -gt 5) {
    Add-Result 'Formatting scope' 'WARN' "$($wsOnly.Count) file(s) changed only in whitespace (repo-wide format?)"
    $notes.Add('Whitespace-only files: ' + (($wsOnly | Select-Object -First 15) -join ', '))
}

if ($Deny.Count -gt 0) {
    $violations = @($realChanged | Where-Object { $f = $_; @($Deny | Where-Object { $f -like $_ }).Count -gt 0 })
    if ($violations.Count) { Add-Result 'Scope' 'FAIL' "$($violations.Count) file(s) in denied paths"; $notes.Add('Out of scope: ' + ($violations -join ', ')) }
    else { Add-Result 'Scope' 'PASS' 'no denied paths touched' }
}

$codeChanged = @($realChanged | Where-Object { $_ -notmatch '\.(md|txt)$' })
$isBackend = Test-Path (Join-Path $Worktree 'test\PanelForge.UnitTests')
$isFrontend = Test-Path (Join-Path $Worktree 'package.json')

if ($codeChanged.Count -eq 0) {
    Add-Result 'Build/tests' 'SKIP' 'no code changes'
}
elseif ($isBackend) {
    # ── Backend ────────────────────────────────────────────────────────────
    $build = Invoke-Step 'dotnet build test/PanelForge.UnitTests -v q -nologo'
    if ($build.Code -eq 0) { Add-Result 'dotnet build' 'PASS' '' }
    else {
        $errs = ($build.Output -split "`n" | Where-Object { $_ -match ' error ' } | Select-Object -Unique -First 8) -join "`n"
        Add-Result 'dotnet build' 'FAIL' 'compile errors'; $notes.Add("Build errors:`n$errs")
    }

    if ($build.Code -eq 0) {
        $srcNames = @($codeChanged | Where-Object { $_ -like 'src/*.cs' -and $_ -notmatch '/Migrations/' } |
            ForEach-Object { [IO.Path]::GetFileNameWithoutExtension($_) })
        $testFiles = @($codeChanged | Where-Object { $_ -like 'test/*.cs' })
        $broad = @($codeChanged | Where-Object { $_ -match 'DependencyInjection\.cs$|DbContext\.cs$|IPanelForgeDbContext\.cs$' }).Count -gt 0
        if ($srcNames.Count -gt 0) {
            $grepArgs = @('grep', '-l', '-w') + ($srcNames | ForEach-Object { @('-e', $_) }) + @('--', 'test/')
            $testFiles += Git $grepArgs
        }
        $classes = @($testFiles | Where-Object { $_ -like '*.cs' } | ForEach-Object { [IO.Path]::GetFileNameWithoutExtension($_) } | Sort-Object -Unique)

        if ($FullTests -or $classes.Count -gt 40) {
            $t = Invoke-Step 'dotnet test test/PanelForge.UnitTests --no-build -v q -nologo'
            $scope = 'full suite'
        } elseif ($classes.Count -eq 0) {
            $t = $null; $scope = ''
            Add-Result 'Unit tests' 'WARN' 'no related test class found; nothing run'
        } else {
            $filter = ($classes | ForEach-Object { "FullyQualifiedName~$_" }) -join '|'
            $t = Invoke-Step "dotnet test test/PanelForge.UnitTests --no-build -v q -nologo --filter `"$filter`""
            $scope = "$($classes.Count) related class(es)"
        }
        if ($t) {
            $summary = ($t.Output -split "`n" | Where-Object { $_ -match '(Passed|Failed)!' } | Select-Object -Last 1)
            if ($t.Code -eq 0) { Add-Result 'Unit tests' 'PASS' "$scope - $summary".Trim() }
            else {
                Add-Result 'Unit tests' 'FAIL' "$scope - $summary".Trim()
                $failed = ($t.Output -split "`n" | Where-Object { $_ -match '^\s*Failed ' } | Select-Object -First 10) -join "`n"
                $notes.Add("Failed tests:`n$failed")
            }
            if ($broad -and -not $FullTests) { $notes.Add('DI/DbContext changed: run once with -FullTests before merging.') }
        }

        if (@($codeChanged | Where-Object { $_ -match 'Domain/Entities/|Persistence/Configurations/|/Migrations/|DbContext' }).Count -gt 0) {
            $ef = Invoke-Step 'dotnet ef migrations has-pending-model-changes --project src/PanelForge.Infrastructure --startup-project src/PanelForge.API --no-build'
            if ($ef.Output -match 'No changes have been made') { Add-Result 'EF model' 'PASS' 'in sync with migrations' }
            else { Add-Result 'EF model' 'FAIL' (Get-Tail $ef.Output 2) }
        } else { Add-Result 'EF model' 'SKIP' 'no entity/config/migration change' }
    }
}
elseif ($isFrontend) {
    # ── Frontend ───────────────────────────────────────────────────────────
    if (-not (Test-Path (Join-Path $Worktree 'node_modules'))) {
        $inst = Invoke-Step 'npm install --no-audit --no-fund --loglevel=error'
        if ($inst.Code -ne 0) { Add-Result 'npm install' 'FAIL' (Get-Tail $inst.Output 3) }
    }
    $tsFiles = @($codeChanged | Where-Object { $_ -match '^src/.*\.(ts|tsx)$' -and (Test-Path (Join-Path $Worktree $_)) })

    $tsc = Invoke-Step 'npx tsc --noEmit'
    if ($tsc.Code -eq 0) { Add-Result 'typecheck' 'PASS' '' }
    else {
        $errCount = @($tsc.Output -split "`n" | Where-Object { $_ -match 'error TS' }).Count
        Add-Result 'typecheck' 'FAIL' "$errCount error(s)"
        $notes.Add("tsc:`n" + (($tsc.Output -split "`n" | Where-Object { $_ -match 'error TS' } | Select-Object -First 8) -join "`n"))
    }

    if ($tsFiles.Count -gt 0) {
        $lint = Invoke-Step ("npx eslint " + ($tsFiles -join ' '))
        if ($lint.Code -eq 0) { Add-Result 'eslint (changed files)' 'PASS' "$($tsFiles.Count) file(s)" }
        else { Add-Result 'eslint (changed files)' 'FAIL' (Get-Tail $lint.Output 1); $notes.Add("eslint:`n" + (Get-Tail $lint.Output 10)) }

        $vt = Invoke-Step ("npx vitest related --run --pool=threads --maxWorkers=2 " + ($tsFiles -join ' '))
        $vtSummary = ($vt.Output -split "`n" | Where-Object { $_ -match '^\s*Tests\s' } | Select-Object -Last 1)
        if ($vt.Output -match 'No test files found') { Add-Result 'vitest related' 'SKIP' 'no related test files' }
        elseif ($vt.Code -eq 0) { Add-Result 'vitest related' 'PASS' "$vtSummary".Trim() }
        else { Add-Result 'vitest related' 'FAIL' "$vtSummary".Trim(); $notes.Add("vitest:`n" + (Get-Tail $vt.Output 12)) }
    }

    if (@($codeChanged | Where-Object { $_ -like 'src/locales/*' }).Count -gt 0) {
        $i18n = Invoke-Step 'npm run i18n:check --silent'
        if ($i18n.Code -eq 0) { Add-Result 'i18n parity' 'PASS' '' } else { Add-Result 'i18n parity' 'FAIL' (Get-Tail $i18n.Output 3) }
    } else { Add-Result 'i18n parity' 'SKIP' 'no locale change' }
    Add-Result 'e2e (Playwright)' 'SKIP' 'never run automatically'
}

# ── Report ──────────────────────────────────────────────────────────────────
$overall = if (@($results | Where-Object Status -eq 'FAIL').Count) { 'FAIL' } elseif (@($results | Where-Object Status -eq 'WARN').Count) { 'WARN' } else { 'PASS' }
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("### Verify: $overall")
[void]$sb.AppendLine("Worktree ``$Worktree`` - branch ``$branch`` vs ``$Base`` - $($realChanged.Count) file(s) changed")
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Check | Result | Detail |')
[void]$sb.AppendLine('|---|---|---|')
foreach ($r in $results) { [void]$sb.AppendLine("| $($r.Check) | $($r.Status) | $(($r.Detail -replace '\|', '/') -replace "`n", ' ') |") }
if ($commits.Count) { [void]$sb.AppendLine(''); [void]$sb.AppendLine('Commits:'); $commits | ForEach-Object { [void]$sb.AppendLine("- $_") } }
if ($notes.Count) { [void]$sb.AppendLine(''); [void]$sb.AppendLine('Notes:'); $notes | ForEach-Object { [void]$sb.AppendLine('```'); [void]$sb.AppendLine($_); [void]$sb.AppendLine('```') } }
$report = $sb.ToString()

if ($OutFile) { [IO.File]::WriteAllText($OutFile, $report, (New-Object System.Text.UTF8Encoding($false))) }
Write-Output $report
if ($overall -eq 'FAIL') { exit 1 } else { exit 0 }

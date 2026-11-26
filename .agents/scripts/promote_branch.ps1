<#
.SYNOPSIS
    PanelForge Branch Promotion & Quality Gate Automation Script.
.DESCRIPTION
    Dieu phoi viec merge va promote code giua cac cap do nhanh co kiem soat:
      - Cap 1 -> Cap 2: {work-branch} / feature/*  --> dev
      - Cap 2 -> Cap 3: dev                       --> stg (staging)
      - Cap 3 -> Cap 4: stg                       --> main (production release)
    Tu dong kiem tra Fast Build / Typecheck truoc khi merge va tu dong quan ly quyen
    PANELFORGE_ALLOW_PROTECTED_PUSH de tranh tai nan pha hong nhanh he thong.
.EXAMPLE
    # Merge work branch hien tai vao dev
    powershell -File .agents/scripts/promote_branch.ps1 -From trungkien -To dev -Push

    # Promote dev sang stg khi xong milestone
    powershell -File .agents/scripts/promote_branch.ps1 -From dev -To stg -Push

    # Release stg sang main va gan tag
    powershell -File .agents/scripts/promote_branch.ps1 -From stg -To main -Tag "v2.6.0" -Push
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$From,

    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "stg", "staging", "main", "master")]
    [string]$To,

    [ValidateSet("all", "backend", "frontend", "mobile")]
    [string]$Target = "all",

    [string]$Tag = "",

    [switch]$SkipVerification,

    [switch]$Push,

    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HubRoot = (Resolve-Path "$ScriptDir\..\..").Path
$WorkspaceRoot = (Resolve-Path "$HubRoot\..").Path
$BackendRoot = Join-Path $WorkspaceRoot "PanelForge_FA26SE251"
$FrontendRoot = Join-Path $WorkspaceRoot "panelforge-fe"
$MobileRoot = Join-Path $WorkspaceRoot "panelforge-mobile"

$fromClean = $From.Trim().ToLower()
$toClean = $To.Trim().ToLower()
if ($toClean -eq "staging") { $toClean = "stg" }
if ($toClean -eq "master") { $toClean = "main" }

# 1. Validation Rule: Promotion Pipeline Integrity
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   PanelForge Branch Promotion & Quality Gate Orchestration      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Luồng thăng cấp (Promotion Flow): '$From' -> '$toClean'" -ForegroundColor Yellow

$isValidFlow = $false
if ($toClean -eq "dev") {
    # Chap nhan moi work branch hoac feature branch vao dev
    $isValidFlow = $true
} elseif ($toClean -eq "stg") {
    # Chi chap nhan dev (hoac hotfix) vao stg
    if ($fromClean -eq "dev" -or $fromClean -like "hotfix/*") {
        $isValidFlow = $true
    } else {
        throw "VI PHAM QUY TAC PROMOTION: Nhánh 'stg' CHỈ nhận promote từ 'dev' (hoặc 'hotfix/*')! Không được merge trực tiếp từ '$From' vào 'stg'."
    }
} elseif ($toClean -eq "main") {
    # Chap nhan dev (quy trinh dev -> main), stg hoac hotfix vao main
    if ($fromClean -eq "dev" -or $fromClean -eq "stg" -or $fromClean -like "hotfix/*") {
        $isValidFlow = $true
    } else {
        throw "VI PHAM QUY TAC PROMOTION: Nhánh 'main' CHỈ nhận promote từ 'dev' (hoặc 'hotfix/*')! Không được merge trực tiếp từ '$From' vào 'main'. Hãy promote $From -> dev -> main."
    }
}

$repoList = @()
if ($Target -eq "all" -or $Target -eq "backend") {
    $repoList += @{ Name = "Backend"; Path = $BackendRoot; Sln = "PanelForge.slnx" }
}
if ($Target -eq "all" -or $Target -eq "frontend") {
    $repoList += @{ Name = "Frontend"; Path = $FrontendRoot; Sln = "" }
}
if ($Target -eq "all" -or $Target -eq "mobile") {
    $repoList += @{ Name = "Mobile"; Path = $MobileRoot; Sln = "" }
}

# 2. Pre-flight Verification Gate
if (-not $SkipVerification -and -not $DryRun) {
    Write-Host "`n[Gate 1] Đang thực thi Fast Verification trước khi merge..." -ForegroundColor Yellow
    foreach ($r in $repoList) {
        if (-not (Test-Path $r.Path)) { continue }

        Write-Host "  Kiểm tra $($r.Name)..." -ForegroundColor Gray
        if ($r.Name -eq "Backend") {
            $slnxPath = Join-Path $r.Path $r.Sln
            dotnet build $slnxPath -v q --nologo
            if ($LASTEXITCODE -ne 0) { throw "Fast Build Backend thất bại! Hủy tiến trình promote." }
        } elseif ($r.Name -eq "Frontend") {
            npm --prefix $r.Path run typecheck
            if ($LASTEXITCODE -ne 0) { throw "TypeScript Typecheck Frontend thất bại! Hủy tiến trình promote." }
        } elseif ($r.Name -eq "Mobile") {
            flutter --prefix $r.Path analyze
            if ($LASTEXITCODE -ne 0) { throw "Flutter Analyze Mobile thất bại! Hủy tiến trình promote." }
        }
    }
    Write-Host "  [OK] Tất cả Fast Verification checks đã PASS thành công!" -ForegroundColor Green
}

# 3. Execution of Promotion & Merge
foreach ($r in $repoList) {
    if (-not (Test-Path $r.Path)) { continue }

    Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "[+] Bắt đầu promote tại repo: $($r.Name) ($($r.Path))" -ForegroundColor Cyan

    $initialBranch = (git -C $r.Path branch --show-current).Trim()

    # Check uncommitted changes
    $dirty = git -C $r.Path status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($dirty)) {
        throw "Repo $($r.Name) có thay đổi chưa commit. Hãy commit hoặc stash trước khi promote!"
    }

    if ($DryRun) {
        Write-Host "  [DryRun] Sẽ fetch remote, checkout $toClean, merge $From, và push lên remote." -ForegroundColor Yellow
        continue
    }

    # Fetch latest remotes
    Write-Host "  1. Fetching latest từ origin..." -ForegroundColor Gray
    git -C $r.Path fetch origin

    # Ensure local target branch exists
    $targetExistsLocal = [bool](git -C $r.Path branch --list $toClean)
    $targetExistsRemote = [bool](git -C $r.Path branch -r --list "origin/$toClean")

    if ($targetExistsLocal) {
        git -C $r.Path checkout $toClean
        if ($targetExistsRemote) {
            git -C $r.Path pull origin $toClean --ff-only 2>$null
        }
    } elseif ($targetExistsRemote) {
        git -C $r.Path checkout -b $toClean "origin/$toClean"
    } else {
        # Tạo mới từ origin/main hoặc branch hiện tại
        git -C $r.Path checkout -b $toClean
    }

    # Merge with --no-ff to retain clear promotion history
    $mergeMsg = "chore(release): promote branch '$From' into '$toClean'"
    if ($toClean -eq "dev") {
        $mergeMsg = "feat(integration): merge branch '$From' into 'dev'"
    } elseif ($toClean -eq "main" -and $Tag) {
        $mergeMsg = "chore(release): release $Tag ($From -> main)"
    }

    Write-Host "  2. Merging '$From' vào '$toClean'..." -ForegroundColor Cyan
    $env:PANELFORGE_ALLOW_PROTECTED_COMMIT = "1"
    try {
        git -C $r.Path merge --no-ff $From -m $mergeMsg
        if ($LASTEXITCODE -ne 0) {
            throw "Merge conflict tại $($r.Name)! Tiến trình dừng lại. Vui lòng resolve conflict thủ công."
        }
    } finally {
        Remove-Item Env:\PANELFORGE_ALLOW_PROTECTED_COMMIT -ErrorAction SilentlyContinue
    }

    Write-Host "  [OK] Merge thành công vào nhánh '$toClean'!" -ForegroundColor Green

    # Optional Tagging on main
    if ($toClean -eq "main" -and -not [string]::IsNullOrWhiteSpace($Tag)) {
        Write-Host "  3. Gắn Release Tag: $Tag..." -ForegroundColor Cyan
        git -C $r.Path tag -a $Tag -m "PanelForge Release $Tag" -f
        Write-Host "  [OK] Đã tạo git tag $Tag!" -ForegroundColor Green
    }

    # Push if specified
    if ($Push) {
        Write-Host "  4. Đang push nhánh '$toClean' lên remote origin..." -ForegroundColor Yellow
        $env:PANELFORGE_ALLOW_PROTECTED_PUSH = "1"
        try {
            git -C $r.Path push origin $toClean
            if ($LASTEXITCODE -ne 0) { throw "Push lên origin/$toClean thất bại!" }
            
            if ($toClean -eq "main" -and -not [string]::IsNullOrWhiteSpace($Tag)) {
                git -C $r.Path push origin $Tag
            }
            Write-Host "  [OK] Push lên origin/$toClean thành công!" -ForegroundColor Green
        } finally {
            Remove-Item Env:\PANELFORGE_ALLOW_PROTECTED_PUSH -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "  [INFO] Đã merge cục bộ thành công. Để đẩy lên remote, thêm switch -Push." -ForegroundColor Cyan
    }

    # Switch back to original working branch if different
    if ($initialBranch -ne $toClean) {
        git -C $r.Path checkout $initialBranch 2>$null
        Write-Host "  5. Đã quay lại nhánh làm việc: $initialBranch" -ForegroundColor Gray
    }
}

Write-Host "`n[SUCCESS] Hoàn tất tiến trình Promotion: '$From' -> '$toClean'!" -ForegroundColor Green

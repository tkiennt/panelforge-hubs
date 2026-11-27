<#
.SYNOPSIS
    PanelForge Modular Test Execution Orchestrator for AI Agents & Developers.
.DESCRIPTION
    Runs ONLY the tests for a specific functional module and its directly related
    dependencies. Prevents full-system test re-runs (saving CPU, memory, context tokens,
    and build time).

.PARAMETER Module
    The module name to test:
      script | bible | assignment | artwork | review | release | reader | auth | collaboration | admin
.PARAMETER Target
    Target repository to execute tests in: all | backend | frontend | mobile (default: all applicable).
.PARAMETER OnlyDirect
    If set, runs ONLY direct tests for the module, excluding related modules.
.PARAMETER IncludeRelated
    Whether to include directly related modules (default: $true).
.PARAMETER AutoDetect
    Auto-detects modified module(s) by analyzing git diff/status in the workspace.
.PARAMETER ListModules
    Displays the complete mapping matrix of modules, tests, and dependencies.
.PARAMETER DryRun
    Displays the commands that would be executed without running them.

.EXAMPLE
    # Run tests for script module and its related dependencies
    powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -Module script

    # Run ONLY direct tests for bible module on backend
    powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -Module bible -Target backend -OnlyDirect

    # Auto-detect modified module from uncommitted changes and run its tests
    powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -AutoDetect
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, Position = 0)]
    [ValidateSet("script", "bible", "assignment", "artwork", "review", "release", "reader", "auth", "collaboration", "admin")]
    [string]$Module,

    [ValidateSet("all", "backend", "frontend", "mobile")]
    [string]$Target = "all",

    [switch]$OnlyDirect,

    [bool]$IncludeRelated = $true,

    [switch]$AutoDetect,

    [switch]$ListModules,

    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

if ($OnlyDirect) {
    $IncludeRelated = $false
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HubRoot = (Resolve-Path "$ScriptDir\..\..").Path
$WorkspaceRoot = (Resolve-Path "$HubRoot\..").Path
$BackendRoot = Join-Path $WorkspaceRoot "PanelForge_FA26SE251"
$FrontendRoot = Join-Path $WorkspaceRoot "panelforge-fe"
$MobileRoot = Join-Path $WorkspaceRoot "panelforge-mobile"

# Module Definition Matrix
$ModuleMatrix = @{
    "script" = @{
        Name = "01_SCRIPT (Kịch bản & Lời thoại)"
        Description = "Script editor, ScriptLines, Dialogue, Scenes, Refreeze, Story Flow"
        RelatedModules = @("bible", "assignment")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.ScriptLines|FullyQualifiedName~Application.Scenes"
            RelatedFilter = "FullyQualifiedName~Application.Bible|FullyQualifiedName~Application.Assignments"
        }
        Frontend = @{
            DirectPaths = @("src/roles/writer", "src/services/scriptLine.service.test.ts")
            RelatedPaths = @("src/shared/features/script-review", "src/shared/modals/RefreezeScriptModal.test.tsx", "src/shared/modals/AutoAssignScriptLinesModal.test.tsx")
        }
        Mobile = @{
            DirectFiles = @()
            RelatedFiles = @()
        }
        DetectPatterns = @("script", "writer", "dialogue", "scene", "refreeze")
    }

    "bible" = @{
        Name = "02_BIBLE (Hồ sơ Thế giới & Tính nhất quán)"
        Description = "Series Bible entities, relations, revisions, AI Bible consistency rules"
        RelatedModules = @("script", "review")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Bible|FullyQualifiedName~Application.Consistency"
            RelatedFilter = "FullyQualifiedName~Application.ScriptLines"
        }
        Frontend = @{
            DirectPaths = @("src/shared/features/series-bible", "src/services/bible.service.test.ts", "src/roles/editor/views/BibleReviewView.test.tsx")
            RelatedPaths = @("src/shared/features/series-identity")
        }
        Mobile = @{
            DirectFiles = @()
            RelatedFiles = @()
        }
        DetectPatterns = @("bible", "consistency", "series-bible")
    }

    "assignment" = @{
        Name = "03_ASSIGNMENT (Phân công, Pipeline & Tiến độ)"
        Description = "Pipeline stages, assignments, TaskGrid, member workload, start production"
        RelatedModules = @("script", "artwork")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Assignments|FullyQualifiedName~Application.SeriesPipeline|FullyQualifiedName~Application.TaskGrid|FullyQualifiedName~Application.Progress|FullyQualifiedName~Application.SeriesMembers"
            RelatedFilter = "FullyQualifiedName~Application.ScriptLines|FullyQualifiedName~Application.Panels"
        }
        Frontend = @{
            DirectPaths = @("src/roles/producer", "src/shared/features/pipeline-board", "src/shared/features/production-workspace", "src/services/assignment.service.test.ts", "src/services/pipeline.service.ts")
            RelatedPaths = @("src/shared/modals/AutoAssignScriptLinesModal.test.tsx", "src/shared/modals/StartProductionModal.test.tsx")
        }
        Mobile = @{
            DirectFiles = @()
            RelatedFiles = @()
        }
        DetectPatterns = @("assignment", "pipeline", "taskgrid", "producer", "seriespipeline", "progress")
    }

    "artwork" = @{
        Name = "04_ARTWORK (Họa sĩ, Bàn vẽ Canvas & Lettering)"
        Description = "Artist desk, panel layout, split, balloons, canvas elements, frame templates"
        RelatedModules = @("assignment", "review")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Panels|FullyQualifiedName~Application.CanvasElements|FullyQualifiedName~Application.Pages|FullyQualifiedName~Application.FrameTemplates|FullyQualifiedName~Ai"
            RelatedFilter = "FullyQualifiedName~Application.Assignments|FullyQualifiedName~Application.Progress"
        }
        Frontend = @{
            DirectPaths = @("src/roles/artist", "src/roles/letterer", "src/shared/lib/lettering", "src/services/artwork.service.test.ts", "src/services/panel.service.test.ts", "src/services/frameTemplate.service.test.ts")
            RelatedPaths = @("src/shared/utils/panelLayout.test.ts", "src/shared/utils/compositePageRenderer.test.ts")
        }
        Mobile = @{
            DirectFiles = @()
            RelatedFiles = @()
        }
        DetectPatterns = @("artist", "canvas", "letterer", "panel", "balloon", "frametemplate", "crop", "split")
    }

    "review" = @{
        Name = "05_REVIEW (Thẩm định, Feedback & Change Requests)"
        Description = "Editor desk, script/artwork reviews, change requests, provenance log"
        RelatedModules = @("artwork", "script")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Progress|FullyQualifiedName~Application.PreviewLinks"
            RelatedFilter = "FullyQualifiedName~Application.Pages|FullyQualifiedName~Application.ScriptLines"
        }
        Frontend = @{
            DirectPaths = @("src/roles/editor", "src/shared/features/provenance", "src/shared/features/script-review")
            RelatedPaths = @("src/shared/modals/ElementConflictModal.test.tsx")
        }
        Mobile = @{
            DirectFiles = @("test/offline_security_test.dart", "test/read_guard_test.dart")
            RelatedFiles = @()
        }
        DetectPatterns = @("editor", "review", "feedback", "provenance", "changerequest", "previewlink")
    }

    "release" = @{
        Name = "06_RELEASE (Xuất bản, Tiền tệ & Thanh toán)"
        Description = "Publisher portal, chapter publishing, pricing, CBZ packaging, SePay, Google Play Billing"
        RelatedModules = @("reader", "auth")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Payments|FullyQualifiedName~Application.Exports|FullyQualifiedName~Infrastructure.Exports"
            RelatedFilter = "FullyQualifiedName~Application.Chapters|FullyQualifiedName~Application.Catalog"
        }
        Frontend = @{
            DirectPaths = @("src/roles/publisher", "src/services/payment.service.ts", "src/services/export.service.test.ts")
            RelatedPaths = @("src/services/chapterPublish.service.test.ts")
        }
        Mobile = @{
            DirectFiles = @("test/google_play_billing_test.dart", "test/monetization_test.dart", "test/wallet_history_test.dart", "test/cbz_package_service_test.dart")
            RelatedFiles = @("test/paid_pages_test.dart")
        }
        DetectPatterns = @("publisher", "payment", "export", "cbz", "wallet", "monetization", "billing", "vietqr", "sepay")
    }

    "reader" = @{
        Name = "07_READER (Trình đọc truyện Web & Mobile)"
        Description = "Web reader modal, Mobile comic reader, vertical page slider, DRM protection, reading history"
        RelatedModules = @("release", "auth")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Catalog|FullyQualifiedName~Application.PreviewLinks"
            RelatedFilter = "FullyQualifiedName~Application.Chapters"
        }
        Frontend = @{
            DirectPaths = @("src/roles/reader", "src/shared/modals/ChapterReaderModal.test.tsx")
            RelatedPaths = @("src/services/previewLink.service.test.ts")
        }
        Mobile = @{
            DirectFiles = @("test/comic_reader_test.dart", "test/vertical_page_slider_test.dart", "test/paid_pages_test.dart", "test/downloads_page_test.dart", "test/reader_settings_test.dart", "test/screen_security_test.dart", "test/search_page_test.dart", "test/library_sync_test.dart")
            RelatedFiles = @("test/legal_content_test.dart", "test/language_editions_test.dart")
        }
        DetectPatterns = @("reader", "comic", "catalog", "slider", "vertical_page", "reading", "download")
    }

    "auth" = @{
        Name = "08_AUTH & ADMIN (Xác thực, Phân quyền RBAC & Quản trị)"
        Description = "Login, Register, JWT, Workspace RBAC, Users, Admin console, AI Configurations, Audit logs"
        RelatedModules = @("collaboration")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Auth|FullyQualifiedName~Application.Users|FullyQualifiedName~Application.Workspaces|FullyQualifiedName~Application.Admin|FullyQualifiedName~Application.AiConfig|FullyQualifiedName~Infrastructure.Authentication"
            RelatedFilter = "FullyQualifiedName~Domain"
        }
        Frontend = @{
            DirectPaths = @("src/roles/guest", "src/roles/admin", "src/services/auth.service.test.ts", "src/services/user.service.test.ts", "src/shared/features/account", "src/shared/features/profile")
            RelatedPaths = @("src/app/RequireWorkspaceRole.test.tsx", "src/lib/permissions.test.ts", "src/shared/modals/AuditLogModal.test.tsx")
        }
        Mobile = @{
            DirectFiles = @("test/auth_service_test.dart", "test/login_unverified_and_back_test.dart", "test/app_config_test.dart", "test/api_config_test.dart")
            RelatedFiles = @("test/infra_test.dart")
        }
        DetectPatterns = @("auth", "user", "workspace", "admin", "aiconfig", "permission", "login", "register", "token", "jwt", "account")
    }

    "collaboration" = @{
        Name = "09_COLLABORATION (Realtime SignalR & Thông báo)"
        Description = "Realtime presence, SignalR hubs, Notification center, active user broadcast"
        RelatedModules = @("assignment", "review")
        Backend = @{
            DirectFilter = "FullyQualifiedName~Application.Notifications"
            RelatedFilter = "FullyQualifiedName~Application.Assignments"
        }
        Frontend = @{
            DirectPaths = @("src/shared/features/collaboration", "src/services/notification.service.test.ts", "src/shared/views/NotificationCenterView.test.tsx")
            RelatedPaths = @("src/services/aiStream.service.test.ts")
        }
        Mobile = @{
            DirectFiles = @("test/notifications_test.dart")
            RelatedFiles = @()
        }
        DetectPatterns = @("notification", "signalr", "collaboration", "presence")
    }
}

# Alias mapping
$ModuleMatrix["admin"] = $ModuleMatrix["auth"]

if ($ListModules) {
    Write-Host "`n==========================================================================" -ForegroundColor Cyan
    Write-Host "   PANELFORGE MODULAR TEST MATRIX & IMPACT RADIUS MAP                      " -ForegroundColor Cyan
    Write-Host "==========================================================================" -ForegroundColor Cyan
    foreach ($key in @("script", "bible", "assignment", "artwork", "review", "release", "reader", "auth", "collaboration")) {
        $m = $ModuleMatrix[$key]
        Write-Host "`n[$key] - $($m.Name)" -ForegroundColor Yellow
        Write-Host "  Mô tả: $($m.Description)" -ForegroundColor Gray
        Write-Host "  Module liên quan: $($m.RelatedModules -join ', ')" -ForegroundColor White
        Write-Host "  Backend Filter : $($m.Backend.DirectFilter)" -ForegroundColor Green
        Write-Host "  Frontend Paths : $($m.Frontend.DirectPaths -join ', ')" -ForegroundColor Green
        if ($m.Mobile.DirectFiles.Count -gt 0) {
            Write-Host "  Mobile Files   : $($m.Mobile.DirectFiles -join ', ')" -ForegroundColor Green
        }
    }
    Write-Host "`n--------------------------------------------------------------------------" -ForegroundColor Gray
    exit 0
}

# Auto-detect modified module if requested
if ($AutoDetect -or [string]::IsNullOrWhiteSpace($Module)) {
    Write-Host "[*] Tự động phát hiện module được sửa đổi dựa trên git diff..." -ForegroundColor Yellow
    $allModified = @()
    foreach ($r in @($BackendRoot, $FrontendRoot, $MobileRoot)) {
        if (Test-Path $r) {
            $diffOutput = git -C $r status --porcelain 2>$null
            if ($diffOutput) {
                $allModified += ($diffOutput | ForEach-Object { ($_ -split '\s+')[-1] })
            }
        }
    }

    if ($allModified.Count -eq 0) {
        Write-Host "[-] Không phát hiện file nào thay đổi trong working tree." -ForegroundColor Gray
        if (-not $Module) {
            Write-Host "Vui lòng chỉ định rõ tên module qua tham số -Module <tên_module> (hoặc dùng -ListModules để xem danh sách)." -ForegroundColor Red
            exit 1
        }
    } else {
        $detectedModule = $null
        foreach ($f in $allModified) {
            $fLower = $f.ToLower()
            foreach ($key in @("script", "bible", "assignment", "artwork", "review", "release", "reader", "auth", "collaboration")) {
                foreach ($pat in $ModuleMatrix[$key].DetectPatterns) {
                    if ($fLower -match $pat) {
                        $detectedModule = $key
                        break
                    }
                }
                if ($detectedModule) { break }
            }
            if ($detectedModule) { break }
        }

        if ($detectedModule) {
            $Module = $detectedModule
            Write-Host "  -> Đã phát hiện module tương ứng: [$Module] ($($ModuleMatrix[$Module].Name))" -ForegroundColor Green
        } elseif (-not $Module) {
            Write-Host "[-] Không nhận diện được module tự động từ file thay đổi. Dùng -Module để chỉ định." -ForegroundColor Yellow
            exit 1
        }
    }
}

$modDef = $ModuleMatrix[$Module]
if (-not $modDef) {
    Write-Error "Module '$Module' không hợp lệ! Hãy dùng -ListModules để xem danh mục."
    exit 1
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "   PanelForge Targeted Modular Test Execution Runner                     " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "Module đích   : [$Module] - $($modDef.Name)" -ForegroundColor Yellow
Write-Host "Phạm vi chạy  : $($modDef.Description)" -ForegroundColor Gray
Write-Host "Chế độ kiểm thử: $(if ($IncludeRelated) { "Module chính + Các module liên quan ($($modDef.RelatedModules -join ', '))" } else { "CHỈ Module chính (Isolated)" })" -ForegroundColor White
Write-Host "Target repo   : $Target" -ForegroundColor White
Write-Host "--------------------------------------------------------------------------`n" -ForegroundColor Gray

# 1. Backend Test Execution
if ($Target -eq "all" -or $Target -eq "backend") {
    $beFilter = $modDef.Backend.DirectFilter
    if ($IncludeRelated -and -not [string]::IsNullOrWhiteSpace($modDef.Backend.RelatedFilter)) {
        $beFilter = "$beFilter|$($modDef.Backend.RelatedFilter)"
    }

    if (-not [string]::IsNullOrWhiteSpace($beFilter)) {
        Write-Host "[1/3] Backend .NET Unit Tests" -ForegroundColor Cyan
        $testCsProj = Join-Path $BackendRoot "test\PanelForge.UnitTests\PanelForge.UnitTests.csproj"
        $cmdBe = "dotnet test `"$testCsProj`" --filter `"$beFilter`" -v q --nologo"

        Write-Host "  Filter: $beFilter" -ForegroundColor Gray
        if ($DryRun) {
            Write-Host "  [DryRun] $cmdBe" -ForegroundColor Yellow
        } else {
            Write-Host "  Đang chạy: $cmdBe" -ForegroundColor Gray
            Invoke-Expression $cmdBe
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  [FAIL] Backend tests cho module [$Module] thất bại!" -ForegroundColor Red
            } else {
                Write-Host "  [PASS] Backend tests cho module [$Module] thành công!" -ForegroundColor Green
            }
        }
    }
}

# 2. Frontend Test Execution
if ($Target -eq "all" -or $Target -eq "frontend") {
    $fePaths = @($modDef.Frontend.DirectPaths)
    if ($IncludeRelated) {
        $fePaths += @($modDef.Frontend.RelatedPaths)
    }

    if ($fePaths.Count -gt 0) {
        Write-Host "`n[2/3] Frontend React Vitest Tests" -ForegroundColor Cyan
        $pathsArg = ($fePaths | ForEach-Object { "`"$_`"" }) -join " "
        $cmdFe = "npm --prefix `"$FrontendRoot`" run test:run -- $pathsArg"

        Write-Host "  Paths: $($fePaths -join ' ')" -ForegroundColor Gray
        if ($DryRun) {
            Write-Host "  [DryRun] $cmdFe" -ForegroundColor Yellow
        } else {
            Write-Host "  Đang chạy: $cmdFe" -ForegroundColor Gray
            Invoke-Expression $cmdFe
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  [FAIL] Frontend tests cho module [$Module] thất bại!" -ForegroundColor Red
            } else {
                Write-Host "  [PASS] Frontend tests cho module [$Module] thành công!" -ForegroundColor Green
            }
        }
    }
}

# 3. Mobile Test Execution
if ($Target -eq "all" -or $Target -eq "mobile") {
    $moFiles = @($modDef.Mobile.DirectFiles)
    if ($IncludeRelated) {
        $moFiles += @($modDef.Mobile.RelatedFiles)
    }

    if ($moFiles.Count -gt 0) {
        Write-Host "`n[3/3] Mobile Flutter Tests" -ForegroundColor Cyan
        $filesArg = ($moFiles | ForEach-Object { "`"$_`"" }) -join " "
        $cmdMo = "Push-Location `"$MobileRoot`"; flutter test $filesArg; Pop-Location"

        Write-Host "  Files: $($moFiles -join ' ')" -ForegroundColor Gray
        if ($DryRun) {
            Write-Host "  [DryRun] $cmdMo" -ForegroundColor Yellow
        } else {
            Write-Host "  Đang chạy: $cmdMo" -ForegroundColor Gray
            Invoke-Expression $cmdMo
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  [FAIL] Mobile tests cho module [$Module] thất bại!" -ForegroundColor Red
            } else {
                Write-Host "  [PASS] Mobile tests cho module [$Module] thành công!" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "`n[3/3] Mobile Flutter Tests: Không có test liên quan trực tiếp cho module [$Module]." -ForegroundColor Gray
    }
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "   Hoàn thành kiểm thử cục bộ theo module [$Module]!                     " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

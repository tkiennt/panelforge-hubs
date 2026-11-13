<#
.SYNOPSIS
    PanelForge Automated Git Worktree & Commit Orchestrator for AI Agents & Developers.
.DESCRIPTION
    Manages local Git worktrees for parallel AI Agents developing on PanelForge.
    Prevents file collisions, automates sandbox isolation, enforces Conventional Commits v1.0.0,
    and runs fast pre-commit verification gates before creating commits.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("create", "list", "remove", "pr-template", "status", "commit", "setup-hooks", "check-commit", "finish")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$AgentRole,

    [Parameter(Mandatory = $false)]
    [string]$Module,

    [Parameter(Mandatory = $false)]
    [ValidateSet("all", "backend", "frontend", "mobile")]
    [string]$Target = "all",

    [Parameter(Mandatory = $false)]
    [string]$BaseBranch = "trungkien",

    [Parameter(Mandatory = $false)]
    [string]$Message,

    [Parameter(Mandatory = $false)]
    [string]$Body,

    [Parameter(Mandatory = $false)]
    [switch]$SkipTest,

    [Parameter(Mandatory = $false)]
    [switch]$Push
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Script nam trong panelforge-hub/.agents/scripts; cac repo code nam canh panelforge-hub.
$HubRoot = (Resolve-Path "$ScriptDir\..\..").Path
$WorkspaceRoot = (Resolve-Path "$HubRoot\..").Path
$BackendRoot = Join-Path $WorkspaceRoot "PanelForge_FA26SE251"
$FrontendRoot = Join-Path $WorkspaceRoot "panelforge-fe"
$MobileRoot = Join-Path $WorkspaceRoot "panelforge-mobile"
$WorktreeBaseDir = $WorkspaceRoot
$HookSource = Join-Path $HubRoot ".agents\hooks\commit-msg"
$CommitTemplateRel = "../Note/.gitmessage.txt"

function Show-Header {
    Write-Host "`n=================================================================" -ForegroundColor Cyan
    Write-Host "   PanelForge AI Agent Worktree & Commit Orchestration System    " -ForegroundColor Cyan
    Write-Host "=================================================================`n" -ForegroundColor Cyan
}

function Validate-CommitMessageFormat {
    param ([string]$Msg)

    if ([string]::IsNullOrWhiteSpace($Msg)) {
        Write-Error "Loi: Commit message khong duoc de trong!"
        return $false
    }

    $Msg = $Msg.Trim()
    if ($Msg.Length -gt 72) {
        Write-Error "Loi: Tieu de commit vuot qua 72 ky tu (Hien tai: $($Msg.Length) ky tu). Message: $Msg"
        return $false
    }

    if ($Msg.EndsWith(".")) {
        Write-Error "Loi: Tieu de commit KHONG duoc ket thuc bang dau cham ('.'). Message: $Msg"
        return $false
    }

    $Pattern = "^(feat|fix|docs|style|refactor|perf|test|chore)(\([a-zA-Z0-9_.-]+\))?: [a-z0-9].+"
    if (-not ($Msg -match $Pattern)) {
        Write-Host "Loi: Commit message khong dung quy chuan Conventional Commits v1.0.0!" -ForegroundColor Red
        Write-Host "----------------------------------------------------------------------" -ForegroundColor Yellow
        Write-Host "   Tin nhan hien tai: $Msg" -ForegroundColor White
        Write-Host '   Dinh dang chuan  : <type>(<scope>): <mo ta dang menh lenh viet thuong>' -ForegroundColor Green
        Write-Host "   Type hop le      : feat | fix | docs | style | refactor | perf | test | chore" -ForegroundColor Gray
        Write-Host "   Vi du mau        : feat(script): add chapter dialogue freeze validation rule" -ForegroundColor Cyan
        Write-Host "----------------------------------------------------------------------" -ForegroundColor Yellow
        return $false
    }

    return $true
}

function Resolve-BaseBranch {
    param ([string]$RepoPath, [string]$Preferred)
    $branchCheck = git -C $RepoPath branch --list $Preferred
    if (-not [string]::IsNullOrWhiteSpace($branchCheck)) {
        return $Preferred
    }
    return "main"
}

function List-Worktrees {
    Write-Host "[*] Backend Worktrees (PanelForge_FA26SE251):" -ForegroundColor Green
    git -C $BackendRoot worktree list

    Write-Host "`n[*] Frontend Worktrees (panelforge-fe):" -ForegroundColor Green
    git -C $FrontendRoot worktree list

    Write-Host "`n[*] Mobile Worktrees (panelforge-mobile):" -ForegroundColor Green
    git -C $MobileRoot worktree list
}

function Setup-GitHooks {
    Write-Host "[+] Dang cau hinh Git Hooks va Commit Template cho 3 repositories..." -ForegroundColor Yellow

    if (-not (Test-Path $HookSource)) {
        Write-Error "Khong tim thay tep hook tai: $HookSource"
    }

    $repos = @(
        @{ Name = "Backend"; Root = $BackendRoot },
        @{ Name = "Frontend"; Root = $FrontendRoot },
        @{ Name = "Mobile"; Root = $MobileRoot }
    )

    foreach ($r in $repos) {
        $hookTargetDir = Join-Path $r.Root ".git\hooks"
        if (Test-Path $hookTargetDir) {
            $destHook = Join-Path $hookTargetDir "commit-msg"
            Copy-Item -Path $HookSource -Destination $destHook -Force
            Write-Host "  [OK] Cai dat commit-msg hook cho $($r.Name) ($destHook)" -ForegroundColor Green
        }

        # Set commit.template
        git -C $r.Root config commit.template $CommitTemplateRel
        Write-Host "  [OK] Thiet lap commit.template cho $($r.Name)" -ForegroundColor Green
    }

    Write-Host "`n[SUCCESS] Toan bo repository da duoc bao ve boi Conventional Commits Hook!" -ForegroundColor Green
}

function Create-AgentWorktree {
    if (-not $AgentRole) {
        Write-Error "Vui long truyen tham so -AgentRole (vi du: script, kanban, artist, auth, mobile, review)."
    }
    if (-not $Module) {
        $Module = $AgentRole
    }

    $SandboxDir = Join-Path $WorktreeBaseDir "panelforge-agent-$AgentRole"

    Write-Host "[+] Khoi tao Sandbox co lap cho AI Agent: $AgentRole" -ForegroundColor Yellow
    Write-Host "    - Thu muc sandbox: $SandboxDir" -ForegroundColor Gray
    Write-Host "    - Module muc tieu:  $Module" -ForegroundColor Gray
    Write-Host "    - Target scope:     $Target" -ForegroundColor Gray

    $required = @()
    if ($Target -eq "all" -or $Target -eq "backend") { $required += $BackendRoot }
    if ($Target -eq "all" -or $Target -eq "frontend") { $required += $FrontendRoot }
    if ($Target -eq "all" -or $Target -eq "mobile") { $required += $MobileRoot }
    foreach ($repoRoot in $required) {
        if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
            throw "Khong tim thay repo tai: $repoRoot"
        }
    }

    if (-not (Test-Path $SandboxDir)) {
        New-Item -ItemType Directory -Path $SandboxDir -Force | Out-Null
    }

    # Setup Backend Worktree
    if ($Target -eq "all" -or $Target -eq "backend") {
        $BackendWorktree = Join-Path $SandboxDir "PanelForge_FA26SE251"
        $beBranch = "feature/$Module-be"
        $actualBase = Resolve-BaseBranch -RepoPath $BackendRoot -Preferred $BaseBranch

        if (Test-Path $BackendWorktree) {
            Write-Host "[-] Backend worktree da ton tai tai: $BackendWorktree" -ForegroundColor Yellow
        } else {
            Write-Host "[+] Creating Backend worktree: $beBranch (from $actualBase)..." -ForegroundColor Cyan
            $existingBranch = git -C $BackendRoot branch --list $beBranch
            if (-not [string]::IsNullOrWhiteSpace($existingBranch)) {
                git -C $BackendRoot worktree add $BackendWorktree $beBranch
            } else {
                git -C $BackendRoot worktree add $BackendWorktree -b $beBranch $actualBase
            }
            Write-Host "[OK] Backend worktree san sang tai: $BackendWorktree" -ForegroundColor Green
        }
    }

    # Setup Frontend Worktree
    if ($Target -eq "all" -or $Target -eq "frontend") {
        $FrontendWorktree = Join-Path $SandboxDir "panelforge-fe"
        $feBranch = "feature/$Module-fe"
        $actualBase = Resolve-BaseBranch -RepoPath $FrontendRoot -Preferred $BaseBranch

        if (Test-Path $FrontendWorktree) {
            Write-Host "[-] Frontend worktree da ton tai tai: $FrontendWorktree" -ForegroundColor Yellow
        } else {
            Write-Host "[+] Creating Frontend worktree: $feBranch (from $actualBase)..." -ForegroundColor Cyan
            $existingBranch = git -C $FrontendRoot branch --list $feBranch
            if (-not [string]::IsNullOrWhiteSpace($existingBranch)) {
                git -C $FrontendRoot worktree add $FrontendWorktree $feBranch
            } else {
                git -C $FrontendRoot worktree add $FrontendWorktree -b $feBranch $actualBase
            }
            Write-Host "[OK] Frontend worktree san sang tai: $FrontendWorktree" -ForegroundColor Green
        }
    }

    # Setup Mobile Worktree
    if ($Target -eq "all" -or $Target -eq "mobile") {
        $MobileWorktree = Join-Path $SandboxDir "panelforge-mobile"
        $mobileBranch = "feature/$Module-mobile"
        $actualBase = Resolve-BaseBranch -RepoPath $MobileRoot -Preferred $BaseBranch

        if (Test-Path $MobileWorktree) {
            Write-Host "[-] Mobile worktree da ton tai tai: $MobileWorktree" -ForegroundColor Yellow
        } else {
            Write-Host "[+] Creating Mobile worktree: $mobileBranch (from $actualBase)..." -ForegroundColor Cyan
            $existingBranch = git -C $MobileRoot branch --list $mobileBranch
            if (-not [string]::IsNullOrWhiteSpace($existingBranch)) {
                git -C $MobileRoot worktree add $MobileWorktree $mobileBranch
            } else {
                git -C $MobileRoot worktree add $MobileWorktree -b $mobileBranch $actualBase
            }
            Write-Host "[OK] Mobile worktree san sang tai: $MobileWorktree" -ForegroundColor Green
        }
    }

    # Junction .agents folder into sandbox for AI agent context routing
    $sandboxAgents = Join-Path $SandboxDir ".agents"
    $sourceAgents = Join-Path $HubRoot ".agents"
    if (-not (Test-Path $sandboxAgents) -and (Test-Path $sourceAgents)) {
        cmd /c mklink /J "$sandboxAgents" "$sourceAgents" 2>$null | Out-Null
    }

    # Junction note folder into sandbox so agents can access module plans & master plan
    $sandboxNote = Join-Path $SandboxDir "note"
    $sourceNote = Join-Path $HubRoot "docs\note"
    if (-not (Test-Path $sandboxNote) -and (Test-Path $sourceNote)) {
        cmd /c mklink /J "$sandboxNote" "$sourceNote" 2>$null | Out-Null
    }

    # If frontend worktree was not created, junction the source frontend repo for specs & workboard reading
    $sandboxFrontend = Join-Path $SandboxDir "panelforge-fe"
    if (-not (Test-Path $sandboxFrontend) -and (Test-Path $FrontendRoot)) {
        cmd /c mklink /J "$sandboxFrontend" "$FrontendRoot" 2>$null | Out-Null
    }

    Write-Host "`n[SUCCESS] Sandbox da san sang cho Agent '$AgentRole'!" -ForegroundColor Green
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "QUY TAC DUONG DAN DANH CHO AI AGENT (PATH TRANSLATION):" -ForegroundColor Yellow
    Write-Host "  - Backend  : $SandboxDir\PanelForge_FA26SE251" -ForegroundColor White
    Write-Host "  - Frontend : $SandboxDir\panelforge-fe" -ForegroundColor White
    Write-Host "  - Mobile   : $SandboxDir\panelforge-mobile" -ForegroundColor White
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
}

function Remove-AgentWorktree {
    if (-not $AgentRole) {
        Write-Error "Vui long truyen tham so -AgentRole can xoa (vi du: script, kanban)."
    }

    $SandboxDir = Join-Path $WorktreeBaseDir "panelforge-agent-$AgentRole"
    $BackendWorktree = Join-Path $SandboxDir "PanelForge_FA26SE251"
    $FrontendWorktree = Join-Path $SandboxDir "panelforge-fe"
    $MobileWorktree = Join-Path $SandboxDir "panelforge-mobile"

    Write-Host "[-] Tien hanh thu hoi va don dep worktree cho Agent: $AgentRole" -ForegroundColor Yellow

    if (Test-Path $BackendWorktree) {
        $item = Get-Item -LiteralPath $BackendWorktree -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $item.Delete()
        } else {
            Write-Host "  - Removing Backend worktree..." -ForegroundColor Gray
            git -C $BackendRoot worktree remove --force $BackendWorktree 2>$null
        }
    }
    if (Test-Path $FrontendWorktree) {
        $item = Get-Item -LiteralPath $FrontendWorktree -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $item.Delete()
        } else {
            Write-Host "  - Removing Frontend worktree..." -ForegroundColor Gray
            git -C $FrontendRoot worktree remove --force $FrontendWorktree 2>$null
        }
    }
    if (Test-Path $MobileWorktree) {
        $item = Get-Item -LiteralPath $MobileWorktree -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $item.Delete()
        } else {
            Write-Host "  - Removing Mobile worktree..." -ForegroundColor Gray
            git -C $MobileRoot worktree remove --force $MobileWorktree 2>$null
        }
    }

    git -C $BackendRoot worktree prune
    git -C $FrontendRoot worktree prune
    git -C $MobileRoot worktree prune

    if (Test-Path $SandboxDir) {
        # Sandbox chứa junction .agents trỏ về thư mục thật của workspace. Remove-Item -Recurse trên
        # Windows PowerShell 5.1 có thể xoá xuyên qua junction, nên gỡ mọi liên kết (chỉ xoá link) trước.
        # Chỉ quét 2 cấp (sandbox và thư mục repo), không đi vào bên trong một liên kết.
        $levels = @(Get-Item -LiteralPath $SandboxDir -Force) + @(Get-ChildItem -LiteralPath $SandboxDir -Directory -Force -ErrorAction SilentlyContinue |
            Where-Object { -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) })
        foreach ($dir in $levels) {
            Get-ChildItem -LiteralPath $dir.FullName -Force -ErrorAction SilentlyContinue |
                Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint } |
                ForEach-Object { $_.Delete() }
        }
        Remove-Item -Path $SandboxDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[OK] Da don dep toan bo sandbox va prune worktree!" -ForegroundColor Green
}

function Execute-CommitInWorktree {
    if (-not $AgentRole) {
        Write-Error "Vui long truyen tham so -AgentRole chua worktree can commit."
    }
    if (-not $Message) {
        Write-Error "Vui long truyen tham so -Message (dinh dang Conventional Commits)."
    }

    if (-not (Validate-CommitMessageFormat -Msg $Message)) {
        exit 1
    }

    $SandboxDir = Join-Path $WorktreeBaseDir "panelforge-agent-$AgentRole"
    if (-not (Test-Path $SandboxDir)) {
        Write-Error "Khong tim thay thu muc sandbox: $SandboxDir. Hay chay create truoc."
    }

    $targets = @()
    if ($Target -eq "all" -or $Target -eq "backend") {
        $targets += @{ Name = "backend"; Path = (Join-Path $SandboxDir "PanelForge_FA26SE251") }
    }
    if ($Target -eq "all" -or $Target -eq "frontend") {
        $targets += @{ Name = "frontend"; Path = (Join-Path $SandboxDir "panelforge-fe") }
    }
    if ($Target -eq "all" -or $Target -eq "mobile") {
        $targets += @{ Name = "mobile"; Path = (Join-Path $SandboxDir "panelforge-mobile") }
    }

    foreach ($t in $targets) {
        if (-not (Test-Path $t.Path)) { continue }

        $status = git -C $t.Path status --porcelain
        if ([string]::IsNullOrWhiteSpace($status)) {
            Write-Host "[-] $($t.Name) khong co file thay doi, bo qua commit." -ForegroundColor Gray
            continue
        }

        Write-Host "`n[*] Dang thuc hien commit cho $($t.Name) tai: $($t.Path)" -ForegroundColor Cyan

        # Fast pre-commit check
        if (-not $SkipTest) {
            Write-Host "[+] Dang chay Fast Pre-commit Verification..." -ForegroundColor Yellow
            if ($t.Name -eq "backend") {
                $slnxPath = Join-Path $t.Path "PanelForge.slnx"
                Write-Host "    Chay: dotnet build $slnxPath" -ForegroundColor Gray
                dotnet build $slnxPath -v q --nologo
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Fast Build Backend that bai! Hay sua loi truoc khi commit."
                }
            } elseif ($t.Name -eq "frontend") {
                Write-Host "    Chay: npm run typecheck" -ForegroundColor Gray
                npm --prefix $t.Path run typecheck
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "TypeScript Typecheck Frontend that bai! Hay sua loi truoc khi commit."
                }
            } elseif ($t.Name -eq "mobile") {
                Write-Host "    Chay: flutter analyze" -ForegroundColor Gray
                flutter --prefix $t.Path analyze
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Flutter Analyze that bai! Hay sua loi truoc khi commit."
                }
            }
            Write-Host "    [OK] Pre-commit check passed!" -ForegroundColor Green
        }

        # Stage and commit
        git -C $t.Path add -A
        if ($Body) {
            git -C $t.Path commit -m $Message -m $Body
        } else {
            git -C $t.Path commit -m $Message
        }

        if ($LASTEXITCODE -eq 0) {
            $hash = git -C $t.Path log -1 --format="%h"
            $branch = git -C $t.Path branch --show-current
            Write-Host "[SUCCESS] Commit thanh cong [$hash] tren nhanh [$branch]!" -ForegroundColor Green
        } else {
            Write-Error "Commit that bai!"
        }
    }
}

function Generate-PRTemplate {
    if (-not $Module) { $Module = "module-name" }
    if (-not $AgentRole) { $AgentRole = "agent-role" }

    $Template = @"
## Pull Request: feat($Module): Implementation by Agent $AgentRole

### 1. Summary of Changes
- [Add concise summary of features/fixes implemented in this branch]
- [Layer-specific details: Domain / Application CQRS / Frontend UI]

### 2. Verification & Test Status
- [x] Backend Tests: `dotnet test` passed (100%)
- [x] Frontend Typecheck & Tests: `npm run typecheck`, `npx vitest run` passed
- [x] Clean Architecture boundary & Zero-trust RBAC validated

### 3. Linked Task / Issue Reference
- Resolves #IssueNumber
- Agent Role: $AgentRole
- Target Branch: $BaseBranch
"@

    Write-Host "`n--- PR DESCRIPTION TEMPLATE ---" -ForegroundColor Cyan
    Write-Host $Template -ForegroundColor White
    Write-Host "-------------------------------`n" -ForegroundColor Cyan
}

function Finish-Worktree {
    if (-not $AgentRole) {
        Write-Error "Vui long truyen tham so -AgentRole (vi du: script, kanban, artist, auth, mobile, review)."
    }

    $SandboxDir = Join-Path $WorktreeBaseDir "panelforge-agent-$AgentRole"
    if (-not (Test-Path $SandboxDir)) {
        Write-Error "Khong tim thay sandbox tai: $SandboxDir"
    }

    $targets = @()
    if ($Target -eq "all" -or $Target -eq "backend") {
        $targets += @{ Name = "backend"; Root = $BackendRoot; Sandbox = (Join-Path $SandboxDir "PanelForge_FA26SE251") }
    }
    if ($Target -eq "all" -or $Target -eq "frontend") {
        $targets += @{ Name = "frontend"; Root = $FrontendRoot; Sandbox = (Join-Path $SandboxDir "panelforge-fe") }
    }
    if ($Target -eq "all" -or $Target -eq "mobile") {
        $targets += @{ Name = "mobile"; Root = $MobileRoot; Sandbox = (Join-Path $SandboxDir "panelforge-mobile") }
    }

    foreach ($t in $targets) {
        if (-not (Test-Path $t.Sandbox)) { continue }

        $featureBranch = (git -C $t.Sandbox branch --show-current).Trim()
        if ([string]::IsNullOrWhiteSpace($featureBranch) -or $featureBranch -eq "trungkien" -or $featureBranch -eq "main") {
            Write-Host "[-] $($t.Name): Sandbox dang o nhanh '$featureBranch', khong phai feature branch. Bo qua merge." -ForegroundColor Yellow
            continue
        }

        # Check for uncommitted changes in sandbox
        $uncommitted = git -C $t.Sandbox status -s
        if ($uncommitted) {
            Write-Host "[!] $($t.Name) sandbox co file chua commit! Tien hanh commit truoc khi merge..." -ForegroundColor Yellow
            if (-not $Message) {
                Write-Error "Vui long truyen -Message de commit cac file thay doi truoc khi finish."
            }
            git -C $t.Sandbox add -A
            git -C $t.Sandbox commit -m $Message
        }

        Write-Host "`n[*] Giai doan gop: $($t.Name) -> Merge '$featureBranch' vao 'trungkien'..." -ForegroundColor Cyan

        # 1. Checkout trungkien at root
        git -C $t.Root checkout trungkien 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Chua co nhanh trungkien cuc bo tai $($t.Name), tao tu origin/trungkien..." -ForegroundColor Gray
            git -C $t.Root checkout -b trungkien origin/trungkien 2>$null
        }

        # 2. Pull latest from remote
        Write-Host "  Dang pull code moi nhat tu origin/trungkien..." -ForegroundColor Gray
        git -C $t.Root pull origin trungkien --ff-only 2>$null

        # 3. Merge feature branch into trungkien
        $mergeMsg = if ($Message) { $Message } else { "feat($AgentRole): merge $featureBranch into trungkien" }
        Write-Host "  Dang merge '$featureBranch' vao 'trungkien'..." -ForegroundColor Gray
        git -C $t.Root merge $featureBranch -m $mergeMsg
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Merge that bai do conflict tai $($t.Name)! Hay resolve conflict bang tay tren nhanh trungkien."
        }

        # 4. Push only trungkien to remote (Chi push khi hoan thanh module lon hoac co switch -Push)
        if ($Push) {
            Write-Host "  Dang push duy nhat nhanh 'trungkien' len remote origin..." -ForegroundColor Yellow
            git -C $t.Root push origin trungkien
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] Push thanh cong len origin/trungkien!" -ForegroundColor Green
            } else {
                Write-Error "Push len origin/trungkien that bai!"
            }
        } else {
            Write-Host "  [INFO] Bo qua push remote theo quy tac (Chi push khi hoan thanh module lon hoac khi user yeu cau/them switch -Push)." -ForegroundColor Cyan
        }
        # Delete local feature branch
        git -C $t.Root branch -d $featureBranch 2>$null
    }

    # 5. Clean up sandbox worktree
    Write-Host "`n[*] Tien hanh thu hoi va don dep Sandbox Worktree..." -ForegroundColor Cyan
    Remove-AgentWorktree
    Write-Host "[SUCCESS] Hoan tat quy trinh: Code da duoc merge vao trungkien cuc bo va thu hoi worktree sach se!" -ForegroundColor Green
}

Show-Header

switch ($Action) {
    "list"         { List-Worktrees }
    "status"       { List-Worktrees }
    "create"       { Create-AgentWorktree }
    "remove"       { Remove-AgentWorktree }
    "setup-hooks"  { Setup-GitHooks }
    "commit"       { Execute-CommitInWorktree }
    "check-commit" { 
        if (Validate-CommitMessageFormat -Msg $Message) {
            Write-Host "[OK] Commit message hop le theo Conventional Commits v1.0.0!" -ForegroundColor Green
        } else {
            exit 1
        }
    }
    "pr-template"  { Generate-PRTemplate }
    "finish"       { Finish-Worktree }
}

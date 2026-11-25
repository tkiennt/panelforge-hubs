<#
.SYNOPSIS
    Doc / ghi nhanh lam viec (work branch) cua may hien tai cho cac repo code PanelForge.
.DESCRIPTION
    Moi nguoi code push len mot nhanh khac nhau. Nhanh duoc luu trong .git/config cua tung repo
    (khoa `panelforge.workBranch`), chi ton tai tren may nay va khong bao gio bi commit.
    Agent doc gia tri nay o dau phien; neu chua co thi hoi nguoi dung roi chay -Action set.
    Tuyet doi CAM chon cac nhanh protected (main, master, stg, staging, dev) lam work branch.
.EXAMPLE
    powershell -File .agents/scripts/work_branch.ps1 -Action get
    powershell -File .agents/scripts/work_branch.ps1 -Action set -Branch trungkien
    powershell -File .agents/scripts/work_branch.ps1 -Action set -Branch THBMinh -Repos panelforge-fe
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("get", "set", "unset")]
    [string]$Action,

    [string]$Branch,

    [string[]]$Repos = @("PanelForge_FA26SE251", "panelforge-fe", "panelforge-mobile")
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$ConfigKey = "panelforge.workBranch"
$ProtectedBranches = @("main", "master", "stg", "staging", "dev")

if ($Action -eq "set" -and [string]::IsNullOrWhiteSpace($Branch)) {
    throw "Thieu -Branch. Vi du: -Action set -Branch trungkien"
}
if ($Action -eq "set") {
    git check-ref-format --branch $Branch *> $null
    if ($LASTEXITCODE -ne 0) { throw "Ten nhanh khong hop le: $Branch" }
    
    $cleanBranch = $Branch.Trim().ToLower()
    if ($ProtectedBranches -contains $cleanBranch -or $cleanBranch -like "release/*") {
        throw "VI PHAM QUY TAC: Khong duoc phep chon nhanh protected '$Branch' lam nhanh lam viec ca nhan! Hay chon nhanh ca nhan (vd: trungkien, THBMinh, Danh, feature/...). Cac nhanh protected (dev, stg, main) chi duoc phep cap nhat thong qua promotion/merge co kiem dinh."
    }
}

$rows = foreach ($name in $Repos) {
    $path = Join-Path $WorkspaceRoot $name
    if (-not (Test-Path (Join-Path $path ".git"))) { continue }

    switch ($Action) {
        "set"   { git -C $path config --local $ConfigKey $Branch }
        "unset" { git -C $path config --local --unset $ConfigKey 2>$null }
    }

    $configured = (git -C $path config --local --get $ConfigKey) 2>$null
    $current = (git -C $path branch --show-current).Trim()
    $existsLocal = [bool](git -C $path branch --list $configured 2>$null)
    $isProtected = $ProtectedBranches -contains $current.ToLower()

    [pscustomobject]@{
        Repo        = $name
        WorkBranch  = if ($configured) { $configured } else { "(chua chon)" }
        Current     = $current
        Status      = if ($isProtected) { "⚠️ PROTECTED!" } elseif (-not $configured) { "CHUA CHON" } elseif ($configured -eq $current) { "OK" } else { "KHAC" }
        LocalRef    = if (-not $configured) { "-" } elseif ($existsLocal) { "co" } else { "chua co" }
    }
}

$rows | Format-Table -AutoSize

# Canh bao do neu dang dung tren nhanh protected
$protectedAlerts = $rows | Where-Object { $_.Status -like "*PROTECTED*" }
if ($protectedAlerts) {
    Write-Host "`n🚨 [CANH BAO NGUY HIEM CHO AI AGENT & DEVELOPER]:" -ForegroundColor Red
    foreach ($alert in $protectedAlerts) {
        Write-Host "   - Repo '$($alert.Repo)' dang dung truc tiep tren nhanh PROTECTED: '$($alert.Current)'!" -ForegroundColor Yellow
        Write-Host "     -> TUYET DOI CAM commit hoac sua code truc tiep tai day de tranh lam hong he thong!" -ForegroundColor Red
        if ($alert.WorkBranch -ne "(chua chon)") {
            Write-Host "     -> Hay chuyen ngay ve nhanh lam viec: git -C $($alert.Repo) checkout $($alert.WorkBranch)" -ForegroundColor Cyan
        }
    }
    Write-Host ""
}

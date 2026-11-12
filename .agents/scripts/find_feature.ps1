param(
    [Parameter(Mandatory=$false)]
    [string]$Feature = ""
)

$indexPath = Join-Path $PSScriptRoot "..\CODEBASE_INDEX.json"
if (-not (Test-Path $indexPath)) {
    Write-Error "Could not find CODEBASE_INDEX.json at $indexPath"
    exit 1
}

$rawJson = Get-Content -Path $indexPath -Raw | ConvertFrom-Json
$domains = $rawJson.domains

if ([string]::IsNullOrWhiteSpace($Feature)) {
    Write-Host "================ PANELFORGE AVAILABLE DOMAINS ================" -ForegroundColor Cyan
    foreach ($property in $domains.PSObject.Properties) {
        $key = $property.Name
        $desc = $property.Value.description
        Write-Host "• $key : $desc" -ForegroundColor Yellow
    }
    Write-Host "`nUsage: powershell -File .agents/scripts/find_feature.ps1 -Feature <keyword>" -ForegroundColor Gray
    exit 0
}

$matched = @()
foreach ($property in $domains.PSObject.Properties) {
    $key = $property.Name
    $val = $property.Value
    if ($key -like "*$Feature*" -or $val.description -like "*$Feature*" -or ($val.endpoints -join " ") -like "*$Feature*") {
        $matched += @{
            Domain = $key
            Details = $val
        }
    }
}

if ($matched.Count -eq 0) {
    Write-Warning "No domain matching '$Feature' found in CODEBASE_INDEX.json"
    Write-Host "Try keywords like: auth, workspace, series, chapter, bible, script, canvas, review, catalog, wallet, export" -ForegroundColor Gray
    exit 0
}

foreach ($m in $matched) {
    Write-Host "`n================ DOMAIN: $($m.Domain.ToUpper()) ================" -ForegroundColor Green
    Write-Host "Description: $($m.Details.description)" -ForegroundColor White
    if ($m.Details.endpoints) {
        Write-Host "Endpoints:   $($m.Details.endpoints -join ', ')" -ForegroundColor Cyan
    }
    
    if ($m.Details.backend) {
        Write-Host "`n[BACKEND]" -ForegroundColor Magenta
        Write-Host "  Controller : $($m.Details.backend.controller)"
        Write-Host "  CQRS Folder: $($m.Details.backend.cqrs_folder)"
        if ($m.Details.backend.entities) {
            Write-Host "  Entities   : $($m.Details.backend.entities -join ', ')"
        }
    }

    if ($m.Details.frontend) {
        Write-Host "`n[FRONTEND WEB]" -ForegroundColor Blue
        if ($m.Details.frontend.services) {
            Write-Host "  Services   : $($m.Details.frontend.services -join ', ')"
        }
        if ($m.Details.frontend.views) {
            Write-Host "  Views      : $($m.Details.frontend.views -join ', ')"
        }
    }

    if ($m.Details.mobile) {
        Write-Host "`n[MOBILE APP]" -ForegroundColor Yellow
        if ($m.Details.mobile.services) {
            Write-Host "  Services   : $($m.Details.mobile.services -join ', ')"
        }
        if ($m.Details.mobile.screens) {
            Write-Host "  Screens    : $($m.Details.mobile.screens -join ', ')"
        }
        if ($m.Details.mobile.widgets) {
            Write-Host "  Widgets    : $($m.Details.mobile.widgets -join ', ')"
        }
    }
    Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
}

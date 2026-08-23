# setup.ps1 — Harness Setup
# Usage: .\scripts\setup.ps1 [-Interactive]
#
# Configures subagent models. File-driven (reads .opencode/harness.settings.jsonc
# and applies) or interactive (TUI to assign models per role).
#
# Modes:
#   - File-driven (default): reads harness.settings.jsonc and applies it.
#   - Interactive (-Interactive): full-screen TUI to assign a model per role,
#     detecting available providers via `opencode models`.

param(
    [switch]$File = $false
)

$ErrorActionPreference = "Stop"
$ProjectRoot  = Split-Path $PSScriptRoot -Parent
$AgentsDir    = Join-Path $ProjectRoot ".opencode\agents"
$SettingsFile = Join-Path $ProjectRoot ".opencode\harness.settings.jsonc"

function Write-Info { Write-Host "[HARNESS]" -NoNewline -ForegroundColor Cyan; Write-Host " $args" }
function Write-Ok   { Write-Host "[OK]" -NoNewline -ForegroundColor Green;  Write-Host " $args" }
function Write-Err  { Write-Host "[ERROR]" -NoNewline -ForegroundColor Red; Write-Host " $args" }

# ─────────────────────────────────────────────────────────────────────────────
# Parsing helpers — JSONC (comments + trailing commas) → object
# ─────────────────────────────────────────────────────────────────────────────
function ConvertFrom-JsonC {
    param([string]$Content)
    $sb = New-Object System.Text.StringBuilder
    $inString = $false
    for ($i = 0; $i -lt $Content.Length; $i++) {
        $c = $Content[$i]
        if ($inString) {
            [void]$sb.Append($c)
            if ($c -eq '"' -and $Content[$i-1] -ne '\') { $inString = $false }
            continue
        }
        if ($c -eq '"') { $inString = $true; [void]$sb.Append($c); continue }
        if ($c -eq '/' -and $i -lt $Content.Length - 1 -and $Content[$i+1] -eq '/') {
            while ($i -lt $Content.Length -and $Content[$i] -ne "`n") { $i++ }
            continue
        }
        [void]$sb.Append($c)
    }
    $clean = $sb.ToString()
    $clean = [regex]::Replace($clean, ',\s*([}\]])(?=)', '$1')
    return ($clean | ConvertFrom-Json)
}

# Ordered list of roles to configure (subagents + helper agents).
function Get-RoleDefaults {
    return [ordered]@{
        "spec-writer"        = $null
        "frontend-developer" = $null
        "backend-developer"  = $null
        "code-reviewer"      = $null
        "gdpr-auditor"       = $null
        "release-manager"    = $null
        "design"             = $null
    }
}

# Detect available models: `opencode models`, grouped by provider.
# Returns ordered map provider -> array of model-id suffixes.
function Get-AvailableModels {
    try {
        $raw = @(opencode models 2>&1)
    } catch {
        Write-Err "Could not run `opencode models`: $($_.Exception.Message)"
        return $null
    }
    $providers = [ordered]@{}
    foreach ($line in $raw) {
        $trim = ($line -as [string]).Trim()
        if ([string]::IsNullOrWhiteSpace($trim)) { continue }
        $slash = $trim.IndexOf('/')
        if ($slash -le 0) { continue }
        $prov = $trim.Substring(0, $slash)
        $name = $trim.Substring($slash + 1)
        if (-not $providers.Contains($prov)) { $providers[$prov] = @() }
        if ($name) { $providers[$prov] = @($providers[$prov]) + $name }
    }
    return ,$providers
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive TUI
# ─────────────────────────────────────────────────────────────────────────────
# Full-screen list of roles (left) and the assigned model (right). Arrow keys
# navigate; Enter opens the model picker for the highlighted row; within the
# picker, arrows move and Enter confirms, Esc/left cancels; Q/Esc exits.
# Returns an array of @{ name; model } (model may be $null to inherit primary).
function Invoke-HarnessTui {
    param([string[]]$Roles, $Providers, [hashtable]$Preset)

    if (-not $Providers -or $Providers.Count -eq 0) {
        Write-Err "No models detected. Run `opencode models` first."
        return @($Roles | ForEach-Object { [pscustomobject]@{ name = $_; model = $null } })
    }

    # Flat, sorted list of every "provider/model".
    $allModels = @()
    foreach ($prov in @($Providers.Keys | Sort-Object)) {
        foreach ($name in @($Providers[$prov])) { $allModels += "$prov/$name" }
    }

    # State per role: index into $allModels (or -1 for none) + mode (null|primary|subagent|all).
    # Preset pre-loads the current model and mode from harness.settings.jsonc.
    $rows = @()
    foreach ($r in $Roles) {
        $idx = -1
        $mode = $null
        if ($Preset) {
            if ($Preset[$r] -is [System.Collections.IDictionary]) {
                $hit = [Array]::IndexOf($allModels, $Preset[$r].model)
                if ($hit -ge 0) { $idx = $hit }
                if ($Preset[$r].mode) { $mode = $Preset[$r].mode }
            } else {
                $hit = [Array]::IndexOf($allModels, $Preset[$r])
                if ($hit -ge 0) { $idx = $hit }
            }
        }
        $rows += [pscustomobject]@{ name = $r; idx = $idx; mode = $mode }
    }

    $cursor  = 0
    $running = $true

    try { [Console]::CursorVisible = $false } catch {}

    try {
        while ($running) {

            # -- Draw main list --
            Clear-Host
            Write-Host "HARNESS SETUP - assign model + mode to each agent" -ForegroundColor Cyan
            Write-Host "UP/DOWN: move     ENTER: pick model     M: cycle mode     Q/ESC: finish" -ForegroundColor DarkGray
            Write-Host ""
            for ($i = 0; $i -lt $rows.Count; $i++) {
                $modelVal = if ($rows[$i].idx -ge 0) { $allModels[$rows[$i].idx] } else { "(inherit)" }
                $modeVal  = if ($rows[$i].mode) { $rows[$i].mode } else { "-" }
                $mark = if ($i -eq $cursor) { '>' } else { ' ' }
                $line = ("{0} {1,-24} model:{2,-24} mode:{3}" -f $mark, $rows[$i].name, $modelVal, $modeVal)
                if ($i -eq $cursor) { Write-Host $line -ForegroundColor Black -BackgroundColor White }
                else { Write-Host $line }
            }
            Write-Host ""
            Write-Host "M cycles: (none) -> primary -> subagent -> all -> (none). Empty mode = leaves the file's mode." -ForegroundColor DarkGray

            # -- Read a key --
            $key = [Console]::ReadKey($true)
            switch ($key.Key) {
                'UpArrow'   { if ($cursor -gt 0) { $cursor-- } }
                'DownArrow' { if ($cursor -lt $rows.Count - 1) { $cursor++ } }
                'Enter'     {
                    $picked = Show-ModelPicker -All $allModels -Initial $rows[$cursor].idx -Role $rows[$cursor].name
                    if ($picked -ne -2) { $rows[$cursor].idx = $picked }  # -2 means cancelled (keep previous)
                }
                'M' {
                    $cycle = @($null, 'primary', 'subagent', 'all')
                    $cur = [Array]::IndexOf($cycle, $rows[$cursor].mode)
                    $next = if ($cur -lt 0 -or $cur -eq $cycle.Count - 1) { 0 } else { $cur + 1 }
                    $rows[$cursor].mode = $cycle[$next]
                }
                'Q'         { $running = $false }
                'Escape'    { $running = $false }
            }
        }
    } finally {
        try { [Console]::CursorVisible = $true } catch {}
    }

    return @($rows | ForEach-Object {
        $model = if ($_.idx -ge 0) { $allModels[$_.idx] } else { $null }
        [pscustomobject]@{ name = $_.name; model = $model; mode = $_.mode }
    })
}

# Full-screen model picker. Arrows move, Enter confirm, Esc cancels.
# Returns the index into $All, or -2 when cancelled.
function Show-ModelPicker {
    param([string[]]$All, [int]$Initial, [string]$Title)
    $sel = if ($Initial -ge 0) { $Initial } else { 0 }
    $running = $true
    try { [Console]::CursorVisible = $false } catch {}

    try {
        while ($running) {
            Clear-Host
            Write-Host "Pick a model for: $Title" -ForegroundColor Cyan
            Write-Host "UP/DOWN: move     ENTER: select     ESC: cancel" -ForegroundColor DarkGray
            Write-Host ""
            $perPage = [Math]::Max(5, [Console]::WindowHeight - 4)
            $from = [Math]::Max(0, $sel - [Math]::Floor($perPage / 2))
            for ($k = $from; $k -lt [Math]::Min($All.Count, $from + $perPage); $k++) {
                $mark = if ($k -eq $sel) { '>' } else { ' ' }
                $line = "  {0} {1}" -f $mark, $All[$k]
                if ($k -eq $sel) { Write-Host $line -ForegroundColor Black -BackgroundColor White }
                else { Write-Host $line }
            }

            $key = [Console]::ReadKey($true)
            switch ($key.Key) {
                'UpArrow'   { if ($sel -gt 0) { $sel-- } }
                'DownArrow' { if ($sel -lt $All.Count - 1) { $sel++ } }
                'Enter'     { return $sel }
                'Escape'    { return -2 }
                'LeftArrow' { return -2 }
                'Q'         { return -2 }
            }
        }
    } finally {
        try { [Console]::CursorVisible = $true } catch {}
    }
    return -2
}

# Insert or update a field (model:, mode:) in the frontmatter of an agent file.
function Set-AgentField {
    param([string]$Path, [string]$Field, [string]$Value)
    if (-not (Test-Path $Path)) { return $false }
    $lines   = @(Get-Content $Path)
    $inFront = $false
    $fieldIdx = -1
    $nameIdx  = -1

    for ($i = 0; $i -lt $lines.Length; $i++) {
        $l = $lines[$i]
        if ($l -match '^---\s*$') {
            if ($inFront) { $inFront = $false; break }
            else { $inFront = $true; continue }
        }
        if (-not $inFront) { continue }
        if ($l -match ("^" + $Field + "\s*:")) { $fieldIdx = $i }
        elseif ($l -match '^\s*name\s*:') { $nameIdx = $i }
    }

    if ($fieldIdx -ge 0) {
        $lines[$fieldIdx] = "${Field}: $Value"
    } elseif ($nameIdx -ge 0) {
        $list = New-Object 'System.Collections.Generic.List[string]'
        $list.AddRange([string[]]$lines)
        $list.Insert($nameIdx + 1, "${Field}: $Value")
        $lines = $list.ToArray()
    } else {
        return $false
    }

    Set-Content -Path $Path -Value $lines
    return $true
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
Write-Info "Harness Setup"
Write-Info "Project: $ProjectRoot"

if ($File) {
    # Explicit non-interactive file-driven apply.
    if (-not (Test-Path $SettingsFile)) {
        Write-Err "Settings file not found: $SettingsFile"
        exit 1
    }
    Write-Info "File-driven mode: reading $SettingsFile"
    $settings = ConvertFrom-JsonC -Content (Get-Content $SettingsFile -Raw)
} else {
    # Interactive TUI by default (make setup). Pre-load existing settings so
    # the user sees current picks and can edit them.
    Write-Info "Interactive mode. Detecting available models..."
    $providers = Get-AvailableModels
    $preset = @{}
    if (Test-Path $SettingsFile) {
        $existing = ConvertFrom-JsonC -Content (Get-Content $SettingsFile -Raw)
        if ($existing.agents) {
            foreach ($ap in $existing.agents.PSObject.Properties) {
                $preset[$ap.Name] = $ap.Value   # { model?, mode? } subset
            }
        }
    }

    $roles = Get-RoleDefaults
    $states = Invoke-HarnessTui -Roles @($roles.Keys) -Providers $providers -Preset $preset

    $out = [ordered]@{}
    foreach ($st in $states) {
        $entry = [ordered]@{}
        if ($st.model) { $entry.model = $st.model }
        if ($st.mode)  { $entry.mode  = $st.mode }
        if ($entry.Count -gt 0) { $out[$st.name] = $entry }
    }
    $settings = [pscustomobject][ordered]@{
        default_model = if ($out.Count -gt 0) { ($out.Values | Select-Object -First 1).model } else { $null }
        agents        = [pscustomobject]$out
    }
    # Persist (write plain JSON here; comments are optional).
    $settings | ConvertTo-Json -Depth 5 | Set-Content $SettingsFile
    Write-Ok "Saved defaults to $SettingsFile"
}

# Apply
$agents = $settings.agents
Write-Info "Applying settings..."

foreach ($prop in $agents.PSObject.Properties) {
    $name = $prop.Name
    $path = Join-Path $AgentsDir "$name.md"
    $field = $prop.Value

    if ($field.model) {
        if (Set-AgentField -Path $path -Field "model" -Value $field.model) {
            Write-Ok "  $name model -> $($field.model)"
        } else {
            Write-Err "  Failed to set model for $name (file may not exist: $path)"
        }
    }
    if ($field.mode) {
        if (Set-AgentField -Path $path -Field "mode" -Value $field.mode) {
            Write-Ok "  $name mode  -> $($field.mode)"
        } else {
            Write-Err "  Failed to set mode for $name (file may not exist: $path)"
        }
    }
}

Write-Info ""
Write-Info "Done. Restart opencode to load the updated agent config."
Write-Info "Run `make setup` to change model/mode interactively, or edit $SettingsFile and re-run."
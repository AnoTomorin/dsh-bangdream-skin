# BanG Dream! UI plugin manager for the dsh web profile.
# Load the plugin:   .\bngd-ui.ps1 -Install
# Unload the plugin: .\bngd-ui.ps1 -Uninstall
# Show state:        .\bngd-ui.ps1 -Status
# Small update:      .\bngd-ui.ps1 -BumpPatch -Install   (1.6.0 -> 1.6.1)
# Feature update:    .\bngd-ui.ps1 -BumpMinor -Install   (1.6.0 -> 1.7.0)
# After Install/Uninstall, restart dsh web for the change to take effect.
# Compatible with Windows PowerShell 5.1 and PowerShell 7+.

param(
  [switch]$Install,
  [switch]$Uninstall,
  [switch]$Status,
  [switch]$BumpPatch,
  [switch]$BumpMinor
)

$ErrorActionPreference = 'Stop'

$PkgName   = '@local/bngd-ui'
$PkgDir    = Join-Path $PSScriptRoot 'bngd-ui'
$DshHome   = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$Profile   = Join-Path (Join-Path $DshHome 'profiles') 'web'
$Manifest  = Join-Path $Profile 'package.json'
$LinkDir   = Join-Path $Profile 'node_modules\@local'
$Link      = Join-Path $LinkDir 'bngd-ui'

function Test-Installed([string]$path) {
  return Test-Path (Join-Path $path 'package.json')
}

# Write JSON as UTF-8 WITHOUT a BOM (a BOM breaks Node's JSON.parse on boot).
function Write-ManifestJson([string]$path, $value) {
  $json = $value | ConvertTo-Json -Depth 20
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json + "`n", $utf8NoBom)
}

function Write-PackageJson([string]$path, $value) {
  Write-ManifestJson $path $value
}

function Bump-PluginVersion([string]$level) {
  $parts = ([string]$PkgJson.version).Trim() -split '\.'
  if ($parts.Count -lt 3) { throw "Unsupported version format: $($PkgJson.version)" }
  $major = [int]$parts[0]
  $minor = [int]$parts[1]
  $patch = [int]$parts[2]
  if ($level -eq 'patch') { $patch += 1 }
  elseif ($level -eq 'minor') { $minor += 1; $patch = 0 }
  else { throw "Unknown bump level: $level" }
  $PkgJson.version = "$major.$minor.$patch"
  Write-PackageJson $PkgJsonPath $PkgJson
  Write-Host "plugin version bumped to $($PkgJson.version)"
}

if (-not (Test-Path $Manifest)) {
  Write-Host "ERROR: profile manifest not found at $Manifest — start dsh web once first."
  exit 1
}
if (-not (Test-Path (Join-Path $PkgDir 'package.json'))) {
  Write-Host "ERROR: plugin package not found at $PkgDir"
  exit 1
}

$PkgJsonPath = Join-Path $PkgDir 'package.json'
$PkgJson = Get-Content -LiteralPath $PkgJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$ShareRoot = Split-Path $PkgDir -Parent
$ShareDir  = Split-Path $ShareRoot -Parent

if ($BumpPatch) { Bump-PluginVersion 'patch' }
if ($BumpMinor) { Bump-PluginVersion 'minor' }
$PluginVersion = [string]$PkgJson.version

$manifest = Get-Content -LiteralPath $Manifest -Raw -Encoding UTF8 | ConvertFrom-Json

if ($Install) {
  # 1. dependency entry
  if (-not $manifest.dependencies) { $manifest | Add-Member -NotePropertyName 'dependencies' -NotePropertyValue ([pscustomobject]@{}) -Force }
  $dep = $manifest.dependencies
  $depValue = "link:$($PkgDir.Replace('\','/'))"
  if (-not ($dep.PSObject.Properties.Name -contains $PkgName)) {
    $dep | Add-Member -NotePropertyName $PkgName -NotePropertyValue $depValue -Force
    Write-Host "dependency @local/bngd-ui added"
  } else {
    Write-Host "dependency @local/bngd-ui already present"
  }

  # 2. bundle layer
  $bundles = @($manifest.dsh.profile.bundles)
  if ($bundles -notcontains $PkgName) {
    $bundles += $PkgName
    $manifest.dsh.profile.bundles = $bundles
    Write-Host "bundle layer @local/bngd-ui added"
  } else {
    Write-Host "bundle layer @local/bngd-ui already present"
  }

  # 2b. mirror Kasumi's full-body art into the package so /bngd-ui/character.webp
  #     keeps working even if the original material folder moves later.
  $DeepseekRoot = Split-Path (Split-Path $PkgDir -Parent) -Parent
    # Build the Chinese folder name from code points so PowerShell 5.1 reads it
    # correctly even when this file is saved as UTF-8 without a BOM.
    $MaterialRoot = Join-Path $DeepseekRoot ('bangdream' + [char]0x7D20 + [char]0x6750)
  $KasumiArtSource = Join-Path $MaterialRoot 'poppin-party\img_toyama-kasumi_1.webp'
  $KasumiArtDir = Join-Path $PkgDir 'lib\skin\poppin-party'
  $KasumiArtDst = Join-Path $KasumiArtDir 'img_toyama-kasumi_1.webp'
  if (Test-Path -LiteralPath $KasumiArtSource) {
    if (-not (Test-Path $KasumiArtDir)) { New-Item -ItemType Directory -Path $KasumiArtDir -Force | Out-Null }
    try {
      Copy-Item -LiteralPath $KasumiArtSource -Destination $KasumiArtDst -Force -ErrorAction Stop
      Write-Host "Kasumi character art mirrored: $KasumiArtDst"
    } catch {
      Write-Warning "Could not mirror Kasumi art ($($_.Exception.Message)). /bngd-ui/character.webp will fall back to cordis.patch.yml characterPath."
    }
  } else {
    Write-Warning "Kasumi art not found at $KasumiArtSource. /bngd-ui/character.webp will fall back to cordis.patch.yml characterPath."
  }

  # 2b2. mirror the complete Poppin'Party folder so its default wallpaper ships too.
  $PoppinPartySource = Join-Path $MaterialRoot 'poppin-party'
  $PoppinPartyDir = Join-Path $PkgDir 'lib\skin\poppin-party'
  if (Test-Path -LiteralPath $PoppinPartySource) {
    if (-not (Test-Path (Join-Path $PkgDir 'lib\skin'))) { New-Item -ItemType Directory -Path (Join-Path $PkgDir 'lib\skin') -Force | Out-Null }
    if (Test-Path $PoppinPartyDir) { Remove-Item -LiteralPath $PoppinPartyDir -Recurse -Force }
    try {
      Copy-Item -LiteralPath $PoppinPartySource -Destination $PoppinPartyDir -Recurse -Force -ErrorAction Stop
      Write-Host "Poppin'Party skin mirrored: $PoppinPartyDir"
    } catch {
      Write-Warning "Could not mirror Poppin'Party skin ($($_.Exception.Message)). /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
    }
  } else {
    Write-Warning "Poppin'Party skin not found at $PoppinPartySource. /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
  }


  # 2c. mirror the complete Afterglow skin folder as well.
  $AfterglowSource = Join-Path $MaterialRoot 'afterglow'
  $AfterglowDir = Join-Path $PkgDir 'lib\skin\afterglow'
  if (Test-Path -LiteralPath $AfterglowSource) {
    if (-not (Test-Path (Join-Path $PkgDir 'lib\skin'))) { New-Item -ItemType Directory -Path (Join-Path $PkgDir 'lib\skin') -Force | Out-Null }
    if (Test-Path $AfterglowDir) { Remove-Item -LiteralPath $AfterglowDir -Recurse -Force }
    try {
      Copy-Item -LiteralPath $AfterglowSource -Destination $AfterglowDir -Recurse -Force -ErrorAction Stop
      Write-Host "Afterglow skin mirrored: $AfterglowDir"
    } catch {
      Write-Warning "Could not mirror Afterglow skin ($($_.Exception.Message)). /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
    }
  } else {
    Write-Warning "Afterglow skin not found at $AfterglowSource. /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
  }

  # 2d. mirror the complete Roselia skin folder as well.
  $RoseliaSource = Join-Path $MaterialRoot 'roselia'
  $RoseliaDir = Join-Path $PkgDir 'lib\skin\roselia'
  if (Test-Path -LiteralPath $RoseliaSource) {
    if (-not (Test-Path (Join-Path $PkgDir 'lib\skin'))) { New-Item -ItemType Directory -Path (Join-Path $PkgDir 'lib\skin') -Force | Out-Null }
    if (Test-Path $RoseliaDir) { Remove-Item -LiteralPath $RoseliaDir -Recurse -Force }
    try {
      Copy-Item -LiteralPath $RoseliaSource -Destination $RoseliaDir -Recurse -Force -ErrorAction Stop
      Write-Host "Roselia skin mirrored: $RoseliaDir"
    } catch {
      Write-Warning "Could not mirror Roselia skin ($($_.Exception.Message)). /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
    }
  } else {
    Write-Warning "Roselia skin not found at $RoseliaSource. /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
  }

  # 2e. mirror the remaining band folders that carry per-theme default
  #     backgrounds (Pastel*Palettes / Hello, Happy World! / Morfonica /
  #     RAISE A SUILEN / MyGO!!!!!). Keeps the share package self-contained.
  $OtherBackgroundBands = @('pastel-palettes','hello-happy-world','morfonica','raise-a-suilen','mygo')
  foreach ($band in $OtherBackgroundBands) {
    $bandSource = Join-Path $MaterialRoot $band
    $bandDir = Join-Path $PkgDir "lib\skin\$band"
    if (Test-Path -LiteralPath $bandSource) {
      if (-not (Test-Path (Join-Path $PkgDir 'lib\skin'))) { New-Item -ItemType Directory -Path (Join-Path $PkgDir 'lib\skin') -Force | Out-Null }
      if (Test-Path $bandDir) { Remove-Item -LiteralPath $bandDir -Recurse -Force }
      try {
        Copy-Item -LiteralPath $bandSource -Destination $bandDir -Recurse -Force -ErrorAction Stop
        Write-Host "$band skin mirrored: $bandDir"
      } catch {
        Write-Warning "Could not mirror $band skin ($($_.Exception.Message)). /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
      }
    } else {
      Write-Warning "$band skin not found at $bandSource. /bngd-ui/skin/ will fall back to cordis.patch.yml skinAssetsPath."
    }
  }



  # 3. copy the package into the profile's node_modules (a real directory, not
  #    a link: the node half's dsh dependencies must resolve via the parent
  #    walk from inside the profile tree). Always refreshed so re-running
  #    -Install picks up edited plugin files (client.js, lib/bgm, ...).
  if (-not (Test-Path $LinkDir)) { New-Item -ItemType Directory -Path $LinkDir -Force | Out-Null }
  if (Test-Path $Link) { Remove-Item -LiteralPath $Link -Recurse -Force }
  New-Item -ItemType Directory -Path $Link -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $PkgDir 'package.json') -Destination $Link -Force
  Copy-Item -LiteralPath (Join-Path $PkgDir 'cordis.patch.yml') -Destination $Link -Force
  Copy-Item -LiteralPath (Join-Path $PkgDir 'lib') -Destination $Link -Recurse -Force
  Write-Host "package copied (refreshed): $PkgDir -> $Link"

  # 3b. refresh the shareable zip using the current package version and clean
  #     up any older vX.Y.Z-share.zip files so stale version names never linger.
  $ShareZipName = "bngd-ui-plugin-v$PluginVersion-share.zip"
  $ShareZip = Join-Path $ShareDir $ShareZipName
  try {
    Get-ChildItem -LiteralPath $ShareDir -Filter 'bngd-ui-plugin-v*-share.zip' | ForEach-Object {
      if ($_.Name -ne $ShareZipName) { Remove-Item -LiteralPath $_.FullName -Force }
    }
    if (Test-Path -LiteralPath $ShareZip) { Remove-Item -LiteralPath $ShareZip -Force }
    Compress-Archive -Path $ShareRoot -DestinationPath $ShareZip -CompressionLevel Optimal -ErrorAction Stop
    Write-Host "share package updated (v$PluginVersion): $ShareZip"
  } catch {
    Write-Warning "Could not update share package ($($_.Exception.Message))."
  }


  Write-ManifestJson $Manifest $manifest
  Write-Host "DONE. Restart dsh web to load the BanG Dream UI plugin."
  exit 0
}

if ($Uninstall) {
  $changed = $false
  if ($manifest.dependencies -and ($manifest.dependencies.PSObject.Properties.Name -contains $PkgName)) {
    $manifest.dependencies.PSObject.Properties.Remove($PkgName)
    $changed = $true
  }
  $bundles = @($manifest.dsh.profile.bundles)
  if ($bundles -contains $PkgName) {
    $manifest.dsh.profile.bundles = @($bundles | Where-Object { $_ -ne $PkgName })
    $changed = $true
  }
  if ($changed) { Write-ManifestJson $Manifest $manifest }
  if (Test-Path $Link) {
    Remove-Item -LiteralPath $Link -Recurse -Force
    if ((Get-ChildItem -LiteralPath $LinkDir -Force -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0) {
      Remove-Item -LiteralPath $LinkDir -Force -ErrorAction SilentlyContinue
    }
  }
  Write-Host "DONE. Restart dsh web to unload the BanG Dream UI plugin. (The package at $PkgDir is kept.)"
  exit 0
}

# default: status
$depOn  = $manifest.dependencies -and ($manifest.dependencies.PSObject.Properties.Name -contains $PkgName)
$bundle  = @($manifest.dsh.profile.bundles) -contains $PkgName
$linked  = Test-Installed $Link
Write-Host "package source : $PkgDir (exists: $(Test-Path (Join-Path $PkgDir 'package.json')))"
Write-Host "plugin version : v$PluginVersion"
Write-Host "kasumi art     : $(Test-Path (Join-Path $PkgDir 'lib\skin\poppin-party\img_toyama-kasumi_1.webp')) (lib/skin/poppin-party/img_toyama-kasumi_1.webp)"
Write-Host "afterglow skin : $(Test-Path (Join-Path $PkgDir 'lib\skin\afterglow\brand\new-session.png')) (lib/skin/afterglow)"
Write-Host "roselia skin   : $(Test-Path (Join-Path $PkgDir 'lib\skin\roselia\brand\new-session.png')) (lib/skin/roselia)"
Write-Host "dependency     : $depOn"
Write-Host "bundle layer   : $bundle"
Write-Host "node_modules link: $linked"
if ($depOn -and $bundle -and $linked) { Write-Host "STATUS: LOADED (active after dsh web restart)" }
else { Write-Host "STATUS: NOT LOADED" }
exit 0

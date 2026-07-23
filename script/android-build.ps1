param(
  [ValidateSet("Debug", "Bundle")]
  [string]$Mode = "Debug"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$studioJdk = "C:\Program Files\Android\Android Studio\jbr"

if (Test-Path -LiteralPath "$studioJdk\bin\java.exe") {
  $env:JAVA_HOME = $studioJdk
  $env:Path = "$studioJdk\bin;$env:Path"
}

if ($Mode -eq "Bundle") {
  $credentialsPath = Join-Path $projectRoot "local-secrets\UPLOAD_KEY_README.txt"
  if (Test-Path -LiteralPath $credentialsPath) {
    $credentials = Get-Content -LiteralPath $credentialsPath
    $readValue = {
      param([string]$Label)
      $line = $credentials | Where-Object { $_ -like "$Label*" } | Select-Object -First 1
      if ($line) { return $line.Substring($Label.Length).Trim() }
      return $null
    }

    if (-not $env:NPP_KEYSTORE_PATH) { $env:NPP_KEYSTORE_PATH = & $readValue "Keystore:" }
    if (-not $env:NPP_KEYSTORE_PASSWORD) { $env:NPP_KEYSTORE_PASSWORD = & $readValue "Keystore password:" }
    if (-not $env:NPP_KEY_ALIAS) { $env:NPP_KEY_ALIAS = & $readValue "Alias:" }
    if (-not $env:NPP_KEY_PASSWORD) { $env:NPP_KEY_PASSWORD = & $readValue "Key password:" }
  }

  $missingSigningValue = @(
    $env:NPP_KEYSTORE_PATH,
    $env:NPP_KEYSTORE_PASSWORD,
    $env:NPP_KEY_ALIAS,
    $env:NPP_KEY_PASSWORD
  ) | Where-Object { -not $_ } | Select-Object -First 1

  if ($missingSigningValue -or -not (Test-Path -LiteralPath $env:NPP_KEYSTORE_PATH)) {
    throw "Release signing key is missing. Restore local-secrets or set the NPP_KEYSTORE_* environment variables."
  }
}

& npm.cmd run android:sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$gradleTask = if ($Mode -eq "Bundle") { "bundleRelease" } else { "assembleDebug" }
Push-Location (Join-Path $projectRoot "android")
try {
  & .\gradlew.bat $gradleTask
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}

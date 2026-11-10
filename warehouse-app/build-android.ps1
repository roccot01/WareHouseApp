<#
.SYNOPSIS
  Builds the Warehouse app, packages it as an Android APK (Capacitor) and can deploy it.

.DESCRIPTION
  What it does, in order:
    1. Checks Node, Java and the Android SDK
    2. Installs npm packages (including Capacitor, Firebase and ZXing if they are missing)
    3. Builds the Vite web app into dist/
    4. First run only: creates the Capacitor Android project and allows camera access in it
    5. Copies the web build into the Android project (cap sync)
    6. Builds the APK with Gradle
    7. Copies the APK into ./apk/ with the version and a timestamp in its name
    8. Optional: deploys Firebase rules and/or the web version, installs the APK on a connected phone

  Run it from the project root (the folder that contains package.json).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\build-android.ps1

.EXAMPLE
  .\build-android.ps1 -Install -DeployRules
#>
[CmdletBinding()]
param(
  [string]$AppName = "Warehouse",
  [string]$AppId = "com.warehouse.app",   # only used the first time (cap init)
  [switch]$SkipNpmInstall,                # skip "npm install" (faster re-builds)
  [switch]$Clean,                         # run "gradle clean" before building
  [switch]$AcceptLicenses,                # accept Android SDK licenses (needed once on a fresh SDK)
  [switch]$DeployRules,                   # firebase deploy --only firestore:rules
  [switch]$DeployWeb,                     # firebase deploy --only hosting (web/PWA version)
  [switch]$Install,                       # install the APK on a USB-connected phone and launch it
  [switch]$OpenAndroidStudio              # open the Android project in Android Studio after syncing
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
$timer = [System.Diagnostics.Stopwatch]::StartNew()

function Step([string]$Message) { Write-Host ""; Write-Host "==> $Message" -ForegroundColor Cyan }
function Info([string]$Message) { Write-Host "    $Message" -ForegroundColor Gray }
function Warn([string]$Message) { Write-Host "    ! $Message" -ForegroundColor Yellow }
function Test-Command([string]$Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

# Runs a program and stops the script if it fails.
function Invoke-Tool {
  param([Parameter(Mandatory = $true)][string]$File, [string[]]$Arguments = @())
  & $File @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed (exit code $LASTEXITCODE): $File $($Arguments -join ' ')"
  }
}

# Uses a globally installed Firebase CLI if there is one, otherwise runs it through npx.
function Invoke-Firebase([string[]]$FbArgs) {
  if (Test-Command "firebase") { Invoke-Tool "firebase" $FbArgs }
  else { Invoke-Tool "npx" (@("--yes", "firebase-tools") + $FbArgs) }
}

try {

  # ------------------------------------------------------------------
  Step "Checking prerequisites"
  # ------------------------------------------------------------------
  if (-not (Test-Path "package.json")) {
    throw "package.json not found. Save this script in the project root, next to package.json."
  }
  if (-not (Test-Command "node")) { throw "Node.js not found. Install it from https://nodejs.org" }

  $nodeVersion = (& node -v).Trim()
  $nodeMajor = [int]($nodeVersion.TrimStart("v").Split(".")[0])
  Info "Node $nodeVersion"
  if ($nodeMajor -lt 18) { throw "Node $nodeVersion is too old. Install a current LTS version." }
  if ($nodeMajor -lt 20) { Warn "Recent Capacitor versions want Node 20 or newer. If npm complains, update Node." }

  # Java: use JAVA_HOME if valid, otherwise the JDK bundled with Android Studio.
  $javaOk = $env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))
  if (-not $javaOk) {
    $studioJdk = @(
      "$env:ProgramFiles\Android\Android Studio\jbr",
      "${env:ProgramFiles(x86)}\Android\Android Studio\jbr",
      "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
    ) | Where-Object { $_ -and (Test-Path (Join-Path $_ "bin\java.exe")) } | Select-Object -First 1
    if ($studioJdk) {
      $env:JAVA_HOME = $studioJdk
      Info "Using the JDK bundled with Android Studio"
    }
  }
  if ($env:JAVA_HOME) { $env:Path = (Join-Path $env:JAVA_HOME "bin") + ";" + $env:Path }
  if (-not (Test-Command "java")) {
    throw "Java not found. Install Android Studio (it bundles a JDK) or set JAVA_HOME to a JDK 17+ folder."
  }
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $javaLine = ((& java -version 2>&1) | Select-Object -First 1).ToString()
  $ErrorActionPreference = $previousPreference
  Info $javaLine
  if ($javaLine -match '"(\d+)') {
    if ([int]$Matches[1] -lt 17) { Warn "Gradle for Android needs JDK 17 or newer. Point JAVA_HOME at Android Studio's jbr folder." }
  }

  # Android SDK
  $sdk = $env:ANDROID_HOME
  if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
  if (-not $sdk -or -not (Test-Path $sdk)) { $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }
  if (-not (Test-Path $sdk)) {
    throw "Android SDK not found. Open Android Studio once (it installs the SDK) or set ANDROID_HOME."
  }
  $env:ANDROID_HOME = $sdk
  Info "Android SDK: $sdk"

  if (-not (Test-Path ".env")) {
    Warn ".env not found: the APK will be built WITHOUT Firebase settings (family sync will say 'not configured')."
  }

  # ------------------------------------------------------------------
  Step "Installing dependencies"
  # ------------------------------------------------------------------
  if ($SkipNpmInstall) { Info "Skipped (-SkipNpmInstall)" }
  else { Invoke-Tool "npm" @("install") }

  $required = @("lucide-react", "firebase", "@zxing/browser", "@zxing/library", "@capacitor/core", "@capacitor/android")
  $missing = @($required | Where-Object { -not (Test-Path (Join-Path "node_modules" $_)) })
  if ($missing.Count -gt 0) {
    Info "Installing missing packages: $($missing -join ', ')"
    Invoke-Tool "npm" (@("install") + $missing)
  }
  if (-not (Test-Path (Join-Path "node_modules" "@capacitor/cli"))) {
    Invoke-Tool "npm" @("install", "-D", "@capacitor/cli")
  }

  # ------------------------------------------------------------------
  Step "Building the web app (Vite)"
  # ------------------------------------------------------------------
  Invoke-Tool "npm" @("run", "build")
  if (-not (Test-Path "dist\index.html")) { throw "dist\index.html is missing after the build." }

  # ------------------------------------------------------------------
  Step "Preparing the Android project (Capacitor)"
  # ------------------------------------------------------------------
  $hasCapConfig = (Test-Path "capacitor.config.ts") -or (Test-Path "capacitor.config.json") -or (Test-Path "capacitor.config.js")
  if (-not $hasCapConfig) {
    Info "No Capacitor config yet: creating one ($AppName / $AppId, web folder: dist)"
    Invoke-Tool "npx" @("cap", "init", $AppName, $AppId, "--web-dir", "dist")
  }
  if (-not (Test-Path "android")) {
    Info "First run: adding the Android platform"
    Invoke-Tool "npx" @("cap", "add", "android")
  }

  # Allow the camera (barcode scanner) in the native app.
  $manifestPath = "android\app\src\main\AndroidManifest.xml"
  if (Test-Path $manifestPath) {
    $manifestFull = (Resolve-Path $manifestPath).Path
    $manifest = [System.IO.File]::ReadAllText($manifestFull)
    if ($manifest -notmatch "android\.permission\.CAMERA") {
      $addition = "    <uses-permission android:name=`"android.permission.CAMERA`" />`r`n" +
                  "    <uses-feature android:name=`"android.hardware.camera`" android:required=`"false`" />`r`n"
      $manifest = $manifest.Replace("</manifest>", $addition + "</manifest>")
      [System.IO.File]::WriteAllText($manifestFull, $manifest, (New-Object System.Text.UTF8Encoding($false)))
      Info "Added the camera permission to AndroidManifest.xml"
    }
  }

  Info "Copying the web build into the Android project"
  Invoke-Tool "npx" @("cap", "sync", "android")

  # Gradle needs to know where the SDK is (Android Studio normally writes this file).
  $localProps = "android\local.properties"
  if (-not (Test-Path $localProps)) {
    Set-Content -Path $localProps -Value ("sdk.dir=" + ($sdk -replace "\\", "/")) -Encoding ASCII
    Info "Created android\local.properties"
  }

  if ($AcceptLicenses) {
    $sdkManager = Join-Path $sdk "cmdline-tools\latest\bin\sdkmanager.bat"
    if (Test-Path $sdkManager) {
      Info "Accepting Android SDK licenses"
      ("y`n" * 20) | & $sdkManager --licenses | Out-Null
    } else {
      Warn "sdkmanager not found. In Android Studio: SDK Manager > SDK Tools > install 'Android SDK Command-line Tools (latest)'."
    }
  }

  if ($OpenAndroidStudio) { Invoke-Tool "npx" @("cap", "open", "android") }

  # ------------------------------------------------------------------
  Step "Building the APK (Gradle, first run downloads a lot and can take several minutes)"
  # ------------------------------------------------------------------
  $tasks = @("assembleDebug")
  if ($Clean) { $tasks = @("clean") + $tasks }
  Push-Location "android"
  try { Invoke-Tool ".\gradlew.bat" $tasks }
  finally { Pop-Location }

  $apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
  if (-not (Test-Path $apkSource)) { throw "Gradle finished but $apkSource was not found." }

  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  $version = if ($pkg.version) { $pkg.version } else { "0.0.0" }
  $outDir = Join-Path $PSScriptRoot "apk"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmm"
  $apkTarget = Join-Path $outDir "warehouse-v$version-debug-$stamp.apk"
  Copy-Item $apkSource $apkTarget -Force
  Copy-Item $apkSource (Join-Path $outDir "warehouse-latest.apk") -Force
  $sizeMb = [math]::Round((Get-Item $apkTarget).Length / 1MB, 1)

  # ------------------------------------------------------------------
  # Optional: deploy
  # ------------------------------------------------------------------
  if ($DeployRules) {
    Step "Deploying Firestore security rules"
    if (-not (Test-Path "firebase.json")) {
      throw "firebase.json not found. Run 'firebase init firestore' once in this folder (keep your existing firestore.rules), then retry."
    }
    Invoke-Firebase @("deploy", "--only", "firestore:rules")
  }

  if ($DeployWeb) {
    Step "Deploying the web version to Firebase Hosting"
    if (-not (Test-Path "firebase.json") -or -not (Select-String -Path "firebase.json" -Pattern '"hosting"' -Quiet)) {
      throw "Hosting is not configured. Run 'firebase init hosting' once (public directory: dist, single-page app: yes, overwrite index.html: no), then retry."
    }
    Invoke-Firebase @("deploy", "--only", "hosting")
  }

  if ($Install) {
    Step "Installing on the connected phone"
    $adb = Join-Path $sdk "platform-tools\adb.exe"
    if (-not (Test-Path $adb)) { throw "adb not found. In Android Studio: SDK Manager > SDK Tools > Android SDK Platform-Tools." }
    $devices = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' })
    if ($devices.Count -eq 0) {
      throw "No phone detected. Enable USB debugging, plug the phone in, accept the prompt on its screen, and retry."
    }
    Invoke-Tool $adb @("install", "-r", $apkTarget)

    $installedId = $AppId
    $gradleFile = Get-ChildItem "android\app" -Filter "build.gradle*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gradleFile) {
      $idMatch = Select-String -Path $gradleFile.FullName -Pattern 'applicationId\s*=?\s*"([^"]+)"' | Select-Object -First 1
      if ($idMatch) { $installedId = $idMatch.Matches[0].Groups[1].Value }
    }
    & $adb shell monkey -p $installedId -c android.intent.category.LAUNCHER 1 | Out-Null
    Info "Installed and launched $installedId"
  }

  # ------------------------------------------------------------------
  Write-Host ""
  Write-Host "Done in $([math]::Round($timer.Elapsed.TotalMinutes, 1)) min." -ForegroundColor Green
  Write-Host "  APK: $apkTarget ($sizeMb MB)"
  Write-Host "  Also saved as: $(Join-Path $outDir 'warehouse-latest.apk')"
  if (-not $Install) { Write-Host "  Send it to your phone, or run again with -Install while the phone is plugged in." }

} catch {
  Write-Host ""
  Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Compila y prueba el módulo Android con el JDK de Android Studio. Uso: .\build-local.ps1 [tareas de Gradle]
# Las herramientas de Android no aceptan rutas con caracteres no ASCII (KevinLópez): se usan los nombres cortos
# de Windows (8.3) para el proyecto y el SDK, y local.properties se escribe en cada corrida.
$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$tasks = if ($args.Count) { @($args) } else { @('assembleDebug', 'testDebugUnitTest') }
$fso = New-Object -ComObject Scripting.FileSystemObject
$short = { param($p) $fso.GetFolder($p).ShortPath }
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$root = & $short $PSScriptRoot
"sdk.dir=$((& $short $sdk) -replace '\\', '\\' -replace ':', '\:')" | Set-Content -Encoding ascii (Join-Path $PSScriptRoot 'local.properties')
$log = Join-Path $PSScriptRoot 'build-local.log'
Set-Location $root
if (-not (Test-Path .\gradlew.bat)) {
  $g = (Get-ChildItem "$env:USERPROFILE\.gradle\wrapper\dists\gradle-9.9.1-bin\*\gradle-9.9.1\bin\gradle.bat").FullName
  & $g wrapper --gradle-version 9.9.1
}
$ErrorActionPreference = 'Continue'
$tasks = @($tasks)
& .\gradlew.bat @tasks --console=plain *> $log
"EXIT $LASTEXITCODE" | Add-Content $log

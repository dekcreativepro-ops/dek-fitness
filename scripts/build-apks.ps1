# Compile les DEUX applications de test, installables ensemble sur le même téléphone :
#   releases\DEK-FITNESS-verrouille.apk    (com.dek.fitness, comme les vrais utilisateurs : essai, limites, abonnement)
#   releases\DEK-TEST-deverrouille.apk     (com.dek.fitness.test, tout est ouvert, sans paiement)
# À lancer dans un terminal PowerShell :  C:\dekapp\scripts\build-apks.ps1   (environ 5 à 15 minutes)
$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:\dektools\jdk21'
$env:ANDROID_HOME = 'C:\dektools\android-sdk'
Set-Location C:\dekapp
New-Item -ItemType Directory -Force releases | Out-Null

function Build-Apk([string]$name, [bool]$unlocked) {
  if ($unlocked) { $env:VITE_UNLOCKED = 'true' } else { Remove-Item Env:VITE_UNLOCKED -ErrorAction SilentlyContinue }
  npm run cap:sync
  if ($LASTEXITCODE -ne 0) { throw 'La compilation du site a échoué' }
  Push-Location android
  if ($unlocked) { .\gradlew.bat assembleDebug -PdekUnlocked=true } else { .\gradlew.bat assembleDebug }
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw "La compilation Android a échoué ($name)" }
  Copy-Item android\app\build\outputs\apk\debug\app-debug.apk "releases\$name" -Force
  Write-Host "OK : releases\$name"
}

Build-Apk 'DEK-FITNESS-verrouille.apk' $false
Build-Apk 'DEK-TEST-deverrouille.apk' $true
Remove-Item Env:VITE_UNLOCKED -ErrorAction SilentlyContinue
Write-Host 'Terminé : les deux APK sont dans C:\dekapp\releases'

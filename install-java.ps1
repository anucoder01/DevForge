$ErrorActionPreference = "Stop"
$url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
$destDir = "C:\Users\anuvu\.jdks"
$destZip = Join-Path $destDir "jdk17.zip"

Write-Host "Creating directory $destDir..."
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

Write-Host "Downloading OpenJDK 17 (this may take a minute)..."
Invoke-WebRequest -Uri $url -OutFile $destZip

Write-Host "Extracting JDK..."
Expand-Archive -Path $destZip -DestinationPath $destDir -Force
Remove-Item $destZip

$jdkDir = (Get-ChildItem -Path $destDir -Directory -Filter "jdk-17*")[0].FullName
$binDir = Join-Path $jdkDir "bin"

Write-Host "Setting JAVA_HOME to $jdkDir"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkDir, "User")

Write-Host "Adding $binDir to User PATH"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notmatch [regex]::Escape($binDir)) {
    $newPath = $binDir + ";" + $userPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
}

Write-Host "Updating current session..."
$env:JAVA_HOME = $jdkDir
$env:Path = $binDir + ";" + $env:Path

Write-Host "Verifying installation..."
java -version

$ErrorActionPreference = 'Stop'

$env:GOOGLE_APPLICATION_CREDENTIALS = 'D:\SmartInventory\ai-service\smartinventory-ia-f31ee9daf170.json'
$env:GOOGLE_CLOUD_PROJECT_ID = 'smartinventory-ia'
$env:GOOGLE_CLOUD_LOCATION = 'us-central1'
$env:VERTEX_GEMINI_MODEL = 'gemini-1.5-flash'

Set-Location $PSScriptRoot
.\mvnw.cmd spring-boot:run

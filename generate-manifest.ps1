param(
  [string]$QuestionsDir = "questions",
  [string]$OutputFile = "questions/manifest.json"
)

$files = Get-ChildItem -LiteralPath $QuestionsDir -Filter *.json `
  | Where-Object { $_.Name -ne "manifest.json" } `
  | Sort-Object Name `
  | ForEach-Object { $_.Name }

$json = $files | ConvertTo-Json
Set-Content -LiteralPath $OutputFile -Value $json -Encoding UTF8

Write-Host "Manifest generated at $OutputFile with $($files.Count) file(s)."

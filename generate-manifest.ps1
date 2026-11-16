param(
  [string]$QuestionsDir = "questions",
  [string]$OutputFile = "questions/manifest.json"
)

$files = Get-ChildItem -LiteralPath $QuestionsDir -Filter *.json `
  | Where-Object { $_.Name -ne "manifest.json" } `
  | Sort-Object Name `
  | ForEach-Object { $_.Name }

$json = ConvertTo-Json -InputObject @($files)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $OutputFile), $json, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Manifest generated at $OutputFile with $($files.Count) file(s)."

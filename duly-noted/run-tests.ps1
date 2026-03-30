npm test -- --watchAll=false 2>&1 | Tee-Object -FilePath test-output-final.txt
Write-Host "`n`nTest output saved to test-output-final.txt"

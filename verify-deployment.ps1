# Deployment Verification Script for Windows PowerShell
# This script helps verify that your deployed chat app is working correctly

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$MobileUrl = ""
)

Write-Host "🔍 Chat App Deployment Verification" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$testResults = @()
$overallStatus = $true

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedStatus = "200"
    )
    
    try {
        Write-Host "Testing: $Description" -ForegroundColor Yellow -NoNewline
        
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✅" -ForegroundColor Green
            return @{
                Test = $Description
                Status = "PASS"
                Details = "Status: $($response.StatusCode)"
            }
        } else {
            Write-Host " ❌" -ForegroundColor Red
            return @{
                Test = $Description
                Status = "FAIL" 
                Details = "Expected: $ExpectedStatus, Got: $($response.StatusCode)"
            }
        }
    }
    catch {
        Write-Host " ❌" -ForegroundColor Red
        return @{
            Test = $Description
            Status = "FAIL"
            Details = $_.Exception.Message
        }
    }
}

function Test-ApiEndpoint {
    param(
        [string]$BaseUrl,
        [string]$Endpoint,
        [string]$Description,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    try {
        Write-Host "Testing: $Description" -ForegroundColor Yellow -NoNewline
        
        $fullUrl = "$BaseUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $fullUrl -Method $Method -Body $jsonBody -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing
        }
        
        if ($response.StatusCode -lt 400) {
            Write-Host " ✅" -ForegroundColor Green
            return @{
                Test = $Description
                Status = "PASS"
                Details = "Status: $($response.StatusCode)"
            }
        } else {
            Write-Host " ❌" -ForegroundColor Red
            return @{
                Test = $Description
                Status = "FAIL"
                Details = "Status: $($response.StatusCode)"
            }
        }
    }
    catch {
        Write-Host " ❌" -ForegroundColor Red
        return @{
            Test = $Description
            Status = "FAIL"
            Details = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "🌐 Backend API Tests" -ForegroundColor Magenta
Write-Host "-------------------" -ForegroundColor Magenta

# Test basic backend connectivity
$testResults += Test-Endpoint -Url $BackendUrl -Description "Backend server connectivity"

# Test API endpoints
$testResults += Test-ApiEndpoint -BaseUrl $BackendUrl -Endpoint "/api/auth/register" -Description "Auth register endpoint" -Method "POST" -Body @{
    username = "testuser123"
    email = "test@example.com" 
    password = "testpassword123"
}

$testResults += Test-ApiEndpoint -BaseUrl $BackendUrl -Endpoint "/api/users" -Description "Users endpoint (should require auth)"

Write-Host ""
Write-Host "🖥️ Frontend Tests" -ForegroundColor Magenta  
Write-Host "----------------" -ForegroundColor Magenta

if ($FrontendUrl -ne "") {
    $testResults += Test-Endpoint -Url $FrontendUrl -Description "Frontend accessibility"
    
    # Test if frontend can reach API
    try {
        Write-Host "Testing: Frontend API configuration" -ForegroundColor Yellow -NoNewline
        $frontendContent = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
        if ($frontendContent.Content -match $BackendUrl.Replace("https://", "").Replace("http://", "")) {
            Write-Host " ✅" -ForegroundColor Green
            $testResults += @{
                Test = "Frontend API configuration"
                Status = "PASS"
                Details = "Frontend appears to be configured for correct backend"
            }
        } else {
            Write-Host " ⚠️" -ForegroundColor Yellow
            $testResults += @{
                Test = "Frontend API configuration"
                Status = "WARN"
                Details = "Could not verify API configuration in frontend"
            }
        }
    }
    catch {
        Write-Host " ❌" -ForegroundColor Red
        $testResults += @{
            Test = "Frontend API configuration"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
    }
} else {
    Write-Host "⏭️  Frontend URL not provided, skipping frontend tests" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📱 Mobile App Tests" -ForegroundColor Magenta
Write-Host "------------------" -ForegroundColor Magenta

if ($MobileUrl -ne "") {
    $testResults += Test-Endpoint -Url $MobileUrl -Description "Mobile app accessibility"
} else {
    Write-Host "⏭️  Mobile URL not provided, skipping mobile tests" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔧 CORS Tests" -ForegroundColor Magenta
Write-Host "-------------" -ForegroundColor Magenta

# Test CORS configuration
if ($FrontendUrl -ne "") {
    try {
        Write-Host "Testing: CORS configuration" -ForegroundColor Yellow -NoNewline
        
        $headers = @{
            'Origin' = $FrontendUrl
            'Access-Control-Request-Method' = 'POST'
            'Access-Control-Request-Headers' = 'Content-Type, Authorization'
        }
        
        $corsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 10 -UseBasicParsing
        
        if ($corsResponse.StatusCode -eq 200 -or $corsResponse.StatusCode -eq 204) {
            Write-Host " ✅" -ForegroundColor Green
            $testResults += @{
                Test = "CORS configuration"
                Status = "PASS"
                Details = "CORS preflight successful"
            }
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $testResults += @{
                Test = "CORS configuration"
                Status = "FAIL"
                Details = "CORS preflight failed: $($corsResponse.StatusCode)"
            }
        }
    }
    catch {
        Write-Host " ❌" -ForegroundColor Red
        $testResults += @{
            Test = "CORS configuration"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count

Write-Host ""
foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
    }
    
    $icon = switch ($result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️" }
    }
    
    Write-Host "$icon $($result.Test): $($result.Status)" -ForegroundColor $color
    if ($result.Details) {
        Write-Host "   Details: $($result.Details)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📈 Overall Results:" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $passCount" -ForegroundColor Green
if ($warnCount -gt 0) {
    Write-Host "  ⚠️  Warnings: $warnCount" -ForegroundColor Yellow
}
if ($failCount -gt 0) {
    Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red
    $overallStatus = $false
}

Write-Host ""
if ($overallStatus -and $failCount -eq 0) {
    Write-Host "🎉 Congratulations! Your deployment appears to be working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your Live URLs:" -ForegroundColor Cyan
    Write-Host "  Backend API: $BackendUrl" -ForegroundColor White
    if ($FrontendUrl -ne "") {
        Write-Host "  Frontend: $FrontendUrl" -ForegroundColor White
    }
    if ($MobileUrl -ne "") {
        Write-Host "  Mobile App: $MobileUrl" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Some issues were found with your deployment." -ForegroundColor Yellow
    Write-Host "Please review the failed tests above and check:" -ForegroundColor Yellow
    Write-Host "  • Environment variables are set correctly" -ForegroundColor White
    Write-Host "  • CORS configuration includes your frontend URL" -ForegroundColor White  
    Write-Host "  • All services are running and accessible" -ForegroundColor White
}

Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "  • Test user registration and login manually" -ForegroundColor White
Write-Host "  • Try real-time messaging features" -ForegroundColor White
Write-Host "  • Share your app with friends!" -ForegroundColor White

Write-Host ""
Write-Host "✨ Happy chatting!" -ForegroundColor Magenta
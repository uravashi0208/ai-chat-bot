# Chat App Ionic - Production Build Script
Write-Host "🏗️ Building Ionic Chat App for Production..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies first..." -ForegroundColor Yellow
    npm install
}

# Build for production
Write-Host "🔨 Building for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Production build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Build files are in the 'build' folder" -ForegroundColor Cyan
    Write-Host "🌐 You can now deploy these files to your web server" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 To build for mobile platforms:" -ForegroundColor Yellow
    Write-Host "   Android: ionic capacitor build android" -ForegroundColor White
    Write-Host "   iOS: ionic capacitor build ios" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Please check the errors above." -ForegroundColor Red
    exit 1
}
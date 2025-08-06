# Chat App Ionic - Quick Start Script
Write-Host "🚀 Starting Ionic Chat App..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

# Check if Ionic CLI is installed
Write-Host "📱 Checking Ionic CLI..." -ForegroundColor Yellow
try {
    $ionicVersion = ionic --version
    Write-Host "✅ Ionic CLI version: $ionicVersion" -ForegroundColor Green
} catch {
    Write-Host "📥 Installing Ionic CLI globally..." -ForegroundColor Yellow
    npm install -g @ionic/cli
    Write-Host "✅ Ionic CLI installed successfully!" -ForegroundColor Green
}

# Check if packages are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed!" -ForegroundColor Green
}

# Check environment file
Write-Host "⚙️ Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created! Please edit it with your backend URL." -ForegroundColor Green
    Write-Host "   Default: REACT_APP_API_URL=http://localhost:5000" -ForegroundColor Cyan
} else {
    Write-Host "✅ Environment file exists!" -ForegroundColor Green
}

# Start the development server
Write-Host ""
Write-Host "🎉 Everything is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Your Ionic Chat App will open at: http://localhost:8100" -ForegroundColor Cyan
Write-Host "🔧 Make sure your backend is running on the configured port!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green

# Start Ionic serve
ionic serve
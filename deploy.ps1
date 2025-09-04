# Chat App Deployment Script for Windows PowerShell
# This script helps automate the deployment process

param(
    [Parameter(Mandatory=$false)]
    [string]$Component = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = ""
)

Write-Host "🚀 Chat App Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

function Deploy-Backend {
    Write-Host "📦 Preparing Backend for Deployment..." -ForegroundColor Yellow
    
    Set-Location "backend"
    
    # Check if railway CLI is installed
    try {
        railway --version | Out-Null
        Write-Host "✅ Railway CLI found" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
        npm install -g @railway/cli
    }
    
    # Initialize git if not already done
    if (-not (Test-Path ".git")) {
        Write-Host "📝 Initializing Git repository..." -ForegroundColor Yellow
        git init
        git add .
        git commit -m "Initial backend commit for deployment"
    }
    
    # Create .env.example
    $envExample = @"
# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration  
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Server Configuration
PORT=5000
NODE_ENV=production

# Production URLs (set after frontend deployment)
FRONTEND_URL=https://your-app.vercel.app
MOBILE_URL=https://your-mobile-app.vercel.app
CLIENT_URL=https://your-app.vercel.app
CLIENT_URL_2=https://your-mobile-app.vercel.app
"@
    
    $envExample | Out-File -FilePath ".env.example" -Encoding UTF8
    
    Write-Host "✅ Backend prepared for deployment" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Push your code to GitHub" -ForegroundColor White
    Write-Host "2. Create new project on Railway.app" -ForegroundColor White
    Write-Host "3. Connect your GitHub repository" -ForegroundColor White
    Write-Host "4. Set environment variables in Railway dashboard" -ForegroundColor White
    
    Set-Location ".."
}

function Deploy-Frontend {
    Write-Host "📦 Preparing Frontend for Deployment..." -ForegroundColor Yellow
    
    Set-Location "frontend"
    
    # Check if vercel CLI is installed
    try {
        vercel --version | Out-Null
        Write-Host "✅ Vercel CLI found" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
        npm install -g vercel
    }
    
    # Create production environment file
    if ($BackendUrl -ne "") {
        $envProd = @"
VITE_API_URL=$BackendUrl/api
VITE_SOCKET_URL=$BackendUrl
"@
        $envProd | Out-File -FilePath ".env.production" -Encoding UTF8
        Write-Host "✅ Created .env.production with backend URL: $BackendUrl" -ForegroundColor Green
    }
    else {
        $envProd = @"
VITE_API_URL=https://your-backend-url.up.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.up.railway.app
"@
        $envProd | Out-File -FilePath ".env.production" -Encoding UTF8
        Write-Host "⚠️  Created .env.production with placeholder URLs" -ForegroundColor Yellow
        Write-Host "   Update with your actual backend URL after backend deployment" -ForegroundColor Yellow
    }
    
    # Install dependencies and build
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "🔨 Building for production..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "✅ Frontend prepared for deployment" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'vercel' to deploy" -ForegroundColor White
    Write-Host "2. Or push to GitHub and connect via Vercel dashboard" -ForegroundColor White
    
    Set-Location ".."
}

function Deploy-MobileApp {
    Write-Host "📦 Preparing Mobile App for Deployment..." -ForegroundColor Yellow
    
    Set-Location "ionicapp"
    
    # Create production environment
    if ($BackendUrl -ne "") {
        $envProd = @"
export const environment = {
  production: true,
  apiUrl: '$BackendUrl/api',
  socketUrl: '$BackendUrl'
};
"@
        $envProd | Out-File -FilePath "src/environments/environment.prod.ts" -Encoding UTF8
        Write-Host "✅ Created production environment with backend URL: $BackendUrl" -ForegroundColor Green
    }
    else {
        $envProd = @"
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.up.railway.app/api',
  socketUrl: 'https://your-backend-url.up.railway.app'
};
"@
        $envProd | Out-File -FilePath "src/environments/environment.prod.ts" -Encoding UTF8
        Write-Host "⚠️  Created production environment with placeholder URLs" -ForegroundColor Yellow
    }
    
    # Install dependencies and build
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "🔨 Building for production..." -ForegroundColor Yellow
    ionic build --prod
    
    Write-Host "✅ Mobile app prepared for deployment" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy 'dist' folder to Vercel or Netlify" -ForegroundColor White
    Write-Host "2. Or build for mobile platforms:" -ForegroundColor White
    Write-Host "   - ionic capacitor add ios" -ForegroundColor White
    Write-Host "   - ionic capacitor add android" -ForegroundColor White
    
    Set-Location ".."
}

function Show-PostDeploymentInstructions {
    Write-Host "" -ForegroundColor White
    Write-Host "🎉 Deployment Preparation Complete!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. BACKEND (Railway):" -ForegroundColor Yellow
    Write-Host "   • Push code to GitHub" -ForegroundColor White
    Write-Host "   • Create project on railway.app" -ForegroundColor White
    Write-Host "   • Set environment variables" -ForegroundColor White
    Write-Host "   • Copy your Railway URL" -ForegroundColor White
    Write-Host ""
    Write-Host "2. FRONTEND (Vercel):" -ForegroundColor Yellow
    Write-Host "   • Update .env.production with Railway URL" -ForegroundColor White
    Write-Host "   • Run 'vercel' or deploy via GitHub" -ForegroundColor White
    Write-Host "   • Copy your Vercel URL" -ForegroundColor White
    Write-Host ""
    Write-Host "3. UPDATE CORS:" -ForegroundColor Yellow
    Write-Host "   • Add Vercel URL to Railway environment variables" -ForegroundColor White
    Write-Host "   • FRONTEND_URL=https://your-app.vercel.app" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Full guide available in DEPLOYMENT.md" -ForegroundColor Cyan
}

# Main execution
switch ($Component.ToLower()) {
    "backend" {
        Deploy-Backend
    }
    "frontend" {
        Deploy-Frontend
    }
    "mobile" {
        Deploy-MobileApp
    }
    "all" {
        Deploy-Backend
        Deploy-Frontend  
        Deploy-MobileApp
        Show-PostDeploymentInstructions
    }
    default {
        Write-Host "❌ Invalid component. Use: backend, frontend, mobile, or all" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Happy Deploying!" -ForegroundColor Magenta
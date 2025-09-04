# PowerShell script to prepare for deployment
# Run this script to commit deployment configuration files

Write-Host "🚀 Preparing Chat App for Deployment..." -ForegroundColor Green

# Check if git is initialized
if (!(Test-Path .git)) {
    Write-Host "❌ Git not initialized. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Add all deployment configuration files
Write-Host "📁 Adding deployment configuration files..." -ForegroundColor Yellow

git add backend/railway.json
git add frontend/.env.production  
git add frontend/netlify.toml
git add ionicapp/vercel.json
git add ionicapp/src/environments/environment.prod.ts
git add DEPLOYMENT_GUIDE.md
git add README.md

# Commit the changes
Write-Host "💾 Committing deployment configuration..." -ForegroundColor Yellow
git commit -m "Add deployment configuration for Railway, Netlify, and Vercel

- Add Railway configuration for backend deployment
- Add Netlify configuration for React frontend
- Add Vercel configuration for Ionic app
- Update production environment files
- Add comprehensive deployment guide"

Write-Host "✅ Deployment configuration committed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "2. Create accounts on Railway, Netlify, and Vercel" -ForegroundColor White
Write-Host "3. Follow the DEPLOYMENT_GUIDE.md for detailed deployment steps" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read DEPLOYMENT_GUIDE.md for complete deployment instructions!" -ForegroundColor Green
#!/bin/bash

# Chat App Deployment Script for Linux/Mac
# This script helps automate the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default values
COMPONENT="all"
BACKEND_URL=""
FRONTEND_URL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --component)
            COMPONENT="$2"
            shift 2
            ;;
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--component all|backend|frontend|mobile] [--backend-url URL] [--frontend-url URL]"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 Chat App Deployment Script${NC}"
echo -e "${CYAN}================================${NC}"

deploy_backend() {
    echo -e "${YELLOW}📦 Preparing Backend for Deployment...${NC}"
    
    cd backend
    
    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
        npm install -g @railway/cli
    else
        echo -e "${GREEN}✅ Railway CLI found${NC}"
    fi
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}📝 Initializing Git repository...${NC}"
        git init
        git add .
        git commit -m "Initial backend commit for deployment"
    fi
    
    # Create .env.example
    cat > .env.example << EOF
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
EOF
    
    echo -e "${GREEN}✅ Backend prepared for deployment${NC}"
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${NC}1. Push your code to GitHub${NC}"
    echo -e "${NC}2. Create new project on Railway.app${NC}"
    echo -e "${NC}3. Connect your GitHub repository${NC}"
    echo -e "${NC}4. Set environment variables in Railway dashboard${NC}"
    
    cd ..
}

deploy_frontend() {
    echo -e "${YELLOW}📦 Preparing Frontend for Deployment...${NC}"
    
    cd frontend
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    else
        echo -e "${GREEN}✅ Vercel CLI found${NC}"
    fi
    
    # Create production environment file
    if [ -n "$BACKEND_URL" ]; then
        cat > .env.production << EOF
VITE_API_URL=$BACKEND_URL/api
VITE_SOCKET_URL=$BACKEND_URL
EOF
        echo -e "${GREEN}✅ Created .env.production with backend URL: $BACKEND_URL${NC}"
    else
        cat > .env.production << EOF
VITE_API_URL=https://your-backend-url.up.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.up.railway.app
EOF
        echo -e "${YELLOW}⚠️  Created .env.production with placeholder URLs${NC}"
        echo -e "${YELLOW}   Update with your actual backend URL after backend deployment${NC}"
    fi
    
    # Install dependencies and build
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}🔨 Building for production...${NC}"
    npm run build
    
    echo -e "${GREEN}✅ Frontend prepared for deployment${NC}"
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${NC}1. Run 'vercel' to deploy${NC}"
    echo -e "${NC}2. Or push to GitHub and connect via Vercel dashboard${NC}"
    
    cd ..
}

deploy_mobile() {
    echo -e "${YELLOW}📦 Preparing Mobile App for Deployment...${NC}"
    
    cd ionicapp
    
    # Create production environment
    if [ -n "$BACKEND_URL" ]; then
        cat > src/environments/environment.prod.ts << EOF
export const environment = {
  production: true,
  apiUrl: '$BACKEND_URL/api',
  socketUrl: '$BACKEND_URL'
};
EOF
        echo -e "${GREEN}✅ Created production environment with backend URL: $BACKEND_URL${NC}"
    else
        cat > src/environments/environment.prod.ts << EOF
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.up.railway.app/api',
  socketUrl: 'https://your-backend-url.up.railway.app'
};
EOF
        echo -e "${YELLOW}⚠️  Created production environment with placeholder URLs${NC}"
    fi
    
    # Install dependencies and build
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}🔨 Building for production...${NC}"
    ionic build --prod
    
    echo -e "${GREEN}✅ Mobile app prepared for deployment${NC}"
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${NC}1. Deploy 'dist' folder to Vercel or Netlify${NC}"
    echo -e "${NC}2. Or build for mobile platforms:${NC}"
    echo -e "${NC}   - ionic capacitor add ios${NC}"
    echo -e "${NC}   - ionic capacitor add android${NC}"
    
    cd ..
}

show_post_deployment_instructions() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Preparation Complete!${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "${CYAN}📝 Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. BACKEND (Railway):${NC}"
    echo -e "${NC}   • Push code to GitHub${NC}"
    echo -e "${NC}   • Create project on railway.app${NC}"
    echo -e "${NC}   • Set environment variables${NC}"
    echo -e "${NC}   • Copy your Railway URL${NC}"
    echo ""
    echo -e "${YELLOW}2. FRONTEND (Vercel):${NC}"
    echo -e "${NC}   • Update .env.production with Railway URL${NC}"
    echo -e "${NC}   • Run 'vercel' or deploy via GitHub${NC}"
    echo -e "${NC}   • Copy your Vercel URL${NC}"
    echo ""
    echo -e "${YELLOW}3. UPDATE CORS:${NC}"
    echo -e "${NC}   • Add Vercel URL to Railway environment variables${NC}"
    echo -e "${NC}   • FRONTEND_URL=https://your-app.vercel.app${NC}"
    echo ""
    echo -e "${CYAN}📖 Full guide available in DEPLOYMENT.md${NC}"
}

# Main execution
case $COMPONENT in
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "mobile")
        deploy_mobile
        ;;
    "all")
        deploy_backend
        deploy_frontend
        deploy_mobile
        show_post_deployment_instructions
        ;;
    *)
        echo -e "${RED}❌ Invalid component. Use: backend, frontend, mobile, or all${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${MAGENTA}✨ Happy Deploying!${NC}"
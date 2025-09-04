#!/bin/bash

# Deployment Verification Script for Linux/Mac
# This script helps verify that your deployed chat app is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default values
BACKEND_URL=""
FRONTEND_URL=""
MOBILE_URL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --mobile-url)
            MOBILE_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 --backend-url URL [--frontend-url URL] [--mobile-url URL]"
            echo ""
            echo "Example:"
            echo "  $0 --backend-url https://myapp.up.railway.app --frontend-url https://myapp.vercel.app"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend URL is required${NC}"
    echo "Usage: $0 --backend-url URL [--frontend-url URL] [--mobile-url URL]"
    exit 1
fi

echo -e "${CYAN}🔍 Chat App Deployment Verification${NC}"
echo -e "${CYAN}===================================${NC}"

test_results=()
overall_status=true

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -en "${YELLOW}Testing: $description${NC}"
    
    if response=$(curl -s -w "%{http_code}" -m 10 "$url" -o /dev/null 2>&1); then
        if [ "$response" = "$expected_status" ]; then
            echo -e " ${GREEN}✅${NC}"
            test_results+=("PASS: $description")
            return 0
        else
            echo -e " ${RED}❌${NC}"
            test_results+=("FAIL: $description (Expected: $expected_status, Got: $response)")
            overall_status=false
            return 1
        fi
    else
        echo -e " ${RED}❌${NC}"
        test_results+=("FAIL: $description (Connection failed)")
        overall_status=false
        return 1
    fi
}

test_api_endpoint() {
    local base_url=$1
    local endpoint=$2
    local description=$3
    local method=${4:-GET}
    
    echo -en "${YELLOW}Testing: $description${NC}"
    
    local full_url="$base_url$endpoint"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -m 10 -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"testuser123","email":"test@example.com","password":"testpassword123"}' \
            "$full_url" -o /dev/null 2>&1)
    else
        response=$(curl -s -w "%{http_code}" -m 10 "$full_url" -o /dev/null 2>&1)
    fi
    
    if [ $? -eq 0 ] && [ "$response" -lt 400 ]; then
        echo -e " ${GREEN}✅${NC}"
        test_results+=("PASS: $description")
        return 0
    else
        echo -e " ${RED}❌${NC}"
        test_results+=("FAIL: $description (Status: $response)")
        overall_status=false
        return 1
    fi
}

echo ""
echo -e "${MAGENTA}🌐 Backend API Tests${NC}"
echo -e "${MAGENTA}-------------------${NC}"

# Test basic backend connectivity
test_endpoint "$BACKEND_URL" "Backend server connectivity"

# Test API endpoints
test_api_endpoint "$BACKEND_URL" "/api/auth/register" "Auth register endpoint" "POST"
test_api_endpoint "$BACKEND_URL" "/api/users" "Users endpoint (should require auth)"

echo ""
echo -e "${MAGENTA}🖥️  Frontend Tests${NC}"
echo -e "${MAGENTA}----------------${NC}"

if [ -n "$FRONTEND_URL" ]; then
    test_endpoint "$FRONTEND_URL" "Frontend accessibility"
    
    # Test if frontend can reach API
    echo -en "${YELLOW}Testing: Frontend API configuration${NC}"
    if curl -s -m 10 "$FRONTEND_URL" | grep -q "$(echo "$BACKEND_URL" | sed 's|https\?://||')"; then
        echo -e " ${GREEN}✅${NC}"
        test_results+=("PASS: Frontend API configuration")
    else
        echo -e " ${YELLOW}⚠️${NC}"
        test_results+=("WARN: Could not verify API configuration in frontend")
    fi
else
    echo -e "${GRAY}⏭️  Frontend URL not provided, skipping frontend tests${NC}"
fi

echo ""
echo -e "${MAGENTA}📱 Mobile App Tests${NC}"
echo -e "${MAGENTA}------------------${NC}"

if [ -n "$MOBILE_URL" ]; then
    test_endpoint "$MOBILE_URL" "Mobile app accessibility"
else
    echo -e "${GRAY}⏭️  Mobile URL not provided, skipping mobile tests${NC}"
fi

echo ""
echo -e "${MAGENTA}🔧 CORS Tests${NC}"
echo -e "${MAGENTA}-------------${NC}"

if [ -n "$FRONTEND_URL" ]; then
    echo -en "${YELLOW}Testing: CORS configuration${NC}"
    
    response=$(curl -s -w "%{http_code}" -m 10 \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type, Authorization" \
        -X OPTIONS \
        "$BACKEND_URL/api/auth/login" -o /dev/null 2>&1)
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        echo -e " ${GREEN}✅${NC}"
        test_results+=("PASS: CORS configuration")
    else
        echo -e " ${RED}❌${NC}"
        test_results+=("FAIL: CORS configuration (Status: $response)")
        overall_status=false
    fi
fi

echo ""
echo -e "${CYAN}📊 Test Results Summary${NC}"
echo -e "${CYAN}=======================${NC}"
echo ""

pass_count=0
fail_count=0
warn_count=0

for result in "${test_results[@]}"; do
    if [[ $result == PASS:* ]]; then
        echo -e "${GREEN}✅ ${result#PASS: }${NC}"
        ((pass_count++))
    elif [[ $result == FAIL:* ]]; then
        echo -e "${RED}❌ ${result#FAIL: }${NC}"
        ((fail_count++))
    elif [[ $result == WARN:* ]]; then
        echo -e "${YELLOW}⚠️  ${result#WARN: }${NC}"
        ((warn_count++))
    fi
done

echo ""
echo -e "${CYAN}📈 Overall Results:${NC}"
echo -e "  ${GREEN}✅ Passed: $pass_count${NC}"
if [ $warn_count -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Warnings: $warn_count${NC}"
fi
if [ $fail_count -gt 0 ]; then
    echo -e "  ${RED}❌ Failed: $fail_count${NC}"
fi

echo ""
if $overall_status && [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 Congratulations! Your deployment appears to be working correctly!${NC}"
    echo ""
    echo -e "${CYAN}🔗 Your Live URLs:${NC}"
    echo -e "  Backend API: ${NC}$BACKEND_URL${NC}"
    if [ -n "$FRONTEND_URL" ]; then
        echo -e "  Frontend: ${NC}$FRONTEND_URL${NC}"
    fi
    if [ -n "$MOBILE_URL" ]; then
        echo -e "  Mobile App: ${NC}$MOBILE_URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Some issues were found with your deployment.${NC}"
    echo -e "${YELLOW}Please review the failed tests above and check:${NC}"
    echo -e "  ${NC}• Environment variables are set correctly${NC}"
    echo -e "  ${NC}• CORS configuration includes your frontend URL${NC}"
    echo -e "  ${NC}• All services are running and accessible${NC}"
fi

echo ""
echo -e "${CYAN}💡 Next Steps:${NC}"
echo -e "  ${NC}• Test user registration and login manually${NC}"
echo -e "  ${NC}• Try real-time messaging features${NC}"
echo -e "  ${NC}• Share your app with friends!${NC}"

echo ""
echo -e "${MAGENTA}✨ Happy chatting!${NC}"
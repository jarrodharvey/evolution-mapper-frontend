#!/bin/bash

# Evolution Mapper Frontend - DigitalOcean Deployment Script
set -e  # Exit on any error

APP_NAME="evolution-mapper-frontend"
REPO="jarrodharvey/evolution-mapper-frontend"
REGION="nyc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Evolution Mapper Frontend Deployment Script${NC}"
echo "======================================================="

# Check if doctl is installed and authenticated
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check authentication
if ! doctl auth list &> /dev/null; then
    echo -e "${RED}❌ DigitalOcean CLI not authenticated. Run: doctl auth init${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"

# Load environment variables from .env file
echo -e "${YELLOW}🔧 Loading environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with:"
    echo "REACT_APP_BACKEND_URL=your_backend_url"
    echo "REACT_APP_API_KEY=your_api_key"
    exit 1
fi

# Source .env file and extract variables
BACKEND_URL=$(grep "^DIGITAL_OCEAN_REACT_APP_BACKEND_URL=" .env | cut -d '=' -f2 || grep "^REACT_APP_BACKEND_URL=" .env | cut -d '=' -f2)
API_KEY=$(grep "^REACT_APP_API_KEY=" .env | cut -d '=' -f2)

if [ -z "$BACKEND_URL" ] || [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ Missing required environment variables in .env file${NC}"
    echo "Required: REACT_APP_BACKEND_URL and REACT_APP_API_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo "   Backend URL: $BACKEND_URL"
echo "   API Key: ${API_KEY:0:8}..."

# Build the project
echo -e "${YELLOW}🏗️  Building project...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# Check if app already exists
echo -e "${YELLOW}🔍 Checking for existing app...${NC}"
APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}' || echo "")

# Create app spec
create_app_spec() {
    cat > /tmp/app.yaml << EOF
name: $APP_NAME
region: $REGION
static_sites:
- build_command: npm run build
  catchall_document: index.html
  environment_slug: node-js
  github:
    branch: main
    deploy_on_push: true
    repo: $REPO
  name: frontend
  output_dir: /build
  source_dir: /
envs:
- key: REACT_APP_BACKEND_URL
  scope: BUILD_TIME
  value: "$BACKEND_URL"
- key: REACT_APP_API_KEY
  scope: BUILD_TIME
  value: "$API_KEY"
EOF
}

if [ -z "$APP_ID" ]; then
    # Create new app
    echo -e "${YELLOW}🆕 Creating new DigitalOcean app...${NC}"
    create_app_spec
    
    APP_INFO=$(doctl apps create --spec /tmp/app.yaml --format ID,DefaultIngress --no-header)
    APP_ID=$(echo "$APP_INFO" | awk '{print $1}')
    APP_URL=$(echo "$APP_INFO" | awk '{print $2}')
    
    echo -e "${GREEN}✅ App created successfully${NC}"
    echo "   App ID: $APP_ID"
    echo "   URL: $APP_URL"
else
    # Update existing app
    echo -e "${YELLOW}🔄 Updating existing app (ID: $APP_ID)...${NC}"
    create_app_spec
    
    doctl apps update "$APP_ID" --spec /tmp/app.yaml
    APP_URL=$(doctl apps get "$APP_ID" --format DefaultIngress --no-header)
    
    echo -e "${GREEN}✅ App updated successfully${NC}"
fi

# Clean up temporary files
rm -f /tmp/app.yaml

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Monitoring deployment...${NC}"
echo "This may take a few minutes..."

TIMEOUT=600  # 10 minutes timeout
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    DEPLOYMENT_STATUS=$(doctl apps get "$APP_ID" --format "In Progress Deployment ID" --no-header)
    
    if [ -z "$DEPLOYMENT_STATUS" ] || [ "$DEPLOYMENT_STATUS" = "<nil>" ]; then
        echo -e "${GREEN}✅ Deployment completed!${NC}"
        break
    fi
    
    echo -n "."
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "\n${YELLOW}⚠️  Deployment is taking longer than expected${NC}"
    echo "You can monitor progress manually with:"
    echo "doctl apps get $APP_ID"
else
    echo ""
fi

# Final status
echo ""
echo -e "${GREEN}🎉 Deployment Process Complete!${NC}"
echo "======================================================="
echo -e "${GREEN}🌐 App URL:${NC} $APP_URL"
echo -e "${GREEN}📱 App ID:${NC} $APP_ID"
echo ""
echo -e "${YELLOW}📊 To monitor your app:${NC}"
echo "   doctl apps get $APP_ID"
echo ""
echo -e "${YELLOW}🔄 To redeploy:${NC}"
echo "   ./deploy.sh"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
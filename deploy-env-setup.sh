#!/bin/bash

# DigitalOcean App Environment Variables Setup
APP_ID="59a84466-36c2-48ea-bfc3-e67c1c63c36c"

echo "Setting up environment variables for DigitalOcean App..."
echo "App ID: $APP_ID"
echo ""

# Prompt for backend URL
echo "Enter your backend URL (e.g., https://your-backend.com):"
read -r BACKEND_URL

# Prompt for API key  
echo "Enter your API key:"
read -r API_KEY

echo ""
echo "Setting environment variables..."

# Update environment variables
doctl apps update-env $APP_ID --env "REACT_APP_BACKEND_URL=$BACKEND_URL"
doctl apps update-env $APP_ID --env "REACT_APP_API_KEY=$API_KEY"

echo ""
echo "Environment variables set successfully!"
echo "Triggering new deployment..."

# Trigger a new deployment
doctl apps create-deployment $APP_ID

echo ""
echo "Deployment started. You can monitor progress with:"
echo "doctl apps get $APP_ID"
echo ""
echo "Your app will be available at:"
echo "https://evolution-mapper-frontend-lyv9e.ondigitalocean.app"
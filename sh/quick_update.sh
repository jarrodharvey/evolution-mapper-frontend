#!/bin/bash

# Quick update script for DigitalOcean app deployment
# Commits current changes and triggers deployment via doctl

set -e

APP_NAME="evolution-mapper-frontend"

echo "🚀 Starting quick update deployment..."

# Check if doctl is available
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Falling back to git-only deployment..."
    echo "📦 Adding changes..."
    git add .
    
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "💾 Committing changes..."
    git commit -m "Quick update: $TIMESTAMP

🤖 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo "⬆️ Pushing to main branch..."
    git push origin main
    echo "✅ Changes pushed to Git. Check DigitalOcean app dashboard for automatic deployment."
    exit 0
fi

# Add all changes
echo "📦 Adding changes..."
git add .

# Commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "💾 Committing changes..."
git commit -m "Quick update: $TIMESTAMP

🤖 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main branch
echo "⬆️ Pushing to main branch..."
git push origin main

# Get the app ID
echo "🔍 Finding DigitalOcean app..."
APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}' || echo "")

if [ -z "$APP_ID" ]; then
    echo "❌ Could not find app '$APP_NAME' on DigitalOcean"
    echo "✅ Changes pushed to Git. App will deploy automatically via Git integration."
    exit 0
fi

echo "📱 Found app ID: $APP_ID"

# Trigger a new deployment
echo "🚀 Triggering DigitalOcean deployment..."
doctl apps create-deployment "$APP_ID"

echo "✅ Deployment triggered! Monitor progress with:"
echo "   doctl apps get $APP_ID"
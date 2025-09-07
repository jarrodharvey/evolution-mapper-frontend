#!/bin/bash

# Quick update script for DigitalOcean app deployment
# Commits current changes and triggers deployment

set -e

echo "🚀 Starting quick update deployment..."

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

echo "✅ Deployment triggered! Check DigitalOcean app dashboard for deployment status."
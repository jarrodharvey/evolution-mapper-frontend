#!/bin/bash

# Quick push script: Merge development into main and push to trigger DigitalOcean deployment
# This script merges the development branch into main and pushes to origin,
# which triggers the DigitalOcean App Platform deployment pipeline.

set -e  # Exit on any error

echo "🚀 Starting quick push deployment process..."

# Safety check: Ensure we're on development branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "❌ Error: Must be on development branch. Currently on: $CURRENT_BRANCH"
    exit 1
fi

# Safety check: Ensure working directory is clean
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "❌ Error: Working directory has uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

echo "✅ On development branch with clean working directory"

# Check if main branch exists
if ! git show-ref --verify --quiet refs/heads/main; then
    echo "❌ Error: main branch does not exist locally"
    exit 1
fi

echo "📥 Switching to main branch..."
git checkout main

echo "🔄 Pulling latest changes from origin/main..."
git pull origin main

echo "🔀 Merging development into main..."
if git merge development --no-edit; then
    echo "✅ Successfully merged development into main"
else
    echo "❌ Merge failed. Please resolve conflicts manually."
    echo "💡 Run: git merge --abort to cancel, then resolve conflicts on development branch"
    exit 1
fi

echo "📤 Pushing main to origin (triggering DigitalOcean deployment)..."
git push origin main

echo "📝 Switching back to development branch..."
git checkout development

echo "🎉 Deployment triggered successfully!"
echo "📍 Check deployment status at: https://cloud.digitalocean.com/apps"
echo "🌐 App will be available at: https://evolution-mapper-frontend-lyv9e.ondigitalocean.app"
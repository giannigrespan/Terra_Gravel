#!/bin/bash

# 🔧 GitHub Actions Secrets Setup Script
# This script helps you configure GitHub secrets for CI/CD workflows

set -e

echo "🔧 GitHub Actions Secrets Setup"
echo "================================"
echo ""
echo "This script will help you configure secrets for TerraGravel CI/CD"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "Or on macOS: brew install gh"
    echo "Or on Linux: sudo apt install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local description=$2
    local default=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔑 $name"
    echo "   $description"
    echo ""

    if [ -n "$default" ]; then
        read -p "   Value (default: $default): " value
        value=${value:-$default}
    else
        read -p "   Value: " value
    fi

    if [ -z "$value" ]; then
        echo "   ⏭️  Skipped (empty value)"
        return
    fi

    echo "$value" | gh secret set "$name" --repo "$REPO"
    echo "   ✅ Set successfully"
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VERCEL SECRETS (Required for Backend Deploy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To get these values:"
echo "1. Install Vercel CLI: npm install -g vercel"
echo "2. Login: vercel login"
echo "3. Link project: cd backend && vercel link"
echo "4. Get IDs: vercel --org-id && vercel --project-id"
echo "5. Create token: https://vercel.com/account/tokens"
echo ""

read -p "Do you want to set Vercel secrets now? (y/n): " setup_vercel

if [ "$setup_vercel" = "y" ]; then
    set_secret "VERCEL_TOKEN" "Get from: https://vercel.com/account/tokens"
    set_secret "VERCEL_ORG_ID" "Get from: vercel --org-id"
    set_secret "VERCEL_PROJECT_ID" "Get from: vercel --project-id"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  DATABASE SECRETS (Required for Migrations)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get your Neon PostgreSQL connection string from:"
echo "https://console.neon.tech → Your project → Connection string"
echo ""
echo "Format: postgres://user:pass@host:5432/dbname?sslmode=require"
echo ""

read -p "Do you want to set database secrets now? (y/n): " setup_db

if [ "$setup_db" = "y" ]; then
    set_secret "DATABASE_URL" "Neon PostgreSQL connection string"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 FLUTTER SECRETS (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API_BASE_URL: Production API URL (defaults to Vercel URL if not set)"
echo ""

read -p "Do you want to set Flutter secrets now? (y/n): " setup_flutter

if [ "$setup_flutter" = "y" ]; then
    set_secret "API_BASE_URL" "Production API URL" "https://terragravel.vercel.app/api/v1"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To verify secrets were set correctly:"
echo "  gh secret list --repo $REPO"
echo ""
echo "To view/edit secrets in GitHub UI:"
echo "  https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "Next steps:"
echo "1. Push code to main branch"
echo "2. Check Actions tab for workflow runs"
echo "3. Download built APKs from Releases or Artifacts"
echo ""
echo "Need help? See: .github/README.md"
echo ""

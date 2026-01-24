@echo off
REM GitHub Actions Secrets Setup Script (Windows)
REM This script helps you configure GitHub secrets for CI/CD workflows

setlocal enabledelayedexpansion

echo.
echo 🔧 GitHub Actions Secrets Setup
echo ================================
echo.
echo This script will help you configure secrets for TerraGravel CI/CD
echo.

REM Check if gh CLI is installed
where gh >nul 2>nul
if errorlevel 1 (
    echo ❌ GitHub CLI (gh) is not installed
    echo.
    echo Install it from: https://cli.github.com/
    echo.
    echo Or with winget: winget install GitHub.cli
    pause
    exit /b 1
)

REM Check if user is authenticated
gh auth status >nul 2>nul
if errorlevel 1 (
    echo ❌ Not authenticated with GitHub CLI
    echo.
    echo Run: gh auth login
    pause
    exit /b 1
)

echo ✅ GitHub CLI is installed and authenticated
echo.

REM Get repository info
for /f "tokens=*" %%i in ('gh repo view --json nameWithOwner -q .nameWithOwner') do set REPO=%%i
echo 📦 Repository: %REPO%
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📋 VERCEL SECRETS (Required for Backend Deploy)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo To get these values:
echo 1. Install Vercel CLI: npm install -g vercel
echo 2. Login: vercel login
echo 3. Link project: cd backend ^&^& vercel link
echo 4. Get IDs: vercel --org-id ^&^& vercel --project-id
echo 5. Create token: https://vercel.com/account/tokens
echo.

set /p setup_vercel="Do you want to set Vercel secrets now? (y/n): "

if /i "%setup_vercel%"=="y" (
    echo.
    echo 🔑 VERCEL_TOKEN
    echo    Get from: https://vercel.com/account/tokens
    set /p vercel_token="   Value: "
    if not "!vercel_token!"=="" (
        echo !vercel_token! | gh secret set VERCEL_TOKEN --repo %REPO%
        echo    ✅ Set successfully
    )

    echo.
    echo 🔑 VERCEL_ORG_ID
    echo    Get from: vercel --org-id
    set /p vercel_org="   Value: "
    if not "!vercel_org!"=="" (
        echo !vercel_org! | gh secret set VERCEL_ORG_ID --repo %REPO%
        echo    ✅ Set successfully
    )

    echo.
    echo 🔑 VERCEL_PROJECT_ID
    echo    Get from: vercel --project-id
    set /p vercel_project="   Value: "
    if not "!vercel_project!"=="" (
        echo !vercel_project! | gh secret set VERCEL_PROJECT_ID --repo %REPO%
        echo    ✅ Set successfully
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🗄️  DATABASE SECRETS (Required for Migrations)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Get your Neon PostgreSQL connection string from:
echo https://console.neon.tech -^> Your project -^> Connection string
echo.
echo Format: postgres://user:pass@host:5432/dbname?sslmode=require
echo.

set /p setup_db="Do you want to set database secrets now? (y/n): "

if /i "%setup_db%"=="y" (
    echo.
    echo 🔑 DATABASE_URL
    echo    Neon PostgreSQL connection string
    set /p db_url="   Value: "
    if not "!db_url!"=="" (
        echo !db_url! | gh secret set DATABASE_URL --repo %REPO%
        echo    ✅ Set successfully
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📱 FLUTTER SECRETS (Optional)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo API_BASE_URL: Production API URL (defaults to Vercel URL if not set)
echo.

set /p setup_flutter="Do you want to set Flutter secrets now? (y/n): "

if /i "%setup_flutter%"=="y" (
    echo.
    echo 🔑 API_BASE_URL
    echo    Production API URL
    set /p api_url="   Value (default: https://terragravel.vercel.app/api/v1): "
    if "!api_url!"=="" set api_url=https://terragravel.vercel.app/api/v1
    echo !api_url! | gh secret set API_BASE_URL --repo %REPO%
    echo    ✅ Set successfully
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Setup Complete!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo To verify secrets were set correctly:
echo   gh secret list --repo %REPO%
echo.
echo To view/edit secrets in GitHub UI:
echo   https://github.com/%REPO%/settings/secrets/actions
echo.
echo Next steps:
echo 1. Push code to main branch
echo 2. Check Actions tab for workflow runs
echo 3. Download built APKs from Releases or Artifacts
echo.
echo Need help? See: .github\README.md
echo.

pause

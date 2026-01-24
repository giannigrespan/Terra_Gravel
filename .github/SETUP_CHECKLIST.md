# ✅ CI/CD Setup Checklist

Complete this checklist to set up GitHub Actions workflows for TerraGravel.

---

## 📋 Pre-Setup Requirements

### Required Accounts
- [ ] GitHub account (you have this!)
- [ ] Vercel account (https://vercel.com - Sign up with GitHub)
- [ ] Neon account (https://neon.tech - PostgreSQL cloud database)

### Local Tools
- [ ] Git installed and configured
- [ ] GitHub CLI (`gh`) installed: https://cli.github.com/
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Node.js 20+ installed

---

## 🔧 Step 1: Vercel Setup

### 1.1 Create Vercel Project
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repository
- [ ] Set Root Directory to: `backend`
- [ ] Click "Deploy" (it's okay if it fails - we'll configure env vars next)

### 1.2 Get Vercel IDs
```bash
# Login to Vercel
vercel login

# Go to backend directory
cd backend

# Link project
vercel link

# Get organization ID
vercel --org-id

# Get project ID
vercel --project-id
```

- [ ] Organization ID saved: `_________________________`
- [ ] Project ID saved: `_________________________`

### 1.3 Create Vercel Token
- [ ] Go to: https://vercel.com/account/tokens
- [ ] Click "Create Token"
- [ ] Name: `GitHub Actions`
- [ ] Scope: Select your account/org
- [ ] Expiration: No expiration
- [ ] Click "Create Token"
- [ ] Copy token immediately (you won't see it again!)
- [ ] Token saved: `_________________________`

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Neon Database
- [ ] Go to https://console.neon.tech
- [ ] Click "Create a new project"
- [ ] Project name: `terragravel-db`
- [ ] Region: Europe (Frankfurt) or nearest
- [ ] PostgreSQL version: 15
- [ ] Click "Create project"

### 2.2 Get Connection String
- [ ] Open project in Neon console
- [ ] Click "Connection string"
- [ ] Copy the connection string
- [ ] Format should be: `postgres://user:pass@host:5432/dbname?sslmode=require`
- [ ] Connection string saved: `_________________________`

### 2.3 Run Initial Migrations
```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your_connection_string_here"

# Or on Windows:
set DATABASE_URL=your_connection_string_here

# Run migrations via Neon SQL Editor or psql
psql $DATABASE_URL -f db/init_db.sql
psql $DATABASE_URL -f db/seed_db.sql
psql $DATABASE_URL -f db/migrations/003_create_messaging_tables.sql
```

- [ ] `init_db.sql` executed successfully
- [ ] `seed_db.sql` executed successfully
- [ ] `003_create_messaging_tables.sql` executed successfully
- [ ] Verified tables exist with: `SELECT COUNT(*) FROM users;`

---

## 🔑 Step 3: Configure GitHub Secrets

### 3.1 Authenticate GitHub CLI
```bash
gh auth login
```
- [ ] GitHub CLI authenticated

### 3.2 Set Secrets (Automated)

**Option A: Use Setup Script (Recommended)**
```bash
# On Linux/Mac:
chmod +x .github/setup-secrets.sh
.github/setup-secrets.sh

# On Windows:
.github\setup-secrets.cmd
```

**Option B: Set Manually**
```bash
# Vercel secrets
echo "your_vercel_token" | gh secret set VERCEL_TOKEN
echo "your_org_id" | gh secret set VERCEL_ORG_ID
echo "your_project_id" | gh secret set VERCEL_PROJECT_ID

# Database secret
echo "postgres://..." | gh secret set DATABASE_URL

# Optional: API URL
echo "https://terragravel.vercel.app/api/v1" | gh secret set API_BASE_URL
```

### 3.3 Verify Secrets
```bash
gh secret list
```

- [ ] `VERCEL_TOKEN` set
- [ ] `VERCEL_ORG_ID` set
- [ ] `VERCEL_PROJECT_ID` set
- [ ] `DATABASE_URL` set
- [ ] `API_BASE_URL` set (optional)

---

## 🚀 Step 4: Test Workflows

### 4.1 Enable GitHub Actions
- [ ] Go to repository → Settings → Actions → General
- [ ] Under "Actions permissions", select "Allow all actions and reusable workflows"
- [ ] Click "Save"

### 4.2 Push to Main Branch
```bash
# Make sure you're on main branch
git checkout main

# Or merge your feature branch
git checkout main
git merge your-feature-branch

# Push to trigger workflows
git push origin main
```

- [ ] Pushed to main branch

### 4.3 Monitor Workflow Runs
- [ ] Go to: https://github.com/YOUR_USERNAME/terragravel/actions
- [ ] Check "Deploy Backend to Vercel" workflow
- [ ] Check "Build Flutter App" workflow
- [ ] Verify both workflows completed successfully

### 4.4 Verify Deployment

**Backend Health Check:**
```bash
curl https://your-project.vercel.app
# Should return: {"message": "Welcome to the TerraGravel API!", "status": "ok"}
```

- [ ] Backend health check passed

**Download APK:**
- [ ] Go to Actions → Latest workflow run → Artifacts
- [ ] Download `android-release-apk`
- [ ] Or check Releases page for latest release

---

## 🧪 Step 5: Test CI Pipeline

### 5.1 Create Test PR
```bash
# Create feature branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: CI pipeline"
git push origin test/ci-pipeline
```

### 5.2 Open Pull Request
- [ ] Go to repository → Pull Requests → New pull request
- [ ] Base: `main`, Compare: `test/ci-pipeline`
- [ ] Create pull request
- [ ] Wait for CI checks to complete

### 5.3 Verify CI Results
- [ ] Backend CI passed
- [ ] Flutter CI passed
- [ ] Security scan completed
- [ ] Code quality checks passed

### 5.4 Merge PR
- [ ] Merge pull request
- [ ] Delete branch
- [ ] Verify deploy workflows trigger on main

---

## 📱 Step 6: Flutter App Configuration

### 6.1 Update API Base URL
Edit `terragravel_app/lib/services/api_service.dart`:

```dart
class ApiService {
  // Change this to your Vercel URL
  static const String _baseUrl = 'https://your-project.vercel.app/api/v1';

  // Or use environment variable:
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://your-project.vercel.app/api/v1',
  );
}
```

- [ ] Updated API base URL in Flutter app
- [ ] Committed and pushed changes

### 6.2 Test Mobile App
- [ ] Download latest APK from Releases
- [ ] Install on Android device
- [ ] Open app
- [ ] Verify login works
- [ ] Verify RideMatch loads
- [ ] Verify messaging works

---

## 🔄 Step 7: Database Migration Workflow

### 7.1 Test Manual Migration
- [ ] Go to Actions → "Database Migration" → Run workflow
- [ ] Select migration file: `db/seed_db.sql`
- [ ] Environment: `production`
- [ ] Click "Run workflow"
- [ ] Verify workflow completes successfully

---

## 🎯 Step 8: Optional Enhancements

### 8.1 Branch Protection Rules
- [ ] Go to Settings → Branches
- [ ] Click "Add rule"
- [ ] Branch name pattern: `main`
- [ ] Enable: "Require status checks to pass before merging"
- [ ] Select: Backend CI, Flutter CI
- [ ] Enable: "Require branches to be up to date before merging"
- [ ] Click "Create"

### 8.2 Custom Domain (Vercel)
- [ ] Vercel Dashboard → Your project → Settings → Domains
- [ ] Add custom domain: `api.terragravel.com`
- [ ] Configure DNS CNAME record
- [ ] Update Flutter API_BASE_URL to use custom domain

### 8.3 Status Badges
Update README.md badges with your repository name:

```markdown
![Deploy Backend](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/deploy-backend.yml/badge.svg)
![Build Flutter](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/build-flutter.yml/badge.svg)
![CI Pipeline](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/ci.yml/badge.svg)
```

- [ ] Updated status badges in README

---

## 🎉 Final Verification

### Production Checklist
- [ ] Backend deployed and accessible
- [ ] Database migrations completed
- [ ] APK builds successfully
- [ ] API health check passes
- [ ] Login endpoint works
- [ ] RideMatch endpoints work
- [ ] Messaging endpoints work
- [ ] CI pipeline runs on PRs
- [ ] Auto-deploy works on main branch
- [ ] All GitHub Actions secrets configured
- [ ] Documentation updated with production URLs

### Monitoring Setup
- [ ] Monitor Vercel logs: `vercel logs --follow`
- [ ] Check Neon database metrics: https://console.neon.tech
- [ ] Set up error tracking (optional): Sentry, LogRocket
- [ ] Configure uptime monitoring (optional): UptimeRobot, Pingdom

---

## 📚 Reference Links

### Documentation
- [ ] Read: `.github/README.md` - CI/CD documentation
- [ ] Read: `DEPLOY_GUIDE.md` - Deployment guide
- [ ] Read: `README.md` - Project overview

### Dashboards
- [ ] Bookmark: Vercel Dashboard - https://vercel.com/dashboard
- [ ] Bookmark: Neon Console - https://console.neon.tech
- [ ] Bookmark: GitHub Actions - https://github.com/YOUR_USERNAME/terragravel/actions

### CLI Tools
- [ ] `gh` - GitHub CLI
- [ ] `vercel` - Vercel CLI
- [ ] `flutter` - Flutter SDK
- [ ] `psql` - PostgreSQL client

---

## 🆘 Troubleshooting

### Common Issues

**Workflow fails with "VERCEL_TOKEN not found"**
- [ ] Verify secret is set: `gh secret list`
- [ ] Re-add secret if needed
- [ ] Check secret name matches exactly (case-sensitive)

**Backend deploy succeeds but API returns 500**
- [ ] Check Vercel logs: `vercel logs`
- [ ] Verify DATABASE_URL is correct in Vercel env vars
- [ ] Ensure database migrations ran successfully

**Flutter build fails**
- [ ] Check Flutter version in workflow (3.19.0)
- [ ] Verify Java version is 17
- [ ] Check for Gradle errors in logs

**Database connection fails**
- [ ] Verify connection string includes `?sslmode=require`
- [ ] Check Neon project is active (not sleeping)
- [ ] Test connection locally: `psql $DATABASE_URL -c "SELECT 1"`

---

## ✅ Setup Complete!

Congratulations! Your CI/CD pipeline is now fully configured.

**Next Steps:**
1. Start developing features on feature branches
2. Create PRs to trigger CI checks
3. Merge to main to auto-deploy
4. Monitor workflows in Actions tab
5. Share APKs with beta testers from Releases

**Need Help?**
- Check `.github/README.md` for detailed documentation
- Review workflow logs in Actions tab
- Search GitHub issues for similar problems
- Create new issue if needed

---

*Last updated: January 24, 2026*

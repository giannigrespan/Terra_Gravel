# 🔄 GitHub Actions CI/CD Setup

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the TerraGravel application.

## 📋 Available Workflows

### 1. 🚀 Deploy Backend to Vercel (`deploy-backend.yml`)

**Trigger**: Automatic on push to `main`/`master` branch (when backend files change)

**What it does**:
- Installs Node.js dependencies
- Runs linting and tests
- Deploys backend to Vercel
- Notifies on success/failure

**Required Secrets**:
```
VERCEL_TOKEN          # Get from: https://vercel.com/account/tokens
VERCEL_ORG_ID         # Get from: vercel --org-id
VERCEL_PROJECT_ID     # Get from: vercel --project-id
```

**Setup**:
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Link project: `cd backend && vercel link`
4. Get IDs: `vercel --org-id` and `vercel --project-id`
5. Create token: https://vercel.com/account/tokens
6. Add secrets to GitHub: Settings → Secrets → Actions

---

### 2. 📱 Build Flutter App (`build-flutter.yml`)

**Trigger**: Automatic on push to `main`/`master` (when Flutter app changes)

**What it does**:
- Builds Android APK (release)
- Builds iOS app (release, no codesigning)
- Uploads APK as artifact (downloadable for 30 days)
- Creates GitHub Release with APK attached

**Required Secrets**:
```
API_BASE_URL          # Optional: Production API URL (defaults to Vercel URL)
```

**Download builds**:
- Go to Actions tab → Latest workflow run → Artifacts
- Or download from Releases page

---

### 3. 🗄️ Database Migration (`db-migration.yml`)

**Trigger**: Manual only (workflow_dispatch)

**What it does**:
- Runs SQL migration files against Neon database
- Shows migration preview before execution
- Verifies migration success
- Counts records in key tables

**Required Secrets**:
```
DATABASE_URL          # Neon PostgreSQL connection string
```

**How to use**:
1. Go to Actions tab
2. Select "Database Migration" workflow
3. Click "Run workflow"
4. Choose:
   - Migration file (e.g., `db/init_db.sql`)
   - Environment (production/staging/development)
5. Click "Run workflow" button

**Example migration files**:
- `db/init_db.sql` - Initial schema
- `db/seed_db.sql` - Seed data
- `db/migrations/003_create_messaging_tables.sql` - Messaging tables

---

### 4. 🔄 CI Pipeline (`ci.yml`)

**Trigger**: Automatic on pull requests and pushes to `develop`

**What it does**:
- **Backend CI**:
  - Runs tests with PostgreSQL test database
  - Linting and code analysis
  - Security audit (`npm audit`)
  - Checks for outdated dependencies

- **Flutter CI**:
  - Runs Dart analyzer
  - Checks code formatting
  - Runs tests
  - Builds debug APK (smoke test)

- **Security Scan**:
  - Runs Trivy vulnerability scanner
  - Uploads results to GitHub Security tab

- **Code Quality**:
  - Counts lines of code
  - Lists TODO/FIXME comments

**No secrets required** - uses test databases

---

## 🔧 Setup Instructions

### Initial Setup (One-time)

1. **Add GitHub Secrets**:
   ```
   Repository → Settings → Secrets and variables → Actions → New repository secret
   ```

   Required secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `DATABASE_URL`

2. **Enable GitHub Actions**:
   - Should be enabled by default
   - Check: Settings → Actions → General → "Allow all actions"

3. **Configure Branch Protection** (Optional but recommended):
   ```
   Settings → Branches → Add rule
   Branch name pattern: main
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Select: Backend CI, Flutter CI
   ```

---

## 📊 Workflow Status Badges

Add these to your main README.md:

```markdown
![Deploy Backend](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/deploy-backend.yml/badge.svg)
![Build Flutter](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/build-flutter.yml/badge.svg)
![CI Pipeline](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/ci.yml/badge.svg)
```

---

## 🎯 Workflow Triggers Summary

| Workflow | Push to main | Pull Request | Manual | Schedule |
|----------|--------------|--------------|--------|----------|
| Deploy Backend | ✅ (backend/** only) | ❌ | ✅ | ❌ |
| Build Flutter | ✅ (app/** only) | ✅ | ✅ | ❌ |
| Database Migration | ❌ | ❌ | ✅ | ❌ |
| CI Pipeline | ✅ (develop only) | ✅ | ❌ | ❌ |

---

## 🐛 Troubleshooting

### Backend Deploy Fails

**Error**: `VERCEL_TOKEN not found`
```bash
# Solution: Add token to GitHub secrets
vercel login
# Go to: https://vercel.com/account/tokens
# Create token → Add to GitHub Secrets
```

**Error**: `Project not found`
```bash
# Solution: Link Vercel project first
cd backend
vercel link
# Copy ORG_ID and PROJECT_ID to GitHub secrets
```

### Flutter Build Fails

**Error**: `Gradle build failed`
```bash
# Solution: Check Java version in workflow (should be 17)
# Or update Flutter version in workflow
```

**Error**: `Pod install failed` (iOS)
```bash
# Solution: Update CocoaPods version
# Or disable iOS builds by commenting out the job
```

### Database Migration Fails

**Error**: `Connection timeout`
```bash
# Solution: Check DATABASE_URL format
# Should be: postgres://user:pass@host:5432/dbname?sslmode=require
```

**Error**: `Permission denied`
```bash
# Solution: Ensure DATABASE_URL user has CREATE/ALTER permissions
# Or run migrations manually first time via Neon SQL Editor
```

---

## 🚀 Best Practices

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   ```

3. **Push and create PR**:
   ```bash
   git push origin feature/my-new-feature
   # Go to GitHub → Create Pull Request
   ```

4. **CI runs automatically**:
   - Backend CI checks Node.js code
   - Flutter CI checks Dart code
   - Security scan runs
   - All must pass before merge

5. **Merge to main**:
   - PR approved → Merge
   - Deploy Backend workflow runs automatically
   - Build Flutter workflow runs automatically
   - New APK available in Releases

### Database Changes

1. **Create migration file**:
   ```sql
   -- db/migrations/004_add_new_table.sql
   CREATE TABLE new_feature (
     id SERIAL PRIMARY KEY,
     -- ...
   );
   ```

2. **Test locally**:
   ```bash
   psql $LOCAL_DATABASE_URL -f db/migrations/004_add_new_table.sql
   ```

3. **Run via GitHub Actions**:
   - Actions → Database Migration → Run workflow
   - Choose file: `db/migrations/004_add_new_table.sql`
   - Choose environment: `production`

4. **Verify**:
   - Check workflow logs
   - Test API endpoints that use new table

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Flutter CI/CD Best Practices](https://docs.flutter.dev/deployment/cd)
- [Neon Database Migrations](https://neon.tech/docs/guides/migrations)

---

## 🔄 Workflow Maintenance

### Update Workflow Dependencies

**Update Flutter version**:
```yaml
# In build-flutter.yml and ci.yml
flutter-version: '3.19.0' # Update this
```

**Update Node.js version**:
```yaml
# In deploy-backend.yml and ci.yml
node-version: '20' # Update this
```

**Update GitHub Actions**:
```yaml
# Update action versions regularly
uses: actions/checkout@v4      # Check for v5
uses: actions/setup-node@v4    # Check for v5
```

### Monitor Workflow Performance

- **Check workflow run times**: Actions → Workflows → View run history
- **Optimize slow jobs**: Add caching, reduce test scope
- **Clean up old artifacts**: Settings → Actions → Artifact retention

---

*Last updated: January 23, 2026*

# Environment Variables Template

Copia e completa queste variabili d'ambiente per il deployment.

---

## 🚀 VERCEL - Environment Variables

**Vai su Vercel Dashboard → Settings → Environment Variables**

Aggiungi queste variabili una per una:

### ✅ OBBLIGATORIE

```
Name: NODE_ENV
Value: production
```

```
Name: DATABASE_URL
Value: [COPIA DA NEON - vedi sotto]
```

```
Name: JWT_SECRET
Value: [GENERA - vedi sotto]
```

---

### 📝 Come ottenere i valori

#### DATABASE_URL (da Neon)

1. Vai su https://neon.tech
2. Dashboard → tuo progetto → "Connection Details"
3. Copia la stringa "Connection String":

```
postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Esempio completo:**
```
postgres://terragravel_user:AbC123XyZ@ep-cool-mountain-123456.eu-central-1.aws.neon.tech/terragravel?sslmode=require
```

#### JWT_SECRET (generazione)

**Metodo 1 - Comando Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Metodo 2 - Online:**
https://generate-secret.vercel.app/64

**Esempio output:**
```
a3f2d9e8b7c6d5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8
```

---

### 🔧 OPZIONALI (con valori default)

Aggiungi solo se vuoi personalizzare:

```
Name: JWT_EXPIRES_IN
Value: 7d
```

```
Name: JWT_REFRESH_EXPIRES_IN
Value: 30d
```

```
Name: CORS_ORIGIN
Value: *
Note: In produzione, cambia con: https://tua-app-flutter.com
```

```
Name: RATE_LIMIT_MAX
Value: 100
```

```
Name: SWIPE_RATE_LIMIT_MAX
Value: 200
```

```
Name: FEEDBACK_RATE_LIMIT_MAX
Value: 10
```

---

## 🔐 GITHUB SECRETS

**Vai su GitHub → Terra_Gravel → Settings → Secrets and variables → Actions**

Clicca "New repository secret" e aggiungi:

### Per Deploy Automatico

```
Name: VERCEL_TOKEN
Value: [GENERA DA VERCEL]
```

**Come ottenere VERCEL_TOKEN:**
1. Vercel Dashboard → Settings → Tokens
2. Create Token → Name: "github-actions" → Scope: Full Account
3. Copia il token (visibile solo una volta!)

```
Name: VERCEL_ORG_ID
Value: [OTTIENI DA VERCEL CLI]
```

```
Name: VERCEL_PROJECT_ID
Value: [OTTIENI DA VERCEL CLI]
```

**Come ottenere ORG_ID e PROJECT_ID:**
```bash
cd backend
npm install -g vercel
vercel login
vercel link
cat .vercel/project.json
```

Output:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",     ← Copia questo
  "projectId": "prj_xxxxxxxxxxxxx"   ← Copia questo
}
```

```
Name: DATABASE_URL
Value: [STESSO DI VERCEL - Connection string Neon]
```

---

## 💻 SVILUPPO LOCALE (.env file)

Crea il file `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (opzione 1: locale)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_NAME=terragravel
DB_SSL=false

# Database (opzione 2: Neon per testing)
# DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_MAX=100
SWIPE_RATE_LIMIT_MAX=200
FEEDBACK_RATE_LIMIT_MAX=10
```

---

## ✅ Checklist Configurazione

### Neon Database
- [ ] Account creato
- [ ] Progetto "terragravel" creato
- [ ] PostGIS extension abilitata
- [ ] Schema importato (schema.sql)
- [ ] Connection string copiata

### Vercel
- [ ] Account creato
- [ ] Progetto importato
- [ ] Root directory = "backend"
- [ ] NODE_ENV = production
- [ ] DATABASE_URL configurato
- [ ] JWT_SECRET generato e configurato
- [ ] Deploy completato

### GitHub
- [ ] VERCEL_TOKEN aggiunto
- [ ] VERCEL_ORG_ID aggiunto
- [ ] VERCEL_PROJECT_ID aggiunto
- [ ] DATABASE_URL aggiunto

### Test
- [ ] `/health` endpoint risponde
- [ ] `/api/v1/auth/signup` funziona
- [ ] Database connesso (check logs)
- [ ] Auto-deploy da GitHub funziona

---

## 🎯 Quick Copy-Paste

### Vercel Environment Variables (formato bulk)

```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
JWT_SECRET=your-generated-secret-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=*
```

**Nota**: Vercel non supporta bulk import, devi aggiungerle una per una.

---

## 📞 Link Utili

- **Neon Console**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Secrets**: https://github.com/giannigrespan/Terra_Gravel/settings/secrets/actions
- **Secret Generator**: https://generate-secret.vercel.app/64

---

**Tempo stimato configurazione**: ~15 minuti

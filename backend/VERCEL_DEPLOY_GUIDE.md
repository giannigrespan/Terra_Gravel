# Guida Deploy Vercel - TerraGravel Backend

Guida completa per deployare il backend TerraGravel su Vercel con database PostgreSQL Neon.

---

## 📋 Prerequisiti

- Account GitHub (già configurato)
- Account Vercel (gratuito)
- Account Neon (gratuito per PostgreSQL)

---

## 🗄️ STEP 1: Setup Database Neon (PostgreSQL)

### 1.1 Crea Account Neon

1. Vai su [https://neon.tech](https://neon.tech)
2. Clicca "Sign Up" e usa GitHub per autenticarti
3. Verifica email se richiesto

### 1.2 Crea Nuovo Progetto

1. Dashboard Neon → "New Project"
2. Compila:
   - **Project name**: `terragravel`
   - **PostgreSQL version**: `15` o superiore
   - **Region**: Scegli la più vicina (es. `Europe (Frankfurt)` per l'Italia)
3. Clicca "Create Project"

### 1.3 Ottieni Connection String

Dopo la creazione vedrai la **Connection String**:

```
postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Copia questa stringa** - ti servirà dopo!

### 1.4 Abilita PostGIS

1. Nella dashboard Neon, vai su **"SQL Editor"**
2. Esegui questo comando:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

3. Clicca "Run" - vedrai "Success"

### 1.5 Importa Schema Database

Copia tutto il contenuto di `backend/src/db/schema.sql` e incollalo nell'SQL Editor di Neon.

**IMPORTANTE**: Rimuovi le prime righe (estensioni già create):

```sql
-- RIMUOVI QUESTE RIGHE (già eseguite sopra):
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Poi esegui il resto dello schema. Vedrai:
- ✅ Types created
- ✅ Tables created
- ✅ Indexes created
- ✅ Functions created
- ✅ Triggers created

---

## 🚀 STEP 2: Setup Vercel

### 2.1 Crea Account Vercel

1. Vai su [https://vercel.com](https://vercel.com)
2. Clicca "Sign Up" → "Continue with GitHub"
3. Autorizza Vercel ad accedere ai tuoi repository

### 2.2 Importa Progetto

1. Dashboard Vercel → "Add New..." → "Project"
2. **Import Git Repository**:
   - Cerca `Terra_Gravel`
   - Clicca "Import"

### 2.3 Configura Progetto

**Configure Project:**

- **Framework Preset**: `Other`
- **Root Directory**: `backend` ← **IMPORTANTE!**
- **Build Command**: `npm install` (o lascia vuoto)
- **Output Directory**: lascia vuoto
- **Install Command**: `npm install`

### 2.4 Aggiungi Environment Variables

Clicca su **"Environment Variables"** e aggiungi queste variabili:

#### Variables Obbligatorie:

| Name | Value | Descrizione |
|------|-------|-------------|
| `NODE_ENV` | `production` | Ambiente di esecuzione |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | Connection string da Neon (vedi sopra) |
| `JWT_SECRET` | `[genera un segreto casuale]` | Chiave segreta per JWT |
| `PORT` | `3000` | Porta server (opzionale, Vercel gestisce) |

#### Come generare JWT_SECRET:

**Opzione 1 - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opzione 2 - Online:**
Vai su https://generate-secret.vercel.app/64

Copia il risultato (es. `a3f2d9e8b7c6...`) e usalo come `JWT_SECRET`

#### Variables Opzionali:

| Name | Value | Default |
|------|-------|---------|
| `JWT_EXPIRES_IN` | `7d` | 7 giorni |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | 30 giorni |
| `CORS_ORIGIN` | `*` | Permetti tutti (cambia in prod) |
| `RATE_LIMIT_MAX` | `100` | Request per finestra |
| `SWIPE_RATE_LIMIT_MAX` | `200` | Swipe al giorno |

### 2.5 Deploy

1. Clicca **"Deploy"**
2. Vercel inizierà il build:
   - Installing dependencies...
   - Building...
   - Deploying...
3. Dopo 1-2 minuti vedrai: **"Congratulations!"** 🎉

### 2.6 Ottieni URL Deployment

Vercel ti assegnerà un URL tipo:
```
https://terra-gravel-backend.vercel.app
```

**Copia questo URL** - è il tuo API_BASE_URL!

---

## ✅ STEP 3: Verifica Deployment

### 3.1 Test Health Endpoint

Apri nel browser o usa curl:

```bash
curl https://terra-gravel-backend.vercel.app/health
```

**Output atteso:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 3.2 Test Database Connection

L'endpoint `/health` mostra anche se il database è connesso. Se vedi errori:

1. Vai su Vercel Dashboard → tuo progetto → **"Logs"**
2. Cerca errori tipo:
   - `Database connection failed` → Verifica DATABASE_URL
   - `PostGIS not found` → Verifica estensioni Neon

### 3.3 Test Signup API

```bash
curl -X POST https://terra-gravel-backend.vercel.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Output atteso:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid...",
      "username": "testuser",
      "email": "test@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## 🔧 STEP 4: Configura GitHub Actions (Deploy Automatico)

Il workflow `.github/workflows/deploy-backend.yml` è già configurato!

### 4.1 Ottieni Vercel Tokens

1. Vai su Vercel Dashboard → **Settings** → **Tokens**
2. Clicca "Create Token"
   - Name: `github-actions`
   - Scope: `Full Account`
3. **Copia il token** (lo vedrai solo una volta!)

### 4.2 Ottieni Project IDs

Nel terminale:

```bash
cd backend
npm install -g vercel
vercel login  # Fai login
vercel link   # Collega il progetto
```

Vercel creerà `.vercel/project.json` con:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

### 4.3 Aggiungi GitHub Secrets

1. Vai su GitHub → **Terra_Gravel** repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Clicca "New repository secret" e aggiungi:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | Token copiato al punto 4.1 |
| `VERCEL_ORG_ID` | `orgId` da `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` da `.vercel/project.json` |
| `DATABASE_URL` | Connection string Neon (stesso di Vercel) |

### 4.4 Test Deploy Automatico

Ora ogni push su `main` triggera il deploy automatico:

```bash
# Fai un piccolo cambiamento
echo "# Test" >> backend/README.md
git add .
git commit -m "test: Trigger auto deploy"
git push origin main
```

Vai su **GitHub Actions** e vedrai il workflow partire!

---

## 📱 STEP 5: Configura Flutter App

Aggiorna il file di configurazione Flutter con l'URL Vercel.

### 5.1 Crea file di config

Crea `app/lib/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'https://terra-gravel-backend.vercel.app';
  static const String apiVersion = 'v1';

  static String get apiBaseUrl => '$baseUrl/api/$apiVersion';

  // Endpoints
  static const String authSignup = '/auth/signup';
  static const String authLogin = '/auth/login';
  static const String rideMatchStack = '/ridematch/stack';
  static const String rideMatchSwipe = '/ridematch/swipe';
  // ... altri endpoints
}
```

### 5.2 Usa nelle chiamate API

```dart
import 'package:dio/dio.dart';
import 'package:terra_gravel/config/api_config.dart';

final dio = Dio(
  BaseOptions(
    baseURL: ApiConfig.apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  ),
);

// Esempio signup
final response = await dio.post(
  ApiConfig.authSignup,
  data: {
    'username': 'mario',
    'email': 'mario@example.com',
    'password': 'SecurePass123',
  },
);
```

---

## 🔐 Environment Variables - Riepilogo Completo

### Per Vercel (Production)

```env
# === OBBLIGATORIE ===
NODE_ENV=production
DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=a3f2d9e8b7c6d5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0

# === OPZIONALI (con default) ===
PORT=3000
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
SWIPE_RATE_LIMIT_MAX=200
FEEDBACK_RATE_LIMIT_MAX=10
MAX_FILE_SIZE=5242880
LOCATION_PRECISION=0.01
DEFAULT_MAX_DISTANCE_KM=20
MAX_STACK_SIZE=50
```

### Per GitHub Actions Secrets

```
VERCEL_TOKEN=xxxxxx
VERCEL_ORG_ID=team_xxxxxx
VERCEL_PROJECT_ID=prj_xxxxxx
DATABASE_URL=postgres://user:password@...
```

### Per Sviluppo Locale (.env)

```env
NODE_ENV=development
PORT=3000

# Database locale o Neon
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=terragravel
DB_SSL=false

# Oppure usa DATABASE_URL per Neon:
# DATABASE_URL=postgres://...

JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

---

## 🐛 Troubleshooting

### ❌ Error: "Database connection failed"

**Causa**: DATABASE_URL errato o database non raggiungibile

**Fix**:
1. Verifica DATABASE_URL su Vercel Environment Variables
2. Controlla che includa `?sslmode=require` alla fine
3. Testa connessione da Neon SQL Editor

### ❌ Error: "PostGIS not found"

**Causa**: Estensione PostGIS non installata

**Fix**:
```sql
-- Neon SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

### ❌ Error: "Build failed"

**Causa**: Root directory non configurata

**Fix**:
1. Vercel → Settings → General
2. Root Directory: `backend`
3. Clicca Save → Redeploy

### ❌ Error: "JWT token invalid"

**Causa**: JWT_SECRET diverso tra deploy

**Fix**:
- Usa lo stesso JWT_SECRET su Vercel e GitHub Secrets

### ❌ CORS Error da Flutter

**Causa**: CORS non configurato per Flutter

**Fix**:
```env
# Vercel Environment Variables
CORS_ORIGIN=http://localhost:8080,https://your-flutter-app.com
```

---

## 📊 Monitoring & Logs

### Vercel Logs

1. Dashboard Vercel → tuo progetto → **"Logs"**
2. Filtra per:
   - **Runtime logs**: Errori server
   - **Build logs**: Errori deployment

### Neon Monitoring

1. Dashboard Neon → **"Monitoring"**
2. Visualizza:
   - Query performance
   - Connessioni attive
   - Storage usage

---

## 🎯 Checklist Finale

- [ ] Account Neon creato e database configurato
- [ ] PostGIS e estensioni installate
- [ ] Schema database importato
- [ ] Connection string copiata
- [ ] Account Vercel creato
- [ ] Progetto importato con root directory `backend`
- [ ] Environment variables configurate
- [ ] Deployment completato con successo
- [ ] `/health` endpoint risponde
- [ ] Test signup API funziona
- [ ] GitHub Actions secrets configurati
- [ ] Auto-deploy testato
- [ ] Flutter configurato con URL Vercel

---

## 📞 Supporto

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **GitHub Issues**: Per problemi specifici al progetto

---

**Tempo stimato setup completo**: ~20-30 minuti

Buon deploy! 🚀
